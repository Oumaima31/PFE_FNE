// Variables globales
let currentPage = 1
let totalPages = 1
let notificationsData = []
let filteredData = []
let currentNotificationId = null
let currentFneId = null
let userRole = null
const usersCache = {} // Cache pour stocker les informations des utilisateurs

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Récupérer les informations de l'utilisateur depuis la session
  const userRoleElement = document.getElementById("userRole")
  if (userRoleElement) {
    userRole = userRoleElement.value.trim().toLowerCase()
    console.log("Rôle utilisateur détecté:", userRole)
  } else {
    console.error("Élément userRole non trouvé dans le DOM")
    // Essayer de récupérer le rôle depuis l'API
    fetch("/auth/api/current-user", {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }
        return response.json()
      })
      .then((user) => {
        userRole = user.role.toLowerCase()
        console.log("Rôle utilisateur récupéré via API:", userRole)
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération du rôle utilisateur:", error)
        // Utiliser un rôle par défaut
        userRole = "sml"
      })
  }

  // Charger les notifications
  loadNotificationsData()

  // Configurer les écouteurs d'événements
  setupEventListeners()

  // Mettre à jour la date et l'heure
  updateDateTime()
  setInterval(updateDateTime, 1000)

  // Récupérer les données météo
  fetchMeteo()
  setInterval(fetchMeteo, 30 * 60 * 1000) // Actualiser toutes les 30 minutes
})

// Fonction pour afficher une erreur
function showError(message) {
  const tableBody = document.querySelector("#notifications-table tbody")
  if (tableBody) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
                    <p>${message}</p>
                </td>
            </tr>
        `
  }

  showNotification(message, "error")
}

// Fonction pour charger les notifications
function loadNotificationsData() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#notifications-table tbody")
  if (!tableBody) return

  tableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 30px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
                <p>Chargement des notifications...</p>
            </td>
        </tr>
    `

  console.log("Chargement des notifications...")

  // Faire une requête AJAX pour récupérer les notifications
  fetch("/auth/api/notifications", {
    credentials: "include",
  })
    .then((response) => {
      console.log("Réponse reçue:", response.status)
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      console.log("Données reçues:", data)

      // S'assurer que data est un tableau
      if (Array.isArray(data)) {
        notificationsData = data
      } else if (data && typeof data === "object") {
        // Si data est un objet, essayer de trouver un tableau à l'intérieur
        for (const key in data) {
          if (Array.isArray(data[key])) {
            notificationsData = data[key]
            break
          }
        }
        // Si aucun tableau n'est trouvé, considérer data comme un élément unique
        if (!Array.isArray(notificationsData)) {
          notificationsData = [data]
        }
      } else {
        notificationsData = []
      }

      console.log("Nombre de notifications:", notificationsData.length)

      // Trier les notifications par date d'envoi (de la plus récente à la plus ancienne)
      notificationsData.sort((a, b) => {
        const dateA = a.date_envoi ? new Date(a.date_envoi).getTime() : 0
        const dateB = b.date_envoi ? new Date(b.date_envoi).getTime() : 0
        return dateB - dateA // Ordre décroissant
      })

      // Précharger les informations des utilisateurs si nécessaire
      preloadUserInfo()

      filteredData = [...notificationsData]
      totalPages = Math.ceil(filteredData.length / 10) || 1

      // Afficher les données
      renderTable()
      updatePagination()
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des notifications:", error)
      if (tableBody) {
        tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 30px;">
                            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
                            <p>Erreur lors du chargement des notifications: ${error.message}</p>
                            <button onclick="loadNotificationsData()" class="btn btn-primary">Réessayer</button>
                        </td>
                    </tr>
                `
      }
    })
}

// Fonction pour précharger les informations des utilisateurs
function preloadUserInfo() {
  // Collecter tous les IDs d'utilisateurs uniques
  const userIds = [
    ...new Set(
      notificationsData
        .filter((notification) => notification.utilisateur && notification.utilisateur.id)
        .map((notification) => notification.utilisateur.id),
    ),
  ]

  // Si aucun utilisateur à charger, sortir
  if (userIds.length === 0) return

  // Charger les informations des utilisateurs
  userIds.forEach((userId) => {
    if (!usersCache[userId]) {
      fetch(`/auth/api/users/${userId}`, {
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Erreur lors de la récupération de l'utilisateur ${userId}`)
          }
          return response.json()
        })
        .then((user) => {
          usersCache[userId] = user
          // Mettre à jour le tableau si nécessaire
          if (document.querySelector("#notifications-table tbody")) {
            renderTable()
          }
        })
        .catch((error) => {
          console.error("Erreur:", error)
          usersCache[userId] = { nom: "Inconnu", prenom: "" }
        })
    }
  })
}

// Fonction pour obtenir le nom complet d'un utilisateur
function getUserFullName(utilisateur) {
  if (!utilisateur) return "Utilisateur inconnu"

  const userId = utilisateur.id

  // Si l'utilisateur est dans le cache, utiliser ces informations
  if (usersCache[userId]) {
    const user = usersCache[userId]
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || "Utilisateur inconnu"
  }

  // Sinon, utiliser les informations disponibles dans l'objet utilisateur
  return `${utilisateur.prenom || ""} ${utilisateur.nom || ""}`.trim() || "Utilisateur inconnu"
}

