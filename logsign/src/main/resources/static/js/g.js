// Variables globales
let currentPage = 1
let totalPages = 1
let fneData = []
let filteredData = []
let currentFneId = null
const userRole = document.getElementById("userRoleValue")
  ? document.getElementById("userRoleValue").textContent.trim()
  : ""
const userId = document.getElementById("userId") ? document.getElementById("userId").textContent.trim() : ""

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM chargé, initialisation...")
  console.log("Rôle utilisateur:", userRole)
  console.log("ID utilisateur:", userId)

  // Charger les données depuis l'API
  loadFNEData()

  // Configurer les écouteurs d'événements
  setupEventListeners()

  // Vérifier s'il y a un message de succès dans l'URL
  checkForSuccessMessage()
})

// Fonction pour vérifier et afficher le message de succès
function checkForSuccessMessage() {
  const urlParams = new URLSearchParams(window.location.search)
  const successMessage = urlParams.get("success")

  if (successMessage) {
    const messageElement = document.getElementById("successMessage")
    const messageTextElement = document.getElementById("successMessageText")

    messageTextElement.textContent = decodeURIComponent(successMessage)
    messageElement.style.display = "block"

    // Faire défiler jusqu'au message
    messageElement.scrollIntoView({ behavior: "smooth", block: "center" })

    // Masquer le message après 5 secondes
    setTimeout(() => {
      messageElement.style.display = "none"
    }, 5000)

    // Nettoyer l'URL sans recharger la page
    const url = new URL(window.location)
    url.searchParams.delete("success")
    window.history.replaceState({}, "", url)
  }
}

