// Variables globales
let currentPage = 1
let totalPages = 1
let fneData = []
let filteredData = []
let currentFneId = null
const usersCache = {} // Cache pour stocker les informations des utilisateurs

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Charger les données depuis l'API
  loadFneEnAttente()

  // Configurer les écouteurs d'événements
  setupEventListeners()

  // Configurer les onglets du modal
  setupTabButtons()
})

// Fonction pour charger les FNE en attente
function loadFneEnAttente() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#fne-table tbody")
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 30px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
        <p>Chargement des FNE en attente...</p>
      </td>
    </tr>
  `

  // Faire une requête AJAX pour récupérer les FNE en attente
  // Correction de l'URL: ajout du 'e' manquant à la fin
  fetch("/auth/api/fne/en-attente")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des FNE en attente")
      }
      return response.json()
    })
    .then((data) => {
      console.log("Données reçues:", data) // Pour le débogage

      // Trier les FNE par date, de la plus récente à la plus ancienne
      fneData = data.sort((a, b) => {
        // Utiliser la date de création ou la date de l'événement
        const dateA = a.date_creation || a.date || 0
        const dateB = b.date_creation || b.date || 0

        // Convertir en timestamps pour comparaison
        const timestampA = dateA ? new Date(dateA).getTime() : 0
        const timestampB = dateB ? new Date(dateB).getTime() : 0

        // Tri décroissant (plus récent en premier)
        return timestampB - timestampA
      })

      filteredData = [...fneData]
      totalPages = Math.ceil(filteredData.length / 10) || 1

      // Précharger les informations des utilisateurs
      preloadUserInfo()

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
            <p>Erreur lors du chargement des FNE. Veuillez réessayer.</p>
            <button onclick="loadFneEnAttente()" class="btn btn-primary">Réessayer</button>
          </td>
        </tr>
      `
    })
}

// Fonction pour précharger les informations des utilisateurs
function preloadUserInfo() {
  // Collecter tous les IDs d'utilisateurs uniques
  const userIds = [...new Set(fneData.map((fne) => fne.utilisateur?.id).filter((id) => id))]

  // Si aucun utilisateur à charger, sortir
  if (userIds.length === 0) return

  // Charger les informations des utilisateurs en une seule requête si possible
  // Sinon, charger individuellement
  userIds.forEach((userId) => {
    if (!usersCache[userId]) {
      fetch(`/auth/api/users/${userId}`)
        .then((response) => {
          if (!response.ok) throw new Error(`Erreur lors de la récupération de l'utilisateur ${userId}`)
          return response.json()
        })
        .then((user) => {
          usersCache[userId] = user
          // Mettre à jour le tableau si nécessaire
          if (document.querySelector("#fne-table tbody")) {
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

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Recherche
  document.getElementById("searchBtn").addEventListener("click", applyFilters)
  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      applyFilters()
    }
  })

  // Filtres
  document.getElementById("filterBtn").addEventListener("click", applyFilters)
  document.getElementById("resetBtn").addEventListener("click", resetFilters)

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

// Fonction pour configurer les onglets du modal
function setupTabButtons() {
  document.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("tab-btn")) {
      const tabButtons = document.querySelectorAll(".tab-btn")
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"))

      // Activer l'onglet cliqué
      e.target.classList.add("active")
      const tabId = e.target.getAttribute("data-tab")
      if (document.getElementById(tabId)) {
        document.getElementById(tabId).classList.add("active")
      }
    }
  })
}

// Fonction pour appliquer les filtres
function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()
  const dateFilter = document.getElementById("dateFilter").value
  const timeFilter = document.getElementById("timeFilter").value

  console.log("Filtres appliqués:", {
    search: searchTerm,
    date: dateFilter,
    time: timeFilter,
  })

  // Commencer avec toutes les données
  let result = [...fneData]

  // Filtre par terme de recherche
  if (searchTerm) {
    result = result.filter((fne) => {
      const userName = getUserFullName(fne.utilisateur).toLowerCase()
      return (
        (fne.fne_id && fne.fne_id.toString().includes(searchTerm)) ||
        (fne.type_evt && fne.type_evt.toLowerCase().includes(searchTerm)) ||
        (fne.lieu_EVT && fne.lieu_EVT.toLowerCase().includes(searchTerm)) ||
        userName.includes(searchTerm)
      )
    })
  }

  // Filtrage par date
  if (dateFilter) {
    result = result.filter((fne) => {
      if (!fne.date) return false

      const fneDatee = new Date(fne.date)
      const filterDate = new Date(dateFilter)

      return (
        fneDatee.getFullYear() === filterDate.getFullYear() &&
        fneDatee.getMonth() === filterDate.getMonth() &&
        fneDatee.getDate() === filterDate.getDate()
      )
    })
  }

  // Filtrage par heure
  if (timeFilter) {
    const [filterHour, filterMinute] = timeFilter.split(":").map(Number)

    result = result.filter((fne) => {
      if (!fne.heure_UTC) return false

      // Si c'est déjà au format heure (HH:MM ou HH:MM:SS)
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(fne.heure_UTC)) {
        const [hour, minute] = fne.heure_UTC.split(":").map(Number)
        return hour === filterHour && minute === filterMinute
      }

      // Si c'est une date complète
      const fneTime = new Date(fne.heure_UTC)
      return fneTime.getHours() === filterHour && fneTime.getMinutes() === filterMinute
    })
  }

  console.log("Résultats filtrés:", result.length)

  filteredData = result
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1

  renderTable()
  updatePagination()
}

