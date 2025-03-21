// Variables globales
let currentPage = 1
let totalPages = 1
let historiqueData = []
let filteredData = []
let currentHistoriqueId = null
let currentFneId = null

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Charger les données depuis l'API
  loadHistoriqueData()

  // Configurer les écouteurs d'événements
  setupEventListeners()
})

// Fonction pour charger les données d'historique
function loadHistoriqueData() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#historique-table tbody")
  tableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 30px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
                <p>Chargement de l'historique...</p>
            </td>
        </tr>
    `

  // Faire une requête AJAX pour récupérer l'historique
  fetch("/auth/api/historique")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'historique")
      }
      return response.json()
    })
    .then((data) => {
      console.log("Données reçues:", data) // Pour le débogage
      historiqueData = data
      filteredData = [...historiqueData]
      totalPages = Math.ceil(filteredData.length / 10)

      // Afficher les données
      renderTable()
      updatePagination()
    })
    .catch((error) => {
      console.error("Erreur:", error)
      tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
                        <p>Erreur lors du chargement de l'historique. Veuillez réessayer.</p>
                        <button onclick="loadHistoriqueData()" class="btn btn-primary">Réessayer</button>
                    </td>
                </tr>
            `
    })
}

// Fonction pour configurer les écouteurs d'événements
function setupEventListeners() {
  // Recherche
  document.getElementById("searchBtn").addEventListener("click", () => {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase()
    filterData(searchTerm)
  })

  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      const searchTerm = e.target.value.toLowerCase()
      filterData(searchTerm)
    }
  })

  // Filtres
  document.getElementById("filterBtn").addEventListener("click", applyFilters)

  // Pagination
  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      renderTable()
      updatePagination()
    }
  })

  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++
      renderTable()
      updatePagination()
    }
  })
}

// Fonction pour filtrer les données
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...historiqueData]
  } else {
    searchTerm = searchTerm.toLowerCase()
    filteredData = historiqueData.filter((historique) => {
      // Adapter en fonction de la structure réelle de vos données
      return (
        historique.historique_id.toString().includes(searchTerm) ||
        historique.fne.fne_id.toString().includes(searchTerm) ||
        historique.action.toLowerCase().includes(searchTerm) ||
        (historique.utilisateur &&
          historique.utilisateur.nom &&
          historique.utilisateur.nom.toLowerCase().includes(searchTerm)) ||
        (historique.dateAction && formatDateTime(historique.dateAction).toLowerCase().includes(searchTerm))
      )
    })
  }

  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10)

  renderTable()
  updatePagination()
}

// Fonction pour appliquer les filtres
function applyFilters() {
  const actionFilter = document.getElementById("filterAction").value
  const dateDebut = document.getElementById("dateDebut").value
  const dateFin = document.getElementById("dateFin").value

  let tempData = [...historiqueData]

  if (actionFilter) {
    tempData = tempData.filter((historique) => historique.action === actionFilter)
  }

  // Filtrage par date
  if (dateDebut || dateFin) {
    tempData = tempData.filter((historique) => {
      const actionDate = new Date(historique.dateAction)

      // Vérifier la date de début
      if (dateDebut) {
        const debutDate = new Date(dateDebut)
        debutDate.setHours(0, 0, 0, 0) // Début de journée

        if (actionDate < debutDate) {
          return false
        }
      }

      // Vérifier la date de fin
      if (dateFin) {
        const finDate = new Date(dateFin)
        finDate.setHours(23, 59, 59, 999) // Fin de journée

        if (actionDate > finDate) {
          return false
        }
      }

      return true
    })
  }

  filteredData = tempData
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10)

  renderTable()
  updatePagination()
}

