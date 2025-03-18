// Variables globales
let currentPage = 1
let totalPages = 1
let historiqueData = []
let filteredData = []
let currentHistoriqueId = null
let currentFneId = null
let currentUserId = null

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Récupérer l'ID de l'utilisateur connecté
  getCurrentUser()
    .then((user) => {
      if (user && user.id) {
        currentUserId = user.id
        // Charger les données depuis l'API
        loadHistoriqueData()
      } else {
        console.error("Utilisateur non connecté ou ID non disponible")
        showError("Vous devez être connecté pour accéder à cette page.")
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération de l'utilisateur:", error)
      showError("Erreur lors de la récupération des informations utilisateur.")
    })

  // Configurer les écouteurs d'événements
  setupEventListeners()
})

// Fonction pour récupérer l'utilisateur connecté
async function getCurrentUser() {
  try {
    const response = await fetch("/auth/api/current-user")
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération de l'utilisateur connecté")
    }
    return await response.json()
  } catch (error) {
    console.error("Erreur:", error)
    return null
  }
}

// Fonction pour afficher une erreur
function showError(message) {
  const tableBody = document.querySelector("#historique-table tbody")
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 30px;">
        <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
        <p>${message}</p>
      </td>
    </tr>
  `
}

// Fonction pour charger les données d'historique de l'utilisateur connecté
function loadHistoriqueData() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#historique-table tbody")
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 30px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
        <p>Chargement de l'historique...</p>
      </td>
    </tr>
  `

  // Faire une requête AJAX pour récupérer l'historique de l'utilisateur connecté
  fetch(`/auth/api/historique/user/${currentUserId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'historique")
      }
      return response.json()
    })
    .then((data) => {
      console.log("Données reçues:", data) // Afficher les données pour déboguer
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
          <td colspan="6" style="text-align: center; padding: 30px;">
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
    filteredData = historiqueData.filter((historique) => {
      const historiqueId = historique.historique_id || ""
      const fneId = (historique.fne && historique.fne.fne_id) || ""
      const action = historique.action || ""
      const dateAction = formatDateTime(historique.dateAction || "").toLowerCase()
      const typeEvt = (historique.fne && historique.fne.type_evt) || ""
      const refGne = (historique.fne && historique.fne.REF_GNE) || ""

      searchTerm = searchTerm.toLowerCase()

      return (
        historiqueId.toString().includes(searchTerm) ||
        fneId.toString().includes(searchTerm) ||
        action.toLowerCase().includes(searchTerm) ||
        dateAction.includes(searchTerm) ||
        typeEvt.toLowerCase().includes(searchTerm) ||
        refGne.toLowerCase().includes(searchTerm)
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
  const heureDebut = document.getElementById("heureDebut").value
  const heureFin = document.getElementById("heureFin").value

  console.log("Filtres appliqués:", {
    action: actionFilter,
    dateDebut: dateDebut,
    dateFin: dateFin,
    heureDebut: heureDebut,
    heureFin: heureFin,
  })

  // Commencer avec toutes les données
  let tempData = [...historiqueData]

  // Filtrer par action
  if (actionFilter) {
    tempData = tempData.filter((historique) => historique.action === actionFilter)
  }

  // Filtrage par date et heure
  if (dateDebut || dateFin || heureDebut || heureFin) {
    tempData = tempData.filter((historique) => {
      // Vérifier si dateAction existe
      if (!historique.dateAction) {
        return false
      }

      const actionDate = new Date(historique.dateAction)
      console.log("Date de l'action:", actionDate, "pour historique ID:", historique.historique_id)

      // Vérifier la date de début
      if (dateDebut) {
        const debutDate = new Date(dateDebut)
        debutDate.setHours(0, 0, 0, 0) // Début de journée
        console.log("Date début:", debutDate)

        if (actionDate < debutDate) {
          return false
        }
      }

      // Vérifier la date de fin
      if (dateFin) {
        const finDate = new Date(dateFin)
        finDate.setHours(23, 59, 59, 999) // Fin de journée
        console.log("Date fin:", finDate)

        if (actionDate > finDate) {
          return false
        }
      }

      // Vérifier l'heure de début
      if (heureDebut) {
        const [heureDebutH, heureDebutM] = heureDebut.split(":").map(Number)
        const actionHeure = actionDate.getHours()
        const actionMinute = actionDate.getMinutes()

        if (actionHeure < heureDebutH || (actionHeure === heureDebutH && actionMinute < heureDebutM)) {
          return false
        }
      }

      // Vérifier l'heure de fin
      if (heureFin) {
        const [heureFinH, heureFinM] = heureFin.split(":").map(Number)
        const actionHeure = actionDate.getHours()
        const actionMinute = actionDate.getMinutes()

        if (actionHeure > heureFinH || (actionHeure === heureFinH && actionMinute > heureFinM)) {
          return false
        }
      }

      return true
    })
  }

  console.log("Nombre d'éléments après filtrage:", tempData.length)
  filteredData = tempData
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1

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
        <td colspan="6" style="text-align: center; padding: 30px;">
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

    // Extraire les IDs et les valeurs avec sécurité
    const historiqueId = historique.historique_id || ""
    const fneId = (historique.fne && historique.fne.fne_id) || ""

    // Formater la date
    const dateAction = formatDateTime(historique.dateAction || "")

    // Formater l'utilisateur
    let utilisateur = ""
    if (historique.utilisateur) {
      const nom = historique.utilisateur.nom || ""
      const prenom = historique.utilisateur.prenom || ""
      utilisateur = `${nom} ${prenom}`.trim()
    }

    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${historiqueId}</td>
      <td>${fneId}</td>
      <td><span class="action-badge ${actionClass}">${historique.action || ""}</span></td>
      <td>${dateAction}</td>
      <td>${utilisateur}</td>
      <td>
        <button class="btn btn-view" onclick="viewHistoriqueDetails(${historiqueId})">
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
  if (!historiqueId) {
    console.error("L'ID de l'historique est indéfini.")
    return
  }

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
      console.log("Détails historique:", historique) // Afficher les détails pour déboguer

      // Extraire les valeurs avec sécurité
      const historiqueId = historique.historique_id || ""

      // Vérifier si fne existe et extraire ses propriétés
      let fneId = ""
      let typeEvt = ""
      let refGne = ""
      let statut = ""
      let fneDate = ""
      let fneLieu = ""

      if (historique.fne) {
        fneId = historique.fne.fne_id || ""
        typeEvt = historique.fne.type_evt || ""
        refGne = historique.fne.REF_GNE || ""
        statut = historique.fne.statut || ""
        fneDate = historique.fne.Date ? formatDate(historique.fne.Date) : ""
        fneLieu = historique.fne.lieu_EVT || ""
      }

      // Stocker l'ID de la FNE pour le bouton "Voir la FNE"
      currentFneId = fneId

      // Formater la date
      const dateAction = formatDateTime(historique.dateAction || "")

      // Formater l'utilisateur
      let utilisateur = ""
      if (historique.utilisateur) {
        const nom = historique.utilisateur.nom || ""
        const prenom = historique.utilisateur.prenom || ""
        utilisateur = `${nom} ${prenom}`.trim()
      }

      // Informations de base
      document.getElementById("detail-historique-id").textContent = historiqueId
      document.getElementById("detail-fne-id").textContent = fneId
      document.getElementById("detail-date").textContent = dateAction
      document.getElementById("detail-utilisateur").textContent = utilisateur

      // Informations sur la FNE
      document.getElementById("detail-fne-type").textContent = typeEvt
      document.getElementById("detail-fne-ref").textContent = refGne
      document.getElementById("detail-fne-date").textContent = fneDate
      document.getElementById("detail-fne-lieu").textContent = fneLieu

      // Statut avec badge
      const detailStatut = document.getElementById("detail-fne-statut")
      detailStatut.textContent = statut
      detailStatut.className = "status-badge" // Réinitialiser les classes

      // Ajouter la classe appropriée pour le statut
      switch (statut) {
        case "En attente":
          detailStatut.classList.add("status-pending")
          break
        case "Validé":
          detailStatut.classList.add("status-approved")
          break
        case "Refusé":
          detailStatut.classList.add("status-rejected")
          break
      }

      // Action avec badge
      const detailAction = document.getElementById("detail-action")
      detailAction.textContent = historique.action || ""
      detailAction.className = "action-badge" // Réinitialiser les classes

      // Ajouter la classe appropriée pour l'action
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

      // Afficher les modifications (si disponibles)
      const changesContainer = document.getElementById("detail-changes")
      changesContainer.innerHTML = ""

      if (!historique.modifications || historique.modifications.length === 0) {
        changesContainer.innerHTML = "<p>Aucune modification détaillée disponible.</p>"
      } else {
        const changesList = document.createElement("ul")
        changesList.className = "changes-list"

        historique.modifications.forEach((modification) => {
          const changeItem = document.createElement("li")
          changeItem.className = "change-item"

          const fieldName = formatFieldName(modification.champ)
          const oldValue = modification.ancienne_valeur || "Non défini"
          const newValue = modification.nouvelle_valeur || "Non défini"

          changeItem.innerHTML = `
            <div class="change-field">${fieldName}</div>
            <div class="change-values">
              <div class="old-value">
                <span class="label">Avant:</span> 
                <span class="value">${oldValue}</span>
              </div>
              <div class="new-value">
                <span class="label">Après:</span> 
                <span class="value">${newValue}</span>
              </div>
            </div>
          `

          changesList.appendChild(changeItem)
        })

        changesContainer.appendChild(changesList)
      }
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

// Fonction pour formater le nom des champs
function formatFieldName(fieldName) {
  if (!fieldName) return ""

  const fieldMappings = {
    description_evt: "Description",
    impacts_operationnels: "Impacts opérationnels",
    statut: "Statut",
    lieu_EVT: "Lieu",
    commentaire: "Commentaire",
    type_evt: "Type d'événement",
    REF_GNE: "Référence GNE",
    Date: "Date",
    heure_UTC: "Heure UTC",
    Organisme_concerné: "Organisme concerné",
  }

  return fieldMappings[fieldName] || fieldName
}

// Fonction pour formater la date
function formatDate(dateString) {
  if (!dateString) return ""

  const options = { day: "2-digit", month: "2-digit", year: "numeric" }
  return new Date(dateString).toLocaleDateString("fr-FR", options)
}

// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("historiqueDetailsModal").style.display = "none"
  currentHistoriqueId = null
  currentFneId = null
}

// Fonction pour voir la FNE associée
function voirFNE(fneId) {
  if (!fneId) return

  window.location.href = `/auth/fneSML?id=${fneId}&mode=view`
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("historiqueDetailsModal")
  if (event.target === modal) {
    closeModal()
  }
}

// Fonction pour réinitialiser les filtres
function resetFilters() {
  // Réinitialiser les valeurs des filtres
  document.getElementById("filterAction").value = ""
  document.getElementById("dateDebut").value = ""
  document.getElementById("dateFin").value = ""
  document.getElementById("heureDebut").value = ""
  document.getElementById("heureFin").value = ""

  // Réinitialiser les données filtrées
  filteredData = [...historiqueData]
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1

  // Mettre à jour l'affichage
  renderTable()
  updatePagination()
}