// Fonction pour configurer les écouteurs d'événements
function setupEventListeners() {
  // Sidebar toggle
  const toggleSidebar = document.getElementById("toggle-sidebar")
  if (toggleSidebar) {
    toggleSidebar.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar")
      if (sidebar) {
        sidebar.classList.toggle("collapsed")

        // Change icon
        const icon = toggleSidebar.querySelector("i")
        if (sidebar.classList.contains("collapsed")) {
          icon.classList.remove("fa-chevron-left")
          icon.classList.add("fa-chevron-right")
        } else {
          icon.classList.remove("fa-chevron-right")
          icon.classList.add("fa-chevron-left")
        }
      }
    })
  }

  // Mobile Toggle
  const mobileToggle = document.getElementById("mobile-toggle")
  const sidebarOverlay = document.getElementById("sidebar-overlay")
  if (mobileToggle && sidebarOverlay) {
    mobileToggle.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar")
      if (sidebar) {
        sidebar.classList.add("show")
        sidebarOverlay.classList.add("show")
      }
    })

    sidebarOverlay.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar")
      if (sidebar) {
        sidebar.classList.remove("show")
        sidebarOverlay.classList.remove("show")
      }
    })
  }

  // Notifications Toggle
  const notificationsToggle = document.getElementById("notifications-toggle")
  const notificationsDropdown = document.getElementById("notifications-dropdown")
  if (notificationsToggle && notificationsDropdown) {
    notificationsToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      notificationsDropdown.classList.toggle("show")

      // Fermer le dropdown utilisateur s'il est ouvert
      const userDropdown = document.getElementById("user-dropdown")
      if (userDropdown) {
        userDropdown.classList.remove("show")
      }
    })
  }

  // User Toggle
  const userToggle = document.getElementById("user-toggle")
  const userDropdown = document.getElementById("user-dropdown")
  if (userToggle && userDropdown) {
    userToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      userDropdown.classList.toggle("show")

      // Fermer le dropdown notifications s'il est ouvert
      if (notificationsDropdown) {
        notificationsDropdown.classList.remove("show")
      }
    })
  }

  // Fermer les dropdowns lors d'un clic à l'extérieur
  document.addEventListener("click", (e) => {
    if (notificationsDropdown && notificationsToggle) {
      if (!notificationsToggle.contains(e.target) && !notificationsDropdown.contains(e.target)) {
        notificationsDropdown.classList.remove("show")
      }
    }

    if (userDropdown && userToggle) {
      if (!userToggle.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("show")
      }
    }
  })

  // Recherche
  const searchBtn = document.getElementById("searchBtn")
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const searchInput = document.getElementById("searchInput")
      if (searchInput) {
        const searchTerm = searchInput.value.toLowerCase()
        filterData(searchTerm)
      }
    })
  }

  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        const searchTerm = e.target.value.toLowerCase()
        filterData(searchTerm)
      }
    })
  }

  // Filtres
  const filterBtn = document.getElementById("filterBtn")
  if (filterBtn) {
    filterBtn.addEventListener("click", applyFilters)
  }

  const resetBtn = document.getElementById("resetBtn")
  if (resetBtn) {
    resetBtn.addEventListener("click", resetFilters)
  }

  // Pagination
  const prevPage = document.getElementById("prevPage")
  if (prevPage) {
    prevPage.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--
        renderTable()
        updatePagination()
      }
    })
  }

  const nextPage = document.getElementById("nextPage")
  if (nextPage) {
    nextPage.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++
        renderTable()
        updatePagination()
      }
    })
  }

  // Fermer le modal avec la touche Échap
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal()
      closeFneModal()
    }
  })
}

// Fonction pour déterminer le niveau d'urgence en fonction du type d'événement
function getUrgenceByEventType(typeEvt) {
  if (!typeEvt) return "moyenne"

  const typeEvtLower = typeEvt.toLowerCase()

  if (typeEvtLower.includes("accident")) {
    return "haute"
  } else if (typeEvtLower.includes("incident_grave") || typeEvtLower.includes("incident grave")) {
    return "moyenne"
  } else if (typeEvtLower.includes("incident")) {
    return "basse"
  } else if (typeEvtLower.includes("evt_technique") || typeEvtLower.includes("evt technique")) {
    return "technique"
  }

  return "moyenne"
}

// Fonction pour déterminer la classe d'urgence en fonction du type d'événement
function getUrgenceClassByEventType(typeEvt) {
  if (!typeEvt) return "urgence-moyenne"

  const typeEvtLower = typeEvt.toLowerCase()

  if (typeEvtLower.includes("accident")) {
    return "urgence-haute" // Rouge
  } else if (typeEvtLower.includes("incident_grave") || typeEvtLower.includes("incident grave")) {
    return "urgence-moyenne" // Orange
  } else if (typeEvtLower.includes("incident")) {
    return "urgence-basse" // Vert
  } else if (typeEvtLower.includes("evt_technique") || typeEvtLower.includes("evt technique")) {
    return "urgence-technique" // Gris
  }

  return "urgence-moyenne" // Par défaut
}