// Fonction pour afficher les données dans le tableau
function renderTable() {
  const tableBody = document.querySelector("#historique-table tbody")
  tableBody.innerHTML = ""

  const startIndex = (currentPage - 1) * 10
  const endIndex = Math.min(startIndex + 10, filteredData.length)

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px;">
                    <i class="fas fa-search" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
                    <p>Aucun historique trouvé. Veuillez modifier vos critères de recherche.</p>
                </td>
            </tr>
        `
    return
  }

  for (let i = startIndex; i < endIndex; i++) {
    const historique = filteredData[i]

    // Déterminer la classe du badge en fonction de l'action
    let actionClass = ""
    switch (historique.action) {
      case "Création":
        actionClass = "action-creation"
        break
      case "Modification":
        actionClass = "action-modification"
        break
      case "Validation":
        actionClass = "action-validation"
        break
      case "Refus":
        actionClass = "action-refus"
        break
    }

    // Récupérer les informations de l'utilisateur
    const utilisateurNom = historique.utilisateur
      ? `${historique.utilisateur.prenom || ""} ${historique.utilisateur.nom || ""}`.trim()
      : "Inconnu"

    // Récupérer les informations de la FNE
    const fneType = historique.fne.type_evt || ""
    const fneRef = historique.fne.REF_GNE || ""

    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${historique.historique_id}</td>
            <td>${historique.fne.fne_id}</td>
            <td>${fneType}</td>
            <td>${fneRef}</td>
            <td><span class="action-badge ${actionClass}">${historique.action}</span></td>
            <td>${formatDateTime(historique.dateAction)}</td>
            <td>${utilisateurNom}</td>
            <td>
                <button class="btn btn-view" onclick="viewHistoriqueDetails(${historique.historique_id})">
                    <i class="fas fa-eye"></i> Voir
                </button>
            </td>
        `

    tableBody.appendChild(row)
  }
}

// Fonction pour mettre à jour la pagination
function updatePagination() {
  document.getElementById("pageInfo").textContent = `Page ${currentPage} sur ${totalPages || 1}`

  document.getElementById("prevPage").disabled = currentPage <= 1
  document.getElementById("nextPage").disabled = currentPage >= totalPages
}

// Fonction pour formater la date et l'heure
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return ""

  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return new Date(dateTimeString).toLocaleDateString("fr-FR", options)
}

// Fonction pour afficher les détails d'une entrée d'historique
function viewHistoriqueDetails(historiqueId) {
  currentHistoriqueId = historiqueId

  // Afficher un indicateur de chargement dans le modal
  document.getElementById("modalHistoriqueId").textContent = historiqueId
  document.getElementById("historiqueDetailsModal").style.display = "block"

  // Récupérer les détails de l'historique
  fetch(`/auth/api/historique/${historiqueId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails de l'historique")
      }
      return response.json()
    })
    .then((historique) => {
      currentFneId = historique.fne.fne_id

      // Informations de base
      document.getElementById("detail-historique-id").textContent = historique.historique_id
      document.getElementById("detail-fne-id").textContent = historique.fne.fne_id

      // Action avec badge
      const detailAction = document.getElementById("detail-action")
      detailAction.textContent = historique.action
      detailAction.className = "action-badge" // Réinitialiser les classes

      // Ajouter la classe appropriée
      switch (historique.action) {
        case "Création":
          detailAction.classList.add("action-creation")
          break
        case "Modification":
          detailAction.classList.add("action-modification")
          break
        case "Validation":
          detailAction.classList.add("action-validation")
          break
        case "Refus":
          detailAction.classList.add("action-refus")
          break
      }

      document.getElementById("detail-date").textContent = formatDateTime(historique.dateAction)

      // Informations sur l'utilisateur
      const utilisateurNom = historique.utilisateur
        ? `${historique.utilisateur.prenom || ""} ${historique.utilisateur.nom || ""}`.trim()
        : "Inconnu"
      document.getElementById("detail-utilisateur").textContent = utilisateurNom

      // Informations sur la FNE
      document.getElementById("detail-fne-type").textContent = historique.fne.type_evt || ""
      document.getElementById("detail-fne-ref").textContent = historique.fne.REF_GNE || ""

      // Statut
      document.getElementById("detail-statut").textContent = historique.fne.statut || "En attente"
    })
    .catch((error) => {
      console.error("Erreur:", error)
      document.getElementById("historiqueDetailsModal").innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Erreur</h2>
                        <button class="close-modal" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Une erreur est survenue lors du chargement des détails de l'historique. Veuillez réessayer.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
                    </div>
                </div>
            `
    })
}

// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("historiqueDetailsModal").style.display = "none"
  currentHistoriqueId = null
  currentFneId = null
}

// Fonction pour voir la FNE associée
function viewFNE(fneId) {
  if (!fneId) return

  window.location.href = `/auth/fneAdmin?id=${fneId}&mode=view`
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("historiqueDetailsModal")
  if (event.target === modal) {
    closeModal()
  }
}

