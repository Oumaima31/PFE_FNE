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
            <td colspan="6" style="text-align: center; padding: 30px;">
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
    searchTerm = searchTerm.toLowerCase()
    filteredData = historiqueData.filter((historique) => {
      // Adapter en fonction de la structure réelle de vos données
      return (
        historique.id.toString().includes(searchTerm) ||
        historique.fne_id.toString().includes(searchTerm) ||
        historique.action.toLowerCase().includes(searchTerm) ||
        (historique.utilisateur && historique.utilisateur.toLowerCase().includes(searchTerm)) ||
        formatDateTime(historique.date_action).toLowerCase().includes(searchTerm)
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

  let tempData = [...historiqueData]

  if (actionFilter) {
    tempData = tempData.filter((historique) => historique.action === actionFilter)
  }

  // Filtrage par date et heure
  if (dateDebut || dateFin || heureDebut || heureFin) {
    tempData = tempData.filter((historique) => {
      const actionDate = new Date(historique.date_action)

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

    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${historique.id}</td>
            <td>${historique.fne_id}</td>
            <td><span class="action-badge ${actionClass}">${historique.action}</span></td>
            <td>${formatDateTime(historique.date_action)}</td>
            <td>${historique.utilisateur || ""}</td>
            <td>
                <button class="btn btn-view" onclick="viewHistoriqueDetails(${historique.id})">
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
      currentFneId = historique.fne_id

      // Informations de base
      document.getElementById("detail-historique-id").textContent = historique.id
      document.getElementById("detail-fne-id").textContent = historique.fne_id

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

      document.getElementById("detail-date").textContent = formatDateTime(historique.date_action)
      document.getElementById("detail-utilisateur").textContent = historique.utilisateur || ""

      // Récupérer les détails de la FNE associée
      fetch(`/auth/api/fne/${historique.fne_id}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erreur lors de la récupération des détails de la FNE")
          }
          return response.json()
        })
        .then((fne) => {
          // Adapter en fonction de la structure réelle de vos données
          let fneType = ""
          switch (fne.type_evt) {
            case "accident":
              fneType = "Accident"
              break
            case "incident":
              fneType = "Incident"
              break
            case "incident_grave":
              fneType = "Incident grave"
              break
            case "evt_technique":
              fneType = "Événement technique"
              break
            default:
              fneType = fne.type_evt
          }

          // Informations sur la FNE
          document.getElementById("detail-fne-type").textContent = fneType
          document.getElementById("detail-fne-ref").textContent = fne.REF_GNE || ""
          document.getElementById("detail-fne-date").textContent = formatDate(fne.Date)
          document.getElementById("detail-fne-lieu").textContent = fne.Lieu_EVT || ""

          // Statut avec badge
          const detailStatut = document.getElementById("detail-fne-statut")
          detailStatut.textContent = fne.statut || "En attente"
          detailStatut.className = "status-badge" // Réinitialiser les classes

          // Ajouter la classe appropriée
          switch (fne.statut) {
            case "En attente":
              detailStatut.classList.add("status-pending")
              break
            case "Validé":
              detailStatut.classList.add("status-approved")
              break
            case "Refusé":
              detailStatut.classList.add("status-rejected")
              break
            case "En cours de traitement":
              detailStatut.classList.add("status-processing")
              break
          }
        })
        .catch((error) => {
          console.error("Erreur:", error)
          document.getElementById("detail-fne-type").textContent = "Erreur de chargement"
          document.getElementById("detail-fne-ref").textContent = "Erreur de chargement"
          document.getElementById("detail-fne-date").textContent = "Erreur de chargement"
          document.getElementById("detail-fne-lieu").textContent = "Erreur de chargement"
          document.getElementById("detail-fne-statut").textContent = "Erreur de chargement"
        })

      // Modifications
      const changesContainer = document.getElementById("detail-changes")
      changesContainer.innerHTML = ""

      if (!historique.modifications || historique.modifications.length === 0) {
        changesContainer.innerHTML = "<p>Aucune modification spécifique enregistrée pour cette action.</p>"
      } else {
        historique.modifications.forEach((modification) => {
          const changeItem = document.createElement("div")
          changeItem.className = "change-item"

          changeItem.innerHTML = `
                        <span class="change-field">${formatFieldName(modification.champ)}:</span> 
                        <span class="change-old">${modification.ancienne_valeur || "(vide)"}</span>
                        <span class="change-arrow"><i class="fas fa-arrow-right"></i></span>
                        <span class="change-new">${modification.nouvelle_valeur || "(vide)"}</span>
                    `

          changesContainer.appendChild(changeItem)
        })
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
    Lieu_EVT: "Lieu",
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

  window.location.href = `/auth/fneAdmin?id=${fneId}&mode=view`
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("historiqueDetailsModal")
  if (event.target === modal) {
    closeModal()
  }
}

