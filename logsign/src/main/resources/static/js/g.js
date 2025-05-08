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

  // Ajouter des styles pour le PDF
  const styleElement = document.createElement("style")
  styleElement.textContent = `
    /* Styles pour le modal PDF */
    #fnePdfModal .modal-content {
      width: 80%;
      max-width: 800px;
      margin: 30px auto;
      max-height: 85vh;
      overflow-y: auto;
    }
    
    .pdf-content {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .pdf-section {
      margin-bottom: 15px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .pdf-section h3 {
      padding: 8px 12px;
      background-color: #f9fafb;
      font-size: 0.95rem;
      font-weight: 600;
      color: #333;
      border-bottom: 1px solid #e5e7eb;
      margin: 0;
    }
    
    .pdf-section h4 {
      padding: 6px 12px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #555;
      margin: 0;
      background-color: #f3f4f6;
    }
    
    .pdf-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      padding: 10px;
    }
    
    .pdf-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    
    .pdf-item label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #666;
    }
    
    .pdf-item span {
      font-size: 0.85rem;
    }
    
    .pdf-description {
      padding: 10px;
      white-space: pre-line;
      line-height: 1.4;
    }
    
    .pdf-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .pdf-logo {
      height: 40px;
      width: 40px;
      border-radius: 6px;
      object-fit: cover;
    }
    
    .modal-header.red {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    
    .modal-header.orange {
      background-color: #ffedd5;
      color: #c2410c;
    }
    
    .modal-header.green {
      background-color: #dcfce7;
      color: #15803d;
    }
    
    .modal-header.gray {
      background-color: #f3f4f6;
      color: #4b5563;
    }
    
    .modal-header.blue {
      background-color: #dbeafe;
      color: #1e40af;
    }
  `
  document.head.appendChild(styleElement)
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