// Fonction pour charger les données FNE
function loadFNEData() {
  console.log("Chargement des données FNE...")

  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#fne-table tbody")
  tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 30px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
                <p>Chargement des données...</p>
            </td>
        </tr>
    `

  // Faire une requête AJAX pour récupérer les FNE
  // Utiliser l'endpoint /auth/api/gestionFNE qui est maintenant correctement filtré par rôle
  fetch("/auth/api/gestionFNE")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données")
      }
      return response.json()
    })
    .then((data) => {
      console.log("Données FNE reçues:", data)
      fneData = data
      filteredData = [...fneData]
      totalPages = Math.ceil(filteredData.length / 10) || 1

      // Afficher les données
      renderTable()
      updatePagination()
    })
    .catch((error) => {
      console.error("Erreur:", error)
      tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 30px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
                        <p>Erreur lors du chargement des données. Veuillez réessayer.</p>
                        <button onclick="loadFNEData()" class="btn btn-primary">Réessayer</button>
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

  // Filtres - vérifier si les éléments existent (pour admin et SML uniquement)
  const filterBtn = document.getElementById("filterBtn")
  const resetBtn = document.getElementById("resetBtn")

  if (filterBtn) {
    filterBtn.addEventListener("click", applyFilters)
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetFilters)
  }

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
    filteredData = [...fneData]
  } else {
    const searchInDescription = document.getElementById("searchInDescription").checked
    const caseSensitive = document.getElementById("searchCaseSensitive").checked

    // Ajuster le terme de recherche en fonction de la sensibilité à la casse
    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase()

    filteredData = fneData.filter((fne) => {
      // Fonction pour vérifier si une valeur correspond au terme de recherche
      const matchesSearchTerm = (value) => {
        if (!value) return false

        if (caseSensitive) {
          return String(value).includes(term)
        } else {
          return String(value).toLowerCase().includes(term)
        }
      }

      // Vérifier les champs de base
      const basicFieldsMatch =
        matchesSearchTerm(fne.fne_id) ||
        matchesSearchTerm(fne.type_evt) ||
        matchesSearchTerm(fne.ref_gne) ||
        matchesSearchTerm(fne.statut) ||
        matchesSearchTerm(fne.lieu_EVT) ||
        (fne.utilisateur && (matchesSearchTerm(fne.utilisateur.nom) || matchesSearchTerm(fne.utilisateur.prenom)))

      // Si l'option de recherche dans la description est activée, vérifier également la description
      const descriptionMatch = searchInDescription && matchesSearchTerm(fne.description_evt)

      return basicFieldsMatch || descriptionMatch
    })
  }

  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1

  renderTable()
  updatePagination()

  // Afficher un message indiquant le nombre de résultats trouvés
  showNotification(
    `${filteredData.length} FNE${filteredData.length > 1 ? "s" : ""} trouvée${filteredData.length > 1 ? "s" : ""}`,
    "info",
  )
}

// Fonction pour appliquer les filtres
function applyFilters() {
  // Vérifier si les éléments de filtrage existent
  const filterAeroport = document.getElementById("filterAeroport")
  const filterStatus = document.getElementById("filterStatus")
  const filterType = document.getElementById("filterType")
  const dateFilter = document.getElementById("dateFilter")
  const timeFilter = document.getElementById("timeFilter")

  const aeroport = filterAeroport ? filterAeroport.value : ""
  const status = filterStatus ? filterStatus.value : ""
  const type = filterType ? filterType.value : ""
  const dateFilterValue = dateFilter ? dateFilter.value : ""
  const timeFilterValue = timeFilter ? timeFilter.value : ""

  let tempData = [...fneData]

  // Filtrer par aéroport (lié à l'utilisateur)
  if (aeroport) {
    tempData = tempData.filter((fne) => {
      // Vérifier si l'utilisateur existe et si son aéroport correspond
      if (fne.utilisateur && fne.utilisateur.aeroport) {
        return fne.utilisateur.aeroport === aeroport
      }
      // Si le lieu_EVT est défini, vérifier aussi ce champ comme fallback
      if (fne.lieu_EVT) {
        return fne.lieu_EVT === aeroport
      }
      return false
    })
  }

  // Filtrer par statut
  if (status) {
    tempData = tempData.filter((fne) => fne.statut === status)
  }

  // Filtrer par type d'événement
  if (type) {
    tempData = tempData.filter((fne) => fne.type_evt === type)
  }

  // Filtrer par date
  if (dateFilterValue) {
    const filterDate = new Date(dateFilterValue)
    tempData = tempData.filter((fne) => {
      if (!fne.date) return false
      const fneDate = new Date(fne.date)
      return (
        fneDate.getFullYear() === filterDate.getFullYear() &&
        fneDate.getMonth() === filterDate.getMonth() &&
        fneDate.getDate() === filterDate.getDate()
      )
    })
  }

  // Filtrer par heure
  if (timeFilterValue) {
    const [filterHour, filterMinute] = timeFilterValue.split(":").map(Number)
    tempData = tempData.filter((fne) => {
      if (!fne.heure_UTC) return false
      const fneTime = fne.heure_UTC.split(":")
      const fneHour = Number.parseInt(fneTime[0])
      const fneMinute = Number.parseInt(fneTime[1])
      return fneHour === filterHour && fneMinute === filterMinute
    })
  }

  filteredData = tempData
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1

  renderTable()
  updatePagination()

  // Afficher un message indiquant le nombre de résultats trouvés après filtrage
  showNotification(
    `${filteredData.length} FNE${filteredData.length > 1 ? "s" : ""} correspond${filteredData.length > 1 ? "ent" : ""} aux filtres appliqués`,
    "info",
  )
}

// Fonction pour réinitialiser les filtres
function resetFilters() {
  document.getElementById("searchInput").value = ""

  // Vérifier si les éléments de filtrage existent
  const filterAeroport = document.getElementById("filterAeroport")
  const filterStatus = document.getElementById("filterStatus")
  const filterType = document.getElementById("filterType")
  const dateFilter = document.getElementById("dateFilter")
  const timeFilter = document.getElementById("timeFilter")

  if (filterAeroport) filterAeroport.value = ""
  if (filterStatus) filterStatus.value = ""
  if (filterType) filterType.value = ""
  if (dateFilter) dateFilter.value = ""
  if (timeFilter) timeFilter.value = ""

  document.getElementById("searchInDescription").checked = true
  document.getElementById("searchCaseSensitive").checked = false

  filteredData = [...fneData]
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1

  renderTable()
  updatePagination()

  showNotification("Filtres réinitialisés", "info")
}

// Fonction pour afficher les données dans le tableau
function renderTable() {
  const tableBody = document.querySelector("#fne-table tbody")
  tableBody.innerHTML = ""

  const startIndex = (currentPage - 1) * 10
  const endIndex = Math.min(startIndex + 10, filteredData.length)

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px;">
                    <i class="fas fa-search" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
                    <p>Aucune FNE trouvée. Veuillez modifier vos critères de recherche.</p>
                </td>
            </tr>
        `
    return
  }

  for (let i = startIndex; i < endIndex; i++) {
    const fne = filteredData[i]

    // Déterminer la classe du badge en fonction du statut
    let statusClass = ""
    switch (fne.statut) {
      case "En attente":
        statusClass = "action-creation"
        break
      case "Validé":
        statusClass = "action-validation"
        break
      case "Refusé":
        statusClass = "action-refus"
        break
      default:
        statusClass = "action-modification"
    }

    // Formater la date
    let dateCreation = ""
    if (fne.date) {
      const date = new Date(fne.date)
      dateCreation = date.toLocaleDateString("fr-FR")
    }

    // Récupérer le nom de l'utilisateur
    let userName = "Utilisateur inconnu"
    if (fne.utilisateur) {
      userName = `${fne.utilisateur.prenom || ""} ${fne.utilisateur.nom || ""}`.trim()
    }

    // Créer la ligne du tableau
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${fne.fne_id}</td>
            <td>${fne.type_evt || ""}</td>
            <td>${fne.ref_gne || ""}</td>
            <td>${userName}</td>
            <td>${dateCreation}</td>
            <td><span class="action-badge ${statusClass}">${fne.statut}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-view" onclick="viewFNE(${fne.fne_id})">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                    ${
                      canModifyFNE(fne)
                        ? `
                        <button class="btn btn-warning" onclick="editFNE(${fne.fne_id})">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                    `
                        : ""
                    }
                    ${
                      userRole === "admin"
                        ? `
                        <button class="btn btn-danger" onclick="deleteFNE(${fne.fne_id})">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    `
                        : ""
                    }
                </div>
            </td>
        `

    tableBody.appendChild(row)
  }
}

// Fonction pour vérifier si l'utilisateur peut modifier une FNE
function canModifyFNE(fne) {
  if (userRole === "admin") {
    return true
  }

  if (userRole === "SML" && fne.statut === "En attente" && fne.utilisateur && fne.utilisateur.id == userId) {
    return true
  }

  return false
}

// Fonction pour mettre à jour la pagination
function updatePagination() {
  document.getElementById("pageInfo").textContent = `Page ${currentPage} sur ${totalPages || 1}`
  document.getElementById("prevPage").disabled = currentPage <= 1
  document.getElementById("nextPage").disabled = currentPage >= totalPages
}

// Fonction pour afficher les détails d'une FNE
function viewFNE(fneId) {
  currentFneId = fneId

  // Récupérer les détails de la FNE
  fetch(`/auth/api/fne/${fneId}`)
    .then((response) => {
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Vous n'êtes pas autorisé à voir cette FNE")
        } else if (response.status === 404) {
          throw new Error("FNE non trouvée")
        } else {
          throw new Error("Erreur lors de la récupération des détails de la FNE")
        }
      }
      return response.json()
    })
    .then((fne) => {
      // Récupérer l'historique de la FNE
      return fetch(`/auth/api/historique/fne/${fneId}`).then((historyResponse) => {
        if (!historyResponse.ok) {
          console.warn("Impossible de récupérer l'historique de la FNE")
          return { fne, historique: [] }
        }
        return historyResponse.json().then((historique) => ({ fne, historique }))
      })
    })
    .then(({ fne, historique }) => {
      // Afficher le modal avec les détails
      document.getElementById("modalFneId").textContent = fne.fne_id

      // Générer le contenu du modal
      const modalBody = document.querySelector("#fneDetailsModal .modal-body")
      modalBody.innerHTML = generateFNEDetailsHTML(fne, historique)

      // Configurer les boutons d'action
      const editBtn = document.getElementById("editFneBtn")
      const deleteBtn = document.getElementById("deleteFneBtn")
      const viewPdfBtn = document.getElementById("viewPdfBtn")

      // Vérifier que les boutons existent avant de manipuler leur style
      if (editBtn) {
        if (canModifyFNE(fne)) {
          editBtn.style.display = "inline-flex"
          editBtn.onclick = () => editFNE(fne.fne_id)
        } else {
          editBtn.style.display = "none"
        }
      }

      if (deleteBtn) {
        if (userRole === "admin") {
          deleteBtn.style.display = "inline-flex"
          deleteBtn.onclick = () => deleteFNE(fne.fne_id)
        } else {
          deleteBtn.style.display = "none"
        }
      }

      if (viewPdfBtn) {
        viewPdfBtn.onclick = () => viewFNEPdf(fne.fne_id)
      }

      // Afficher le modal
      const modal = document.getElementById("fneDetailsModal")
      if (modal) {
        modal.style.display = "block"
      }

      // Ajouter les écouteurs d'événements pour les boutons d'historique
      document.querySelectorAll(".history-event").forEach((button) => {
        button.addEventListener("click", function () {
          const eventId = this.getAttribute("data-event-id")
          showEventDetails(eventId, historique)
        })
      })
    })
    .catch((error) => {
      console.error("Erreur:", error)
      showNotification(error.message || "Erreur lors du chargement des détails de la FNE", "error")
    })
}

// Fonction pour afficher les détails d'un événement d'historique
function showEventDetails(eventId, historique) {
  // Trouver l'événement correspondant
  const event = historique.find((h) => h.id == eventId)
  if (!event) return

  // Créer le modal s'il n'existe pas déjà
  let eventModal = document.getElementById("eventDetailsModal")
  if (!eventModal) {
    eventModal = document.createElement("div")
    eventModal.id = "eventDetailsModal"
    eventModal.className = "event-modal"
    document.body.appendChild(eventModal)
  }

  // Formatter la date
  const eventDate = new Date(event.dateAction)
  const formattedDate = eventDate.toLocaleDateString("fr-FR") + " à " + eventDate.toLocaleTimeString("fr-FR")

  // Récupérer le nom de l'utilisateur
  let userName = "Utilisateur inconnu"
  if (event.utilisateur) {
    userName = `${event.utilisateur.prenom || ""} ${event.utilisateur.nom || ""}`.trim()
  }

  // Générer le contenu du modal
  let modificationsHTML = ""
  if (event.modifications && event.modifications.length > 0) {
    modificationsHTML = `
      <h3>Détails des modifications</h3>
      <table class="modifications-table">
        <thead>
          <tr>
            <th>Champ</th>
            <th>Ancienne valeur</th>
            <th>Nouvelle valeur</th>
          </tr>
        </thead>
        <tbody>
    `

    event.modifications.forEach((mod) => {
      modificationsHTML += `
        <tr>
          <td>${mod.champ || ""}</td>
          <td>${mod.ancienne_valeur || ""}</td>
          <td>${mod.nouvelle_valeur || ""}</td>
        </tr>
      `
    })

    modificationsHTML += `
        </tbody>
      </table>
    `
  }

  // Déterminer l'icône en fonction du type d'action
  let actionIcon = ""
  switch (event.action) {
    case "Création":
      actionIcon = '<i class="fas fa-plus-circle"></i>'
      break
    case "Modification":
      actionIcon = '<i class="fas fa-edit"></i>'
      break
    case "Validation":
      actionIcon = '<i class="fas fa-check-circle"></i>'
      break
    case "Refus":
      actionIcon = '<i class="fas fa-times-circle"></i>'
      break
    default:
      actionIcon = '<i class="fas fa-info-circle"></i>'
  }

  eventModal.innerHTML = `
    <div class="event-modal-content">
      <div class="event-modal-header">
        <h2 class="event-modal-title">${actionIcon} ${event.action}</h2>
        <button class="event-modal-close" onclick="closeEventModal()">&times;</button>
      </div>
      <div class="event-modal-body">
        <div class="event-info">
          <div class="event-info-item">
            <div class="event-info-label">Date:</div>
            <div class="event-info-value">${formattedDate}</div>
          </div>
          <div class="event-info-item">
            <div class="event-info-label">Utilisateur:</div>
            <div class="event-info-value">${userName}</div>
          </div>
          <div class="event-info-item">
            <div class="event-info-label">Action:</div>
            <div class="event-info-value">${event.action}</div>
          </div>
        </div>
        ${modificationsHTML}
      </div>
      <div class="event-modal-footer">
        <button class="event-modal-close-btn" onclick="closeEventModal()">Fermer</button>
      </div>
    </div>
  `

  // Afficher le modal
  eventModal.style.display = "block"
}

// Fonction pour fermer le modal d'événement
function closeEventModal() {
  const eventModal = document.getElementById("eventDetailsModal")
  if (eventModal) {
    eventModal.style.display = "none"
  }
}

// Fonction pour générer le HTML des détails d'une FNE
function generateFNEDetailsHTML(fne, historique) {
  // Récupérer le nom de l'utilisateur
  let userName = "Utilisateur inconnu"
  if (fne.utilisateur) {
    userName = `${fne.utilisateur.prenom || ""} ${fne.utilisateur.nom || ""}`.trim()
  }

  // Formater la date
  let dateCreation = ""
  if (fne.date) {
    const date = new Date(fne.date)
    dateCreation = date.toLocaleDateString("fr-FR")
  }

  // Déterminer la classe du badge en fonction du statut
  let statusClass = ""
  switch (fne.statut) {
    case "En attente":
      statusClass = "action-creation"
      break
    case "Validé":
      statusClass = "action-validation"
      break
    case "Refusé":
      statusClass = "action-refus"
      break
    default:
      statusClass = "action-modification"
  }

  // Générer le HTML pour l'historique
  let historiqueHTML = ""
  if (historique && historique.length > 0) {
    // Trier l'historique par date (du plus ancien au plus récent)
    historique.sort((a, b) => {
      const dateA = new Date(a.dateAction)
      const dateB = new Date(b.dateAction)
      return dateA - dateB
    })

    historiqueHTML = `<div class="history-timeline">`

    // Ajouter chaque entrée d'historique
    historique.forEach((entry) => {
      const dateAction = new Date(entry.dateAction)
      const formattedDate = dateAction.toLocaleDateString("fr-FR")
      const formattedTime = dateAction.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

      let actionClass = ""
      let actionIcon = ""
      switch (entry.action) {
        case "Création":
          actionClass = "creation"
          actionIcon = '<i class="fas fa-plus"></i>'
          break
        case "Modification":
          actionClass = "modification"
          actionIcon = '<i class="fas fa-edit"></i>'
          break
        case "Validation":
          actionClass = "validation"
          actionIcon = '<i class="fas fa-check"></i>'
          break
        case "Refus":
          actionClass = "refus"
          actionIcon = '<i class="fas fa-times"></i>'
          break
        default:
          actionClass = ""
          actionIcon = '<i class="fas fa-info"></i>'
      }

      // Récupérer le nom de l'utilisateur qui a effectué l'action
      let actionUserName = "Utilisateur inconnu"
      if (entry.utilisateur) {
        actionUserName = `${entry.utilisateur.prenom || ""} ${entry.utilisateur.nom || ""}`.trim()
      }

      historiqueHTML += `
        <div class="history-event" data-event-id="${entry.id}">
          <div class="event-icon ${actionClass}">${actionIcon}</div>
          <div class="event-details">
            <div class="event-type">${entry.action}</div>
            <div class="event-date">${formattedDate} à ${formattedTime}</div>
            <div class="event-user">${actionUserName}</div>
          </div>
        </div>
      `
    })

    historiqueHTML += `</div>`
  }

  return `
        <div class="fne-details">
            ${historiqueHTML}
            
            <div class="detail-section">
                <h3>Informations générales</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Type d'événement:</label>
                        <span>${fne.type_evt || ""}</span>
                    </div>
                    <div class="detail-item">
                        <label>REF GNE:</label>
                        <span>${fne.ref_gne || ""}</span>
                    </div>
                    <div class="detail-item">
                        <label>Organisme concerné:</label>
                        <span>${fne.organisme_concerné || ""}</span>
                    </div>
                    <div class="detail-item">
                        <label>Date:</label>
                        <span>${dateCreation}</span>
                    </div>
                    <div class="detail-item">
                        <label>Heure UTC:</label>
                        <span>${fne.heure_UTC || ""}</span>
                    </div>
                    <div class="detail-item">
                        <label>Lieu de l'événement:</label>
                        <span>${fne.lieu_EVT || ""}</span>
                    </div>
                    <div class="detail-item">
                        <label>Statut:</label>
                        <span class="action-badge ${statusClass}">${fne.statut}</span>
                    </div>
                    <div class="detail-item">
                        <label>Créé par:</label>
                        <span>${userName}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Description de l'événement</h3>
                <div class="detail-description">
                    ${fne.description_evt ? fne.description_evt.replace(/\n/g, "<br>") : "Aucune description fournie."}
                </div>
            </div>
        </div>
    `
}

// Fonction pour modifier une FNE
function editFNE(fneId) {
  // Vérifier d'abord si l'utilisateur peut modifier cette FNE
  fetch(`/auth/api/fne/${fneId}`)
    .then((response) => response.json())
    .then((fne) => {
      if (canModifyFNE(fne)) {
        window.location.href = `/auth/ajoutFNE?id=${fneId}`
      } else {
        showNotification("Vous n'êtes pas autorisé à modifier cette FNE", "error")
      }
    })
    .catch((error) => {
      console.error("Erreur:", error)
      showNotification("Erreur lors de la récupération de la FNE", "error")
    })
}

// Fonction pour supprimer une FNE
function deleteFNE(fneId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette FNE ? Cette action est irréversible.")) {
    return
  }

  fetch(`/auth/api/gestionFNE/${fneId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification("FNE supprimée avec succès", "success")
        closeModal()
        loadFNEData() // Recharger les données
      } else {
        showNotification(data.message || "Erreur lors de la suppression", "error")
      }
    })
    .catch((error) => {
      console.error("Erreur:", error)
      showNotification("Erreur lors de la suppression de la FNE", "error")
    })
}