// Fonction pour réinitialiser les filtres
function resetFilters() {
  // Réinitialiser les valeurs des filtres
  document.getElementById("searchInput").value = ""
  document.getElementById("dateFilter").value = ""
  document.getElementById("timeFilter").value = ""

  // Réinitialiser les données filtrées
  filteredData = [...fneData]
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1

  // Mettre à jour l'affichage
  renderTable()
  updatePagination()

  console.log("Filtres réinitialisés")
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
          <p>Aucune FNE en attente trouvée. Veuillez modifier vos critères de recherche.</p>
        </td>
      </tr>
    `
    return
  }

  for (let i = startIndex; i < endIndex; i++) {
    const fne = filteredData[i]

    // Obtenir le nom de l'utilisateur
    const userName = getUserFullName(fne.utilisateur)

    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${formatValue(fne.fne_id)}</td>
      <td>${formatValue(fne.type_evt)}</td>
      <td>${userName}</td>
      <td>${formatDate(fne.date)}</td>
      <td>${formatTime(fne.heure_UTC)}</td>
      <td>${formatValue(fne.lieu_EVT)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-view" onclick="viewFneDetails(${fne.fne_id})">
            <i class="fas fa-eye"></i> Voir
          </button>
          <button class="btn btn-warning" onclick="modifierFNE(${fne.fne_id})">
            <i class="fas fa-edit"></i> Modifier
          </button>
          <button class="btn btn-danger" onclick="refuserFNE(${fne.fne_id})">
            <i class="fas fa-times"></i> Refuser
          </button>
          <button class="btn btn-success" onclick="validerFNE(${fne.fne_id})">
            <i class="fas fa-check"></i> Valider
          </button>
        </div>
      </td>
    `

    tableBody.appendChild(row)
  }
}

// Fonction pour mettre à jour la pagination
function updatePagination() {
  document.getElementById("pageInfo").textContent = `Page ${currentPage} sur ${totalPages || 1}`
  document.getElementById("prevPage").disabled = currentPage <= 1
  document.getElementById("nextPage").disabled = currentPage >= totalPages || totalPages === 0
}

// Fonction pour afficher les détails d'une FNE
function viewFneDetails(fneId) {
  currentFneId = fneId

  // Afficher un indicateur de chargement
  const loadingOverlay = document.createElement("div")
  loadingOverlay.className = "loading-overlay"
  loadingOverlay.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Chargement des détails...</p>
    </div>
  `
  document.body.appendChild(loadingOverlay)

  // Récupérer les détails de la FNE
  fetch(`/auth/api/fne/${fneId}`)
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
      alert("Erreur lors du chargement des détails de la FNE. Veuillez réessayer.")
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
        <button class="close-modal" onclick="closeModal()">&times;</button>
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
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        <button class="btn btn-warning" onclick="modifierFNE(${fne.fne_id})">
          <i class="fas fa-edit"></i> Modifier
        </button>
        <button class="btn btn-danger" onclick="refuserFNE(${fne.fne_id})">
          <i class="fas fa-times"></i> Refuser
        </button>
        <button class="btn btn-success" onclick="validerFNE(${fne.fne_id})">
          <i class="fas fa-check"></i> Valider
        </button>
      </div>
    </div>
  `

  // Afficher le modal
  const modalElement = document.getElementById("fneDetailsModal")
  modalElement.innerHTML = modalHTML
  modalElement.style.display = "block"
  modalElement.classList.add("pdf-modal")
}

// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("fneDetailsModal").style.display = "none"
  currentFneId = null

  // Supprimer la classe pdf-modal si elle existe
  const modalElement = document.getElementById("fneDetailsModal")
  if (modalElement.classList.contains("pdf-modal")) {
    modalElement.classList.remove("pdf-modal")
  }
}

// Fonction pour modifier une FNE
function modifierFNE(fneId) {
  window.location.href = `/auth/fneAdmin?id=${fneId}`
}
// Fonction pour valider une FNE
function validerFNE(fneId) {
    if (!confirm(`Êtes-vous sûr de vouloir valider la FNE #${fneId} ?`)) return;
  
    // Afficher un indicateur de chargement
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "loading-overlay";
    loadingIndicator.innerHTML =
      '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Validation en cours...</p></div>';
    document.body.appendChild(loadingIndicator);
  
    // Appel à l'API pour valider la FNE
    fetch(`/auth/api/fne/${fneId}/valider`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || "Échec de la validation");
          });
        }
        return response.json();
      })
      .then(data => {
        // Supprimer l'indicateur de chargement
        if (document.body.contains(loadingIndicator)) {
          document.body.removeChild(loadingIndicator);
        }
        
        if (data.success) {
          showNotification("FNE validée avec succès !", "success");
          // Recharger les données et fermer le modal
          loadFneEnAttente();
          closeModal();
        } else {
          showNotification(data.message || "Erreur lors de la validation", "error");
        }
      })
      .catch(error => {
        // Supprimer l'indicateur de chargement
        if (document.body.contains(loadingIndicator)) {
          document.body.removeChild(loadingIndicator);
        }
        
        console.error("Erreur:", error);
        showNotification(error.message || "Erreur lors de la validation", "error");
      });
  }
  
  // Fonction pour refuser une FNE
  function refuserFNE(fneId) {
    if (!confirm(`Êtes-vous sûr de vouloir refuser la FNE #${fneId} ?`)) return;
  
    // Afficher un indicateur de chargement
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "loading-overlay";
    loadingIndicator.innerHTML =
      '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Refus en cours...</p></div>';
    document.body.appendChild(loadingIndicator);
  
    // Appel à l'API pour refuser la FNE
    fetch(`/auth/api/fne/${fneId}/refuser`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || "Échec du refus");
          });
        }
        return response.json();
      })
      .then(data => {
        // Supprimer l'indicateur de chargement
        if (document.body.contains(loadingIndicator)) {
          document.body.removeChild(loadingIndicator);
        }
        
        if (data.success) {
          showNotification("FNE refusée avec succès !", "success");
          // Recharger les données et fermer le modal
          loadFneEnAttente();
          closeModal();
        } else {
          showNotification(data.message || "Erreur lors du refus", "error");
        }
      })
      .catch(error => {
        // Supprimer l'indicateur de chargement
        if (document.body.contains(loadingIndicator)) {
          document.body.removeChild(loadingIndicator);
        }
        
        console.error("Erreur:", error);
        showNotification(error.message || "Erreur lors du refus", "error");
      });
  }
 
// Fonction pour créer une entrée dans l'historique
function createHistoryEntry(fneId, action) {
  // Cette fonction est optionnelle si l'historique est déjà créé côté serveur
  console.log(`Création d'une entrée d'historique pour la FNE ${fneId} avec l'action "${action}"`)
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("fneDetailsModal")
  if (event.target === modal) {
    closeModal()
  }
}

// Ajouter un écouteur d'événements pour la touche Échap
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal()
  }
})