// Fonction pour filtrer les données
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...notificationsData]
  } else {
    filteredData = notificationsData.filter((notification) => {
      // Vérifier si les propriétés existent avant d'y accéder
      const notificationId = notification.notification_id ? notification.notification_id.toString() : ""
      const contenu = notification.contenu || ""
      const fneId = notification.fne && notification.fne.fne_id ? notification.fne.fne_id.toString() : ""
      const dateEnvoi = formatDateTime(notification.date_envoi || "").toLowerCase()
      const moyen = notification.moyen || ""
      const urgence = notification.urgence || ""
      const typeEvt = notification.fne && notification.fne.type_evt ? notification.fne.type_evt.toLowerCase() : ""
      const userName = notification.utilisateur ? getUserFullName(notification.utilisateur).toLowerCase() : ""

      searchTerm = searchTerm.toLowerCase()

      return (
        notificationId.includes(searchTerm) ||
        contenu.toLowerCase().includes(searchTerm) ||
        fneId.includes(searchTerm) ||
        dateEnvoi.includes(searchTerm) ||
        moyen.toLowerCase().includes(searchTerm) ||
        urgence.toLowerCase().includes(searchTerm) ||
        typeEvt.includes(searchTerm) ||
        userName.includes(searchTerm)
      )
    })
  }

  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1
  renderTable()
  updatePagination()
}