// Fonction pour voir la FNE en format PDF
function viewFNEPdf(fneId) {
  // Fermer le modal de détails
  const detailsModal = document.getElementById("fneDetailsModal")
  if (detailsModal) {
    detailsModal.style.display = "none"
  }

  // Récupérer les détails de la FNE pour le PDF
  fetch(`/auth/api/fne/${fneId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails de la FNE")
      }
      return response.json()
    })
    .then((fne) => {
      // Générer le contenu du PDF
      const pdfModal = document.getElementById("fnePdfModal")
      if (pdfModal) {
        const modalContent = pdfModal.querySelector(".modal-content")
        if (modalContent) {
          modalContent.innerHTML = generateFNEPdfHTML(fne)
        }

        // Afficher le modal PDF
        pdfModal.style.display = "block"
      }
    })
    .catch((error) => {
      console.error("Erreur:", error)
      showNotification("Erreur lors de la génération du PDF", "error")
    })
}

// Fonction pour générer le HTML du PDF
function generateFNEPdfHTML(fne) {
  // Récupérer le nom de l'utilisateur
  let userName = ""
  if (fne.utilisateur) {
    userName = `${fne.utilisateur.prenom || ""} ${fne.utilisateur.nom || ""}`.trim()
  }

  // Formater la date
  let dateCreation = ""
  if (fne.date) {
    const date = new Date(fne.date)
    dateCreation = date.toLocaleDateString("fr-FR")
  }

  // Déterminer la classe en fonction du type d'événement
  let typeClass = ""
  let typeLabel = ""
  switch (fne.type_evt) {
    case "accident":
      typeClass = "red"
      typeLabel = "Accident (ACCID)"
      break
    case "incident_grave":
      typeClass = "orange"
      typeLabel = "Incident grave (ING)"
      break
    case "incident":
      typeClass = "green"
      typeLabel = "Incident (INC)"
      break
    case "evt_technique":
      typeClass = "gray"
      typeLabel = "Evenement Technique (EVT)"
      break
    default:
      typeClass = "blue"
      typeLabel = fne.type_evt || ""
  }

  // Déterminer la classe du statut
  let statusClass = ""
  switch (fne.statut) {
    case "En attente":
      statusClass = "status-en-attente"
      break
    case "Validé":
      statusClass = "status-valide"
      break
    case "Refusé":
      statusClass = "status-refuse"
      break
  }

  return `
    <div class="modal-header ${typeClass}">
      <div class="pdf-header">
        <img src="/image/oacaLogo.jpg" alt="Logo" class="pdf-logo">
        <h2>Fiche de Notification d'Evénement (FNE) #${fne.fne_id}</h2>
      </div>
      <button class="close-modal" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="pdf-view">
        <!-- Statut -->
        <div style="margin-bottom: 10px; text-align: right;">
          <span class="action-badge ${
            statusClass === "status-en-attente"
              ? "action-creation"
              : statusClass === "status-valide"
                ? "action-validation"
                : statusClass === "status-refuse"
                  ? "action-refus"
                  : "action-modification"
          }">${fne.statut || ""}</span>
        </div>
        
        <!-- Type d'événement et référence -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            Type d'événement et référence
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="width: 50%; background-color: #f9fafb; padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Type d'événement</th>
                <th style="width: 50%; background-color: #f9fafb; padding: 8px; border: 1px solid #e5e7eb; text-align: left;">REF GNE</th>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${typeLabel || ""}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${fne.ref_gne || ""}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- 1. Informations générales -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            1. Informations générales
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="width: 30%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Organisme concerné</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.organisme_concerné || ""}</td>
              </tr>
              <tr>
                <th style="width: 30%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Date</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${dateCreation || ""}</td>
              </tr>
              <tr>
                <th style="width: 30%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Heure UTC</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.heure_UTC || ""}</td>
              </tr>
              <tr>
                <th style="width: 30%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Lieu de l'événement</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.lieu_EVT || ""}</td>
              </tr>
              <tr>
                <th style="width: 30%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Moyen de détection</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.moyen_detection || ""}</td>
              </tr>
              <tr>
                <th style="width: 30%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Impacts opérationnels</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.impacts_operationnels || ""}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- 2. Aéronef(s) concerné(s) -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            2. Aéronef(s) concerné(s)
          </div>
          <h4 style="margin: 10px 0 5px 0; padding-left: 8px; font-size: 0.85rem;">A. Premier aéronef</h4>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Indicatif/Immatriculation</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Code SSR</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Type appareil</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Règles de vol</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.indicatif_immatricultion || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.code_ssr || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.type_appareil || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.regles_vol || ""}</td>
              </tr>
            </table>
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Terrain départ</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Terrain arrivée</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Cap</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Altitude réelle</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Altitude autorisée</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Vitesse</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.terrain_depart || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.terrain_arrivée || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.cap || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.altitude_reel || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.altitude_autorise || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.vitesse || ""}</td>
              </tr>
            </table>
          </div>
          
          <h4 style="margin: 10px 0 5px 0; padding-left: 8px; font-size: 0.85rem;">B. Deuxième aéronef</h4>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Indicatif/Immatriculation</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Code SSR</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Type appareil</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Règles de vol</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.indicatif_immatricultion_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.code_ssr_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.type_appareil_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.regles_vol_b || ""}</td>
              </tr>
            </table>
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Terrain départ</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Terrain arrivée</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Cap</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Altitude réelle</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Altitude autorisée</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Vitesse</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.terrain_depart_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.terrain_arrivée_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.cap_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.altitude_reel_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.altitude_autorise_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.vitesse_b || ""}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- 3. Nombre estimatif des victimes -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            3. Nombre estimatif des victimes
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Passagers</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Personnel</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Équipage</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Autre</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.passagers || "0"}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.personnel || "0"}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.equipage || "0"}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.autre || "0"}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- 4. Conditions météorologiques -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            4. Conditions météorologiques
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Direction du vent</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Vitesse du vent</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.vent_direction || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.vent_vitesse || ""}</td>
              </tr>
            </table>
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Visibilité</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Nébulosité</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.visibilite ? `${fne.visibilite} m` : ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.nebulosite || ""}</td>
              </tr>
            </table>
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Précipitation</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Autres phénomènes</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.precipitation || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.autres_phenomenes || ""}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- 5. Matériel, installation ou équipement -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            5. Matériel, installation ou équipement
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">L'événement implique une installation/équipement</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.evt_implique_installation_équipement ? "Oui" : "Non"}</td>
              </tr>
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Type installation/équipement</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.type_installation_equipement || ""}</td>
              </tr>
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Nom compagnie assistance/organisme/exploitant véhicule</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.nom_compagnie_assistance_organisme_exploitant_véhicule || ""}</td>
              </tr>
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">L'événement implique un véhicule/matériel assistance sol</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.evt_implique_véhicule_materiel_assistance_sol ? "Oui" : "Non"}</td>
              </tr>
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Type matériel/véhicule</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.type_materiel_véhicule || ""}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- 6. Description de l'événement -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            6. Description de l'événement
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; white-space: pre-line;">${fne.description_evt || "Aucune description fournie."}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- 7. Informations complémentaires -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            7. Informations complémentaires
          </div>
          <div class="pdf-table">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Créé par</th>
                <td style="padding: 6px; border: 1px solid #e5e7eb;">${userName || ""}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
    </div>
  `
}

// Fonction pour fermer le modal
function closeModal() {
  const detailsModal = document.getElementById("fneDetailsModal")
  const pdfModal = document.getElementById("fnePdfModal")
  const eventModal = document.getElementById("eventDetailsModal")

  if (detailsModal) {
    detailsModal.style.display = "none"
  }

  if (pdfModal) {
    pdfModal.style.display = "none"
  }

  if (eventModal) {
    eventModal.style.display = "none"
  }
}

// Fonction pour afficher une notification
function showNotification(message, type) {
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")

  if (notification && notificationMessage) {
    // Définir le message
    notificationMessage.textContent = message

    // Définir le type (info, success, error, warning)
    notification.className = "notification"
    notification.classList.add(type)
    notification.classList.add("show")

    // Masquer après 5 secondes
    setTimeout(() => {
      notification.classList.remove("show")
    }, 5000)
  }
}

// Toggle Filters - vérifier si l'élément existe
const toggleFilters = document.getElementById("toggleFilters")
const filterContent = document.getElementById("filterContent")
const toggleFiltersText = document.getElementById("toggleFiltersText")
const toggleFiltersIcon = document.getElementById("toggleFiltersIcon")

if (toggleFilters) {
  toggleFilters.addEventListener("click", () => {
    const isVisible = filterContent.style.display !== "none"

    if (isVisible) {
      filterContent.style.display = "none"
      toggleFiltersText.textContent = "Afficher les filtres"
      toggleFiltersIcon.className = "fas fa-chevron-down"
    } else {
      filterContent.style.display = "grid"
      toggleFiltersText.textContent = "Masquer les filtres"
      toggleFiltersIcon.className = "fas fa-chevron-up"
    }
  })
}