// Fonction pour filtrer les données
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...fneData]
  } else {
    filteredData = fneData.filter((fne) => {
      return (
        fne.fne_id.toString().includes(searchTerm) ||
        (fne.type_evt && fne.type_evt.toLowerCase().includes(searchTerm)) ||
        (fne.ref_gne && fne.ref_gne.toLowerCase().includes(searchTerm)) ||
        (fne.statut && fne.statut.toLowerCase().includes(searchTerm)) ||
        (fne.utilisateur &&
          ((fne.utilisateur.nom && fne.utilisateur.nom.toLowerCase().includes(searchTerm)) ||
            (fne.utilisateur.prenom && fne.utilisateur.prenom.toLowerCase().includes(searchTerm))))
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
  const statusFilter = document.getElementById("filterAction").value
  const dateFilter = document.getElementById("dateFilter").value
  const timeFilter = document.getElementById("timeFilter").value

  let tempData = [...fneData]

  // Filtrer par statut
  if (statusFilter) {
    tempData = tempData.filter((fne) => fne.statut === statusFilter)
  }

  // Filtrer par date
  if (dateFilter) {
    const filterDate = new Date(dateFilter)
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
  if (timeFilter) {
    const [filterHour, filterMinute] = timeFilter.split(":").map(Number)
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
}

// Fonction pour réinitialiser les filtres
function resetFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("filterAction").value = ""
  document.getElementById("dateFilter").value = ""
  document.getElementById("timeFilter").value = ""

  filteredData = [...fneData]
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10) || 1

  renderTable()
  updatePagination()
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

    // Debug: Afficher les informations pour comprendre pourquoi le bouton ne s'affiche pas
    console.log(
      `FNE #${fne.fne_id} - Statut: ${fne.statut}, Utilisateur: ${fne.utilisateur ? fne.utilisateur.id : "N/A"}, UserID: ${userId}`,
    )

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
  // Debug: Afficher les informations pour comprendre pourquoi la fonction retourne false
  console.log(
    `canModifyFNE - Rôle: ${userRole}, Statut: ${fne.statut}, FNE User ID: ${fne.utilisateur ? fne.utilisateur.id : "N/A"}, Current User ID: ${userId}`,
  )

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
      // Afficher le modal avec les détails
      document.getElementById("modalFneId").textContent = fne.fne_id

      // Générer le contenu du modal
      const modalBody = document.querySelector("#fneDetailsModal .modal-body")
      modalBody.innerHTML = generateFNEDetailsHTML(fne)

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
    })
    .catch((error) => {
      console.error("Erreur:", error)
      showNotification(error.message || "Erreur lors du chargement des détails de la FNE", "error")
    })
}

// Fonction pour générer le HTML des détails d'une FNE
function generateFNEDetailsHTML(fne) {
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

  return `
        <div class="fne-details">
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
  // Rediriger vers la page de modification appropriée selon le rôle
  window.location.href = `/auth/ajoutFNE?id=${fneId}`
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
      typeLabel = "accident"
      break
    case "incident_grave":
      typeClass = "orange"
      typeLabel = "incident_grave"
      break
    case "incident":
      typeClass = "green"
      typeLabel = "incident"
      break
    case "evt_technique":
      typeClass = "gray"
      typeLabel = "evt_technique"
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
        <table class="pdf-table" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <th style="width: 50%; background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Type d'événement</th>
            <th style="width: 50%; background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; text-align: left;">REF GNE</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${typeLabel || ""}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${fne.ref_gne || ""}</td>
          </tr>
        </table>
        
        <!-- 1. Informations générales -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            1. Informations générales
          </div>
          <table class="pdf-table" style="width: 100%; border-collapse: collapse;">
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
        
        <!-- 2. Aéronef(s) concerné(s) -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            2. Aéronef(s) concerné(s)
          </div>
          
          <!-- Premier aéronef -->
          <div style="margin-top: 8px; margin-bottom: 12px;">
            <div style="font-weight: 600; margin-bottom: 5px; font-size: 0.85rem; padding-left: 5px;">A. Premier aéronef</div>
            <table class="pdf-table" style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Indicatif/Immatriculation</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Code SSR</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Type appareil</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Règles de vol</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.indicatif_immatricultion || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.code_ssr || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.type_appareil || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.regles_vol || ""}</td>
              </tr>
            </table>
            
            <table class="pdf-table" style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Terrain départ</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Terrain arrivée</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Cap</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Altitude réelle</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Altitude autorisée</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Vitesse</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.terrain_depart || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.terrain_arrivée || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.cap || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.altitude_reel || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.altitude_autorise || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.vitesse || ""}</td>
              </tr>
            </table>
          </div>
          
          <!-- Deuxième aéronef -->
          <div style="margin-top: 8px; margin-bottom: 12px;">
            <div style="font-weight: 600; margin-bottom: 5px; font-size: 0.85rem; padding-left: 5px;">B. Deuxième aéronef</div>
            <table class="pdf-table" style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Indicatif/Immatriculation</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Code SSR</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Type appareil</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Règles de vol</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.indicatif_immatricultion_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.code_ssr_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.type_appareil_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.regles_vol_b || ""}</td>
              </tr>
            </table>
            
            <table class="pdf-table" style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Terrain départ</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Terrain arrivée</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Cap</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Altitude réelle</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Altitude autorisée</th>
                <th style="background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left; font-size: 0.8rem;">Vitesse</th>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.terrain_depart_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.terrain_arrivée_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.cap_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.altitude_reel_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.altitude_autorise_b || ""}</td>
                <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 0.8rem;">${fne.vitesse_b || ""}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- 3. Nombre estimatif des victimes -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            3. Nombre estimatif des victimes
          </div>
          <table class="pdf-table" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="width: 25%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Passagers</th>
              <th style="width: 25%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Personnel</th>
              <th style="width: 25%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Équipage</th>
              <th style="width: 25%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Autre</th>
            </tr>
            <tr>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.passagers || ""}</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.personnel || ""}</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.equipage || ""}</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.autre || ""}</td>
            </tr>
          </table>
        </div>
        
        <!-- 4. Conditions météorologiques -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            4. Conditions météorologiques
          </div>
          <table class="pdf-table" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="width: 33%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Direction du vent</th>
              <th style="width: 33%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Vitesse du vent</th>
              <th style="width: 34%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Visibilité</th>
            </tr>
            <tr>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.vent_direction || ""}</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.vent_vitesse || ""}</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.visibilite || ""}</td>
            </tr>
            <tr>
              <th style="width: 33%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Nébulosité</th>
              <th style="width: 33%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Précipitation</th>
              <th style="width: 34%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Autres phénomènes</th>
            </tr>
            <tr>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.nebulosite || ""}</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.precipitation || ""}</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.autres_phenomenes || ""}</td>
            </tr>
          </table>
        </div>
        
        <!-- 5. Matériel, installation ou équipement -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            5. Matériel, installation ou équipement
          </div>
          <table class="pdf-table" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="width: 50%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">L'événement implique une installation/équipement</th>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.evt_implique_installation_équipement === "true" ? "Oui" : "Non"}</td>
            </tr>
            <tr>
              <th style="width: 50%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Type installation/équipement</th>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.type_installation_équipement || ""}</td>
            </tr>
            <tr>
              <th style="width: 50%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">L'événement implique un véhicule ou un matériel d'assistance au sol</th>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.evt_implique_véhicule_materiel_assistance_sol === "true" ? "Oui" : "Non"}</td>
            </tr>
            <tr>
              <th style="width: 50%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Type du matériel/véhicule</th>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.type_materiel_véhicule || ""}</td>
            </tr>
            <tr>
              <th style="width: 50%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Nom compagnie assistance/organisme/exploitant véhicule</th>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${fne.nom_compagnie_assistance_organisme_exploitant_véhicule || ""}</td>
            </tr>
          </table>
        </div>
        
        <!-- 6. Description de l'événement -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            6. Description de l'événement
          </div>
          <div style="padding: 10px; border: 1px solid #e5e7eb; white-space: pre-line; font-size: 0.85rem;">
            ${fne.description_evt || ""}
          </div>
        </div>
        
        <!-- 7. Informations complémentaires -->
        <div style="margin-bottom: 15px;">
          <div style="background-color: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 0.9rem;">
            7. Informations complémentaires
          </div>
          <table class="pdf-table" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="width: 30%; background-color: #f9fafb; padding: 6px; border: 1px solid #e5e7eb; text-align: left;">Créé par</th>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${userName || ""}</td>
            </tr>
          </table>
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

  if (detailsModal) {
    detailsModal.style.display = "none"
  }

  if (pdfModal) {
    pdfModal.style.display = "none"
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