// Fonction pour appliquer les filtres
function applyFilters() {
  const urgenceFilter = document.getElementById("filterUrgence")
  const moyenFilter = document.getElementById("filterMoyen")
  const dateFilter = document.getElementById("dateFilter")

  const urgenceValue = urgenceFilter ? urgenceFilter.value : ""
  const moyenValue = moyenFilter ? moyenFilter.value : ""
  const dateValue = dateFilter ? dateFilter.value : ""

  console.log("Filtres appliqués:", {
    urgence: urgenceValue,
    moyen: moyenValue,
    date: dateValue,
  })

  // Commencer avec toutes les données
  let tempData = [...notificationsData]

  // Filtrer par urgence
  if (urgenceValue) {
    tempData = tempData.filter((notification) => {
      // Si la notification a une FNE avec un type d'événement, déterminer l'urgence en fonction du type
      if (notification.fne && notification.fne.type_evt) {
        const urgenceByType = getUrgenceByEventType(notification.fne.type_evt)
        return urgenceByType === urgenceValue
      }
      // Sinon, utiliser l'urgence de la notification
      return notification.urgence === urgenceValue
    })
  }

  // Filtrer par moyen
  if (moyenValue) {
    tempData = tempData.filter((notification) => {
      return notification.moyen === moyenValue
    })
  }

  // Filtrage par date
  if (dateValue) {
    tempData = tempData.filter((notification) => {
      // Vérifier si date_envoi existe
      if (!notification.date_envoi) {
        return false
      }

      const notifDate = new Date(notification.date_envoi)
      const filterDate = new Date(dateValue)

      // Comparer seulement les dates (jour, mois, année)
      return (
        notifDate.getFullYear() === filterDate.getFullYear() &&
        notifDate.getMonth() === filterDate.getMonth() &&
        notifDate.getDate() === filterDate.getDate()
      )
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
  const tableBody = document.querySelector("#notifications-table tbody")
  if (!tableBody) {
    console.error("Élément #notifications-table tbody non trouvé")
    return
  }

  tableBody.innerHTML = ""

  const startIndex = (currentPage - 1) * 10
  const endIndex = Math.min(startIndex + 10, filteredData.length)

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px;">
                    <i class="fas fa-bell-slash" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
                    <p>Aucune notification trouvée. Veuillez modifier vos critères de recherche.</p>
                </td>
            </tr>
        `
    return
  }

  for (let i = startIndex; i < endIndex; i++) {
    const notification = filteredData[i]

    // Déterminer la classe du badge en fonction du moyen
    let moyenClass = ""
    switch (notification.moyen) {
      case "email":
        moyenClass = "moyen-email"
        break
      case "sms":
        moyenClass = "moyen-sms"
        break
      default:
        moyenClass = "moyen-système"
    }

    // Extraire le type d'événement de la FNE
    const typeEvt = notification.fne ? notification.fne.type_evt : ""

    // Déterminer l'urgence et la classe d'urgence en fonction du type d'événement
    let urgenceText = notification.urgence // Valeur par défaut
    let urgenceClass = "urgence-moyenne" // Valeur par défaut

    if (typeEvt) {
      // Remplacer l'urgence par celle déterminée par le type d'événement
      urgenceText = getUrgenceByEventType(typeEvt)
      urgenceClass = getUrgenceClassByEventType(typeEvt)
    }

    // Extraire les IDs et les valeurs avec sécurité
    const notificationId = notification.notification_id || ""
    const fneId = notification.fne && notification.fne.fne_id ? notification.fne.fne_id : ""

    // Formater la date d'envoi
    const dateEnvoi = formatDateTime(notification.date_envoi || "")

    // Tronquer le contenu s'il est trop long
    const contenu = notification.contenu || ""
    const truncatedContenu = contenu.length > 50 ? contenu.substring(0, 50) + "..." : contenu

    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${notificationId}</td>
            <td>${dateEnvoi}</td>
            <td><span class="moyen-badge ${moyenClass}">${notification.moyen || ""}</span></td>
            <td><span class="urgence-badge ${urgenceClass}">${urgenceText}</span></td>
            <td>${fneId}</td>
            <td>${typeEvt || ""}</td>
            <td class="truncate">${truncatedContenu}</td>
            <td>
                <button class="btn btn-view" onclick="viewNotificationDetails(${notificationId})">
                    <i class="fas fa-eye"></i> Voir
                </button>
            </td>
        `

    tableBody.appendChild(row)
  }
}

// Fonction pour mettre à jour la pagination
function updatePagination() {
  const pageInfo = document.getElementById("pageInfo")
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} sur ${totalPages || 1}`
  }

  const prevPage = document.getElementById("prevPage")
  if (prevPage) {
    prevPage.disabled = currentPage <= 1
  }

  const nextPage = document.getElementById("nextPage")
  if (nextPage) {
    nextPage.disabled = currentPage >= totalPages
  }
}

// Fonction pour formater la date et l'heure
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return ""

  try {
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateTimeString).toLocaleDateString("fr-FR", options)
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error)
    return ""
  }
}

// Fonction pour formater les valeurs pour l'affichage
function formatValue(value, defaultValue = "Non spécifié") {
  if (value === null || value === undefined || value === "") {
    return defaultValue
  }
  return value
}

// Fonction pour formater la date
function formatDate(dateString) {
  if (!dateString) return "Non spécifiée"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Date invalide"

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    console.error("Erreur de formatage de date:", error)
    return "Date invalide"
  }
}

// Fonction pour formater l'heure
function formatTime(timeString) {
  if (!timeString) return "Non spécifiée"

  // Si c'est déjà au format heure (HH:MM ou HH:MM:SS)
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeString)) {
    return timeString
  }

  // Si c'est une date complète, extraire l'heure
  try {
    const date = new Date(timeString)
    if (isNaN(date.getTime())) return "Heure invalide"

    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Erreur de formatage d'heure:", error)
    return "Heure invalide"
  }
}

// Fonction pour afficher les détails d'une notification
function viewNotificationDetails(notificationId) {
  if (!notificationId) {
    console.error("L'ID de la notification est indéfini.")
    return
  }

  currentNotificationId = notificationId

  // Afficher un indicateur de chargement dans le modal
  const modalNotificationId = document.getElementById("modalNotificationId")
  if (modalNotificationId) {
    modalNotificationId.textContent = notificationId
  }

  const notificationDetailsModal = document.getElementById("notificationDetailsModal")
  if (notificationDetailsModal) {
    notificationDetailsModal.style.display = "block"
  }

  // Récupérer les détails de la notification
  fetch(`/auth/api/notifications/${notificationId}`, {
    credentials: "include", // Important pour envoyer les cookies d'authentification
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`)
      }
      return response.json()
    })
    .then((notification) => {
      // Ajouter des logs détaillés pour déboguer
      console.log("Détails notification:", notification)

      // Extraire les valeurs avec sécurité
      const notificationId = notification.notification_id || ""
      const dateEnvoi = formatDateTime(notification.date_envoi || "")
      const moyen = notification.moyen || ""
      const utilisateurId = notification.utilisateur && notification.utilisateur.id ? notification.utilisateur.id : ""
      const contenu = notification.contenu || ""

      // Extraire le type d'événement de la FNE
      const typeEvt = notification.fne ? notification.fne.type_evt : ""

      // Déterminer l'urgence et la classe d'urgence en fonction du type d'événement
      let urgenceText = notification.urgence // Valeur par défaut
      let urgenceClass = "urgence-moyenne" // Valeur par défaut

      if (typeEvt) {
        // Remplacer l'urgence par celle déterminée par le type d'événement
        urgenceText = getUrgenceByEventType(typeEvt)
        urgenceClass = getUrgenceClassByEventType(typeEvt)
      }

      // Vérifier si fne existe et extraire son ID
      if (notification.fne && notification.fne.fne_id) {
        currentFneId = notification.fne.fne_id
        const viewFneBtn = document.getElementById("viewFneBtn")
        if (viewFneBtn) {
          viewFneBtn.style.display = "inline-flex"
        }
      } else {
        currentFneId = null
        const viewFneBtn = document.getElementById("viewFneBtn")
        if (viewFneBtn) {
          viewFneBtn.style.display = "none"
        }
      }

      // Informations de base
      const detailNotificationId = document.getElementById("detail-notification-id")
      if (detailNotificationId) {
        detailNotificationId.textContent = notificationId
      }

      const detailDateEnvoi = document.getElementById("detail-date-envoi")
      if (detailDateEnvoi) {
        detailDateEnvoi.textContent = dateEnvoi
      }

      const detailUtilisateurId = document.getElementById("detail-utilisateur-id")
      if (detailUtilisateurId) {
        detailUtilisateurId.textContent = utilisateurId
      }

      const detailFneId = document.getElementById("detail-fne-id")
      if (detailFneId) {
        detailFneId.textContent = currentFneId || "N/A"
      }

      const detailTypeEvt = document.getElementById("detail-type-evt")
      if (detailTypeEvt) {
        detailTypeEvt.textContent = typeEvt || "N/A"
      }

      const detailContenu = document.getElementById("detail-contenu")
      if (detailContenu) {
        detailContenu.textContent = contenu
      }

      // Moyen avec badge
      const detailMoyen = document.getElementById("detail-moyen")
      if (detailMoyen) {
        detailMoyen.textContent = moyen
        detailMoyen.className = "moyen-badge" // Réinitialiser les classes

        // Ajouter la classe appropriée pour le moyen
        switch (moyen) {
          case "email":
            detailMoyen.classList.add("moyen-email")
            break
          case "sms":
            detailMoyen.classList.add("moyen-sms")
            break
          default:
            detailMoyen.classList.add("moyen-système")
        }
      }

      // Urgence avec badge
      const detailUrgence = document.getElementById("detail-urgence")
      if (detailUrgence) {
        detailUrgence.textContent = urgenceText
        detailUrgence.className = "urgence-badge" // Réinitialiser les classes
        detailUrgence.classList.add(urgenceClass)
      }
    })
    .catch((error) => {
      console.error("Erreur:", error)
      const modalBody = document.querySelector("#notificationDetailsModal .modal-body")
      if (modalBody) {
        modalBody.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Une erreur est survenue lors du chargement des détails de la notification.</p>
                        <p>Détail de l'erreur: ${error.message}</p>
                    </div>
                `
      }
    })
}

// Fonction pour voir la FNE associée
function voirFNE(fneId) {
  if (!fneId) {
    console.error("L'ID de la FNE est indéfini.")
    return
  }

  // Fermer le modal de notification
  closeModal()

  // Afficher un indicateur de chargement
  const loadingOverlay = document.createElement("div")
  loadingOverlay.className = "loading-overlay"
  loadingOverlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Chargement des détails de la FNE...</p>
        </div>
    `
  document.body.appendChild(loadingOverlay)

  // Récupérer les détails de la FNE
  fetch(`/auth/api/fne/${fneId}`, {
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails de la FNE")
      }
      return response.json()
    })
    .then((fne) => {
      // Supprimer l'indicateur de chargement
      document.body.removeChild(loadingOverlay)

      // Créer et afficher le modal avec la FNE en format PDF
      createFNEPdfView(fne)
    })
    .catch((error) => {
      // Supprimer l'indicateur de chargement s'il est encore présent
      if (document.body.contains(loadingOverlay)) {
        document.body.removeChild(loadingOverlay)
      }

      console.error("Erreur:", error)
      showNotification("Erreur lors du chargement des détails de la FNE. Veuillez réessayer.", "error")
    })
}

// Fonction pour créer et afficher la vue PDF de la FNE
function createFNEPdfView(fne) {
  // Récupérer le nom de l'utilisateur FNE (créateur)
  const fneUserName = getUserFullName(fne.utilisateur)

  // Déterminer la classe de couleur en fonction du type d'événement
  let typeClass = ""
  switch (fne.type_evt) {
    case "accident":
      typeClass = "red"
      break
    case "incident_grave":
      typeClass = "orange"
      break
    case "incident":
      typeClass = "green"
      break
    case "evt_technique":
      typeClass = "gray"
      break
  }

  // Créer le contenu du modal PDF
  const modalHTML = `
        <div class="modal-content pdf-view">
            <div class="modal-header ${typeClass}">
                <div class="pdf-header">
                    <img src="/image/oacaLogo.jpg" alt="Logo" class="pdf-logo">
                    <h2>Fiche de Notification d'Evénement (FNE) #${fne.fne_id}</h2>
                </div>
                <button class="close-modal" onclick="closeFneModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="pdf-status">
                    <span class="pdf-status-label">Statut:</span>
                    <span class="pdf-status-value status-${fne.statut.toLowerCase().replace(/ /g, "-")}">${fne.statut}</span>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">
                        <h3><i class="fas fa-info-circle"></i> Type d'événement et référence</h3>
                    </div>
                    <div class="pdf-section-content">
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Type d'événement:</label>
                                <div class="pdf-value">${formatValue(fne.type_evt)}</div>
                            </div>
                            <div class="pdf-field">
                                <label>REF GNE:</label>
                                <div class="pdf-value">${formatValue(fne.ref_gne)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">
                        <h3><i class="fas fa-info-circle"></i> 1. Informations générales</h3>
                    </div>
                    <div class="pdf-section-content">
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Organisme concerné:</label>
                                <div class="pdf-value">${formatValue(fne.organisme_concerné)}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Date:</label>
                                <div class="pdf-value">${formatDate(fne.date)}</div>
                            </div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Heure UTC:</label>
                                <div class="pdf-value">${formatValue(fne.heure_UTC)}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Lieu de l'événement:</label>
                                <div class="pdf-value">${formatValue(fne.lieu_EVT)}</div>
                            </div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Moyen de détection:</label>
                                <div class="pdf-value">${formatValue(fne.moyen_detection)}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Impacts opérationnels:</label>
                                <div class="pdf-value">${formatValue(fne.impacts_operationnels)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">
                        <h3><i class="fas fa-plane"></i> 2. Aéronef(s) concerné(s)</h3>
                    </div>
                    <div class="pdf-section-content">
                        <h4>A. Premier aéronef</h4>
                        <div class="pdf-table">
                            <table>
                                <tr>
                                    <th>Indicatif/Immatriculation</th>
                                    <th>Code SSR</th>
                                    <th>Type appareil</th>
                                    <th>Règles de vol</th>
                                </tr>
                                <tr>
                                    <td>${formatValue(fne.indicatif_immatricultion)}</td>
                                    <td>${formatValue(fne.code_ssr)}</td>
                                    <td>${formatValue(fne.type_appareil)}</td>
                                    <td>${formatValue(fne.regles_vol)}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="pdf-table">
                            <table>
                                <tr>
                                    <th>Terrain départ</th>
                                    <th>Terrain arrivée</th>
                                    <th>Cap</th>
                                    <th>Altitude réelle</th>
                                    <th>Altitude autorisée</th>
                                    <th>Vitesse</th>
                                </tr>
                                <tr>
                                    <td>${formatValue(fne.terrain_depart)}</td>
                                    <td>${formatValue(fne.terrain_arrivée)}</td>
                                    <td>${formatValue(fne.cap)}</td>
                                    <td>${formatValue(fne.altitude_reel)}</td>
                                    <td>${formatValue(fne.altitude_autorise)}</td>
                                    <td>${formatValue(fne.vitesse)}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <h4>B. Deuxième aéronef</h4>
                        <div class="pdf-table">
                            <table>
                                <tr>
                                    <th>Indicatif/Immatriculation</th>
                                    <th>Code SSR</th>
                                    <th>Type appareil</th>
                                    <th>Règles de vol</th>
                                </tr>
                                <tr>
                                    <td>${formatValue(fne.indicatif_immatricultion_b)}</td>
                                    <td>${formatValue(fne.code_ssr_b)}</td>
                                    <td>${formatValue(fne.type_appareil_b)}</td>
                                    <td>${formatValue(fne.regles_vol_b)}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="pdf-table">
                            <table>
                                <tr>
                                    <th>Terrain départ</th>
                                    <th>Terrain arrivée</th>
                                    <th>Cap</th>
                                    <th>Altitude réelle</th>
                                    <th>Altitude autorisée</th>
                                    <th>Vitesse</th>
                                </tr>
                                <tr>
                                    <td>${formatValue(fne.terrain_depart_b)}</td>
                                    <td>${formatValue(fne.terrain_arrivée_b)}</td>
                                    <td>${formatValue(fne.cap_b)}</td>
                                    <td>${formatValue(fne.altitude_reel_b)}</td>
                                    <td>${formatValue(fne.altitude_autorise_b)}</td>
                                    <td>${formatValue(fne.vitesse_b)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">
                        <h3><i class="fas fa-user-injured"></i> 3. Nombre estimatif des victimes</h3>
                    </div>
                    <div class="pdf-section-content">
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Passagers:</label>
                                <div class="pdf-value">${formatValue(fne.passagers, "0")}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Personnel:</label>
                                <div class="pdf-value">${formatValue(fne.personnel, "0")}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Équipage:</label>
                                <div class="pdf-value">${formatValue(fne.equipage, "0")}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Autre:</label>
                                <div class="pdf-value">${formatValue(fne.autre, "0")}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">
                        <h3><i class="fas fa-cloud-rain"></i> 4. Conditions météorologiques</h3>
                    </div>
                    <div class="pdf-section-content">
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Direction du vent:</label>
                                <div class="pdf-value">${formatValue(fne.vent_direction)}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Vitesse du vent:</label>
                                <div class="pdf-value">${formatValue(fne.vent_vitesse)}</div>
                            </div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Visibilité:</label>
                                <div class="pdf-value">${fne.visibilite ? `${fne.visibilite} m` : "Non spécifiée"}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Nébulosité:</label>
                                <div class="pdf-value">${formatValue(fne.nebulosite)}</div>
                            </div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Précipitation:</label>
                                <div class="pdf-value">${formatValue(fne.precipitation)}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Autres phénomènes:</label>
                                <div class="pdf-value">${formatValue(fne.autres_phenomenes)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">
                        <h3><i class="fas fa-tools"></i> 5. Matériel, installation ou équipement</h3>
                    </div>
                    <div class="pdf-section-content">
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>L'événement implique une installation/équipement:</label>
                                <div class="pdf-value">${fne.evt_implique_installation_équipement ? "Oui" : "Non"}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Type installation/équipement:</label>
                                <div class="pdf-value">${formatValue(fne.type_installation_équipement)}</div>
                            </div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Nom compagnie assistance/organisme/exploitant véhicule:</label>
                                <div class="pdf-value">${formatValue(fne.nom_compagnie_assistance_organisme_exploitant_véhicule)}</div>
                            </div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>L'événement implique un véhicule/matériel assistance sol:</label>
                                <div class="pdf-value">${fne.evt_implique_véhicule_materiel_assistance_sol ? "Oui" : "Non"}</div>
                            </div>
                            <div class="pdf-field">
                                <label>Type matériel/véhicule:</label>
                                <div class="pdf-value">${formatValue(fne.type_materiel_véhicule)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">
                        <h3><i class="fas fa-file-alt"></i> 6. Description de l'événement</h3>
                    </div>
                    <div class="pdf-section-content">
                        <div class="pdf-field full-width">
                            <div class="pdf-description">${formatValue(fne.description_evt).replace(/\n/g, "<br>")}</div>
                        </div>
                    </div>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">
                        <h3><i class="fas fa-user-edit"></i> 7. Informations complémentaires</h3>
                    </div>
                    <div class="pdf-section-content">
                        <div class="pdf-row">
                            <div class="pdf-field">
                                <label>Créé par:</label>
                                <div class="pdf-value">${fneUserName}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeFneModal()">Fermer</button>
                ${
                  userRole === "admin"
                    ? `
                <button class="btn btn-warning" onclick="modifierFNE(${fne.fne_id})">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-danger" onclick="refuserFNE(${fne.fne_id})">
                    <i class="fas fa-times"></i> Refuser
                </button>
                <button class="btn btn-success" onclick="validerFNE(${fne.fne_id})">
                    <i class="fas fa-check"></i> Valider
                </button>
                `
                    : ""
                }
            </div>
        </div>
    `

  // Afficher le modal
  const modalElement = document.getElementById("fneDetailsModal")
  if (modalElement) {
    modalElement.innerHTML = modalHTML
    modalElement.style.display = "block"
    modalElement.classList.add("pdf-modal")
  }
}

// Fonction pour fermer le modal de notification
function closeModal() {
  const modal = document.getElementById("notificationDetailsModal")
  if (modal) {
    modal.style.display = "none"
  }
  currentNotificationId = null
}

// Fonction pour fermer le modal de FNE
function closeFneModal() {
  const modal = document.getElementById("fneDetailsModal")
  if (modal) {
    modal.style.display = "none"
    modal.classList.remove("pdf-modal")
  }
  currentFneId = null
}

// Fonction pour modifier une FNE
function modifierFNE(fneId) {
  if (!fneId) return

  // Rediriger vers la page de modification en fonction du rôle
  if (userRole === "admin") {
    window.location.href = `/auth/fneAdmin?id=${fneId}`
  } else if (userRole === "SML") {
    window.location.href = `/auth/fneSML?id=${fneId}`
  }
}

// Fonction pour valider une FNE (Admin uniquement)
function validerFNE(fneId) {
  if (!fneId || userRole !== "admin") return

  if (!confirm(`Êtes-vous sûr de vouloir valider la FNE #${fneId} ?`)) return

  // Afficher un indicateur de chargement
  const loadingIndicator = document.createElement("div")
  loadingIndicator.className = "loading-overlay"
  loadingIndicator.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Validation en cours...</p>
        </div>
    `
  document.body.appendChild(loadingIndicator)

  // Appel à l'API pour valider la FNE
  fetch(`/auth/api/fne/${fneId}/valider`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(data.message || "Échec de la validation")
        })
      }
      return response.json()
    })
    .then((data) => {
      // Supprimer l'indicateur de chargement
      if (document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator)
      }

      if (data.success) {
        showNotification("FNE validée avec succès !", "success")
        // Fermer le modal et recharger les notifications
        closeFneModal()
        loadNotificationsData()
      } else {
        showNotification(data.message || "Erreur lors de la validation", "error")
      }
    })
    .catch((error) => {
      // Supprimer l'indicateur de chargement
      if (document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator)
      }

      console.error("Erreur:", error)
      showNotification(error.message || "Erreur lors de la validation", "error")
    })
}

// Fonction pour refuser une FNE (Admin uniquement)
function refuserFNE(fneId) {
  if (!fneId || userRole !== "admin") return

  if (!confirm(`Êtes-vous sûr de vouloir refuser la FNE #${fneId} ?`)) return

  // Afficher un indicateur de chargement
  const loadingIndicator = document.createElement("div")
  loadingIndicator.className = "loading-overlay"
  loadingIndicator.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Refus en cours...</p>
        </div>
    `
  document.body.appendChild(loadingIndicator)

  // Appel à l'API pour refuser la FNE
  fetch(`/auth/api/fne/${fneId}/refuser`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(data.message || "Échec du refus")
        })
      }
      return response.json()
    })
    .then((data) => {
      // Supprimer l'indicateur de chargement
      if (document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator)
      }

      if (data.success) {
        showNotification("FNE refusée avec succès !", "success")
        // Fermer le modal et recharger les notifications
        closeFneModal()
        loadNotificationsData()
      } else {
        showNotification(data.message || "Erreur lors du refus", "error")
      }
    })
    .catch((error) => {
      // Supprimer l'indicateur de chargement
      if (document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator)
      }

      console.error("Erreur:", error)
      showNotification(error.message || "Erreur lors du refus", "error")
    })
}

// Fonction pour réinitialiser les filtres
function resetFilters() {
  // Réinitialiser les valeurs des filtres
  const filterUrgence = document.getElementById("filterUrgence")
  if (filterUrgence) {
    filterUrgence.value = ""
  }

  const filterMoyen = document.getElementById("filterMoyen")
  if (filterMoyen) {
    filterMoyen.value = ""
  }

  const dateFilter = document.getElementById("dateFilter")
  if (dateFilter) {
    dateFilter.value = ""
  }

  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.value = ""
  }

  // Réinitialiser les données filtrées (les données sont déjà triées)
  filteredData = [...notificationsData]
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1

  // Mettre à jour l'affichage
  renderTable()
  updatePagination()
}

// Fonction pour mettre à jour la date et l'heure
function updateDateTime() {
  const now = new Date()

  // Format de la date: jour de la semaine, jour mois année
  const dateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  const currentDateElement = document.getElementById("current-date")
  if (currentDateElement) {
    currentDateElement.textContent = now.toLocaleDateString("fr-FR", dateOptions)
  }

  // Format de l'heure: HH:MM:SS
  const timeOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
  const currentTimeElement = document.getElementById("current-time")
  if (currentTimeElement) {
    currentTimeElement.textContent = now.toLocaleTimeString("fr-FR", timeOptions)
  }
}

// Fonction pour récupérer les données météo
async function fetchMeteo() {
  const apiKey = "17cf16edeaed1f9b3bb60006a242d5d1"
  const url = `https://api.openweathermap.org/data/2.5/weather?q=Tunis,tn&units=metric&lang=fr&appid=${apiKey}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`)
    }

    const data = await response.json()

    // Vérification des données
    if (!data.weather || !data.main) {
      throw new Error("Données météo non disponibles")
    }

    // Récupération des valeurs
    const temperature = Math.round(data.main.temp) + "°C"
    const description = data.weather[0].description

    // Affichage des valeurs avec animation
    const meteoIcon = document.getElementById("meteo-icon")
    const meteoTemp = document.getElementById("meteo-temp")
    const meteoDesc = document.getElementById("meteo-description")

    if (meteoIcon && meteoTemp && meteoDesc) {
      // Choisir l'icône appropriée
      const weatherCode = data.weather[0].id

      if (weatherCode >= 200 && weatherCode < 300) {
        meteoIcon.innerHTML = '<i class="fas fa-bolt"></i>' // Orage
      } else if (weatherCode >= 300 && weatherCode < 500) {
        meteoIcon.innerHTML = '<i class="fas fa-cloud-rain"></i>' // Bruine
      } else if (weatherCode >= 500 && weatherCode < 600) {
        meteoIcon.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i>' // Pluie
      } else if (weatherCode >= 600 && weatherCode < 700) {
        meteoIcon.innerHTML = '<i class="fas fa-snowflake"></i>' // Neige
      } else if (weatherCode >= 700 && weatherCode < 800) {
        meteoIcon.innerHTML = '<i class="fas fa-smog"></i>' // Brouillard
      } else if (weatherCode === 800) {
        meteoIcon.innerHTML = '<i class="fas fa-sun"></i>' // Ciel dégagé
      } else {
        meteoIcon.innerHTML = '<i class="fas fa-cloud-sun"></i>' // Nuageux
      }

      // Animation simple pour les valeurs de température et description
      meteoTemp.style.opacity = "0"
      meteoDesc.style.opacity = "0"

      setTimeout(() => {
        meteoTemp.textContent = temperature
        meteoDesc.textContent = description
        meteoTemp.style.transition = "opacity 0.5s ease"
        meteoDesc.style.transition = "opacity 0.5s ease"
        meteoTemp.style.opacity = "1"
        meteoDesc.style.opacity = "1"
      }, 300)
    }
  } catch (error) {
    console.error("Erreur météo:", error)
    const meteoIcon = document.getElementById("meteo-icon")
    const meteoTemp = document.getElementById("meteo-temp")
    const meteoDesc = document.getElementById("meteo-description")

    if (meteoIcon && meteoTemp && meteoDesc) {
      meteoIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>'
      meteoTemp.textContent = "--°C"
      meteoDesc.textContent = "Non disponible"
    }
  }
}

// Fonction pour afficher une notification toast
function showNotification(message, type = "info") {
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
