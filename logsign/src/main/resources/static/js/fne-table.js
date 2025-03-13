// Variables globales
let currentPage = 1
let totalPages = 1
let fneData = []
let filteredData = []
let currentFneId = null

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Charger les données depuis l'API
  loadFneData()

  // Configurer les écouteurs d'événements
  setupEventListeners()
})

// Fonction pour charger les données FNE
function loadFneData() {
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
  fetch("/auth/api/fne/en-attente")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des FNE en attente")
      }
      return response.json()
    })
    .then((data) => {
      fneData = data
      filteredData = [...fneData]
      totalPages = Math.ceil(filteredData.length / 10)

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
                        <p>Erreur lors du chargement des FNE en attente. Veuillez réessayer.</p>
                        <button onclick="loadFneData()" class="btn btn-primary">Réessayer</button>
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
  document.getElementById("filterType").addEventListener("change", applyFilters)

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

  // Onglets du modal
  const tabButtons = document.querySelectorAll(".tab-btn")
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab")

      // Désactiver tous les onglets
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.remove("active")
      })

      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active")
      })

      // Activer l'onglet sélectionné
      this.classList.add("active")
      document.getElementById(tabId).classList.add("active")
    })
  })
}

// Fonction pour filtrer les données
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...fneData]
  } else {
    filteredData = fneData.filter((fne) => {
      return (
        fne.id.toString().includes(searchTerm) ||
        fne.type_evt.toLowerCase().includes(searchTerm) ||
        fne.REF_GNE.toLowerCase().includes(searchTerm) ||
        fne.Lieu_EVT.toLowerCase().includes(searchTerm) ||
        (fne.Indicatif_immatricultion && fne.Indicatif_immatricultion.toLowerCase().includes(searchTerm)) ||
        (fne.description_evt && fne.description_evt.toLowerCase().includes(searchTerm))
      )
    })
  }

  applyFilters()
}

// Fonction pour appliquer les filtres
function applyFilters() {
  const typeFilter = document.getElementById("filterType").value

  let tempData = [...filteredData]

  if (typeFilter) {
    tempData = tempData.filter((fne) => {
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
      return fneType === typeFilter
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

    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${fne.id}</td>
            <td>${fneType}</td>
            <td>${fne.REF_GNE}</td>
            <td>${formatDate(fne.Date)}</td>
            <td>${fne.Lieu_EVT}</td>
            <td>${fne.Indicatif_immatricultion || ""} ${fne.type_appareil ? `(${fne.type_appareil})` : ""}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-view" onclick="viewFneDetails(${fne.id})">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                    <button class="btn btn-warning" onclick="modifierFNE(${fne.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-danger" onclick="refuserFNE(${fne.id})">
                        <i class="fas fa-times"></i> Refuser
                    </button>
                    <button class="btn btn-primary" onclick="validerFNE(${fne.id})">
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
  document.getElementById("nextPage").disabled = currentPage >= totalPages
}

// Fonction pour formater la date
function formatDate(dateString) {
  if (!dateString) return ""

  const options = { day: "2-digit", month: "2-digit", year: "numeric" }
  return new Date(dateString).toLocaleDateString("fr-FR", options)
}

// Fonction pour afficher les détails d'une FNE
function viewFneDetails(fneId) {
  currentFneId = fneId

  // Afficher un indicateur de chargement dans le modal
  document.getElementById("modalFneId").textContent = fneId
  document.getElementById("fneDetailsModal").style.display = "block"

  // Récupérer les détails de la FNE
  fetch(`/auth/api/fne/${fneId}`)
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

      // Onglet Informations générales
      document.getElementById("detail-type").textContent = fneType
      document.getElementById("detail-ref").textContent = fne.REF_GNE
      document.getElementById("detail-organisme").textContent = fne.Organisme_concerné || ""
      document.getElementById("detail-date").textContent = formatDate(fne.Date)
      document.getElementById("detail-heure").textContent = fne.heure_UTC || ""
      document.getElementById("detail-lieu").textContent = fne.Lieu_EVT || ""
      document.getElementById("detail-detection").textContent = fne.moyen_detection || ""
      document.getElementById("detail-impacts").textContent = fne.impacts_operationnels || ""

      // Onglet Aéronef
      document.getElementById("detail-indicatif").textContent = fne.Indicatif_immatricultion || ""
      document.getElementById("detail-ssr").textContent = fne.code_ssr || ""
      document.getElementById("detail-appareil").textContent = fne.type_appareil || ""
      document.getElementById("detail-regles").textContent = fne.regles_vol || ""
      document.getElementById("detail-depart").textContent = fne.terrain_depart || ""
      document.getElementById("detail-arrivee").textContent = fne.terrain_arrivée || ""
      document.getElementById("detail-cap").textContent = fne.cap || ""
      document.getElementById("detail-alt-reel").textContent = fne.altitude_reel || ""
      document.getElementById("detail-alt-auto").textContent = fne.altitude_autorise || ""
      document.getElementById("detail-vitesse").textContent = fne.vitesse || ""

      // Onglet Victimes
      document.getElementById("detail-passagers").textContent = fne.passagers || "0"
      document.getElementById("detail-personnel").textContent = fne.personnel || "0"
      document.getElementById("detail-equipage").textContent = fne.equipage || "0"
      document.getElementById("detail-autre").textContent = fne.autre || "0"

      // Onglet Météo
      document.getElementById("detail-vent-dir").textContent = fne.vent_direction || ""
      document.getElementById("detail-vent-vitesse").textContent = fne.vent_vitesse || ""
      document.getElementById("detail-visibilite").textContent = fne.visibilite || ""
      document.getElementById("detail-nebulosite").textContent = fne.nebulosite || ""
      document.getElementById("detail-precipitation").textContent = fne.precipitation || ""
      document.getElementById("detail-autres-phenomenes").textContent = fne.autres_phenomenes || ""

      // Onglet Équipement
      document.getElementById("detail-implique-installation").textContent =
        fne.evt_implique_installation_équipement === "true" ? "Oui" : "Non"
      document.getElementById("detail-type-installation").textContent = fne.type_installation_équipement || "N/A"
      document.getElementById("detail-compagnie").textContent =
        fne.nom_compagnie_assistance_organisme_exploitant_véhicule || "N/A"
      document.getElementById("detail-implique-vehicule").textContent =
        fne.evt_implique_véhicule_materiel_assistance_sol === "true" ? "Oui" : "Non"
      document.getElementById("detail-type-materiel").textContent = fne.type_materiel_véhicule || "N/A"

      // Onglet Description
      document.getElementById("detail-description").textContent = fne.description_evt || ""
      document.getElementById("detail-redacteur").textContent = fne.nom_rédacteur || ""

      // Activer le premier onglet par défaut
      document.querySelector('.tab-btn[data-tab="general"]').click()
    })
    .catch((error) => {
      console.error("Erreur:", error)
      document.getElementById("fneDetailsModal").innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Erreur</h2>
                        <button class="close-modal" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Une erreur est survenue lors du chargement des détails de la FNE. Veuillez réessayer.</p>
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
  document.getElementById("fneDetailsModal").style.display = "none"
  currentFneId = null
}

// Fonction pour modifier une FNE
function modifierFNE(fneId) {
  window.location.href = `/auth/fneAdmin?id=${fneId}`
}

// Fonction pour refuser une FNE
function refuserFNE(fneId) {
  if (confirm(`Êtes-vous sûr de vouloir refuser la FNE #${fneId} ?`)) {
    // Envoyer une requête AJAX pour refuser la FNE
    fetch(`/auth/api/fne/${fneId}/refuser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors du refus de la FNE")
        }
        return response.json()
      })
      .then((data) => {
        // Supprimer de la liste filtrée car ce n'est plus "En attente"
        filteredData = filteredData.filter((f) => f.id !== fneId)
        fneData = fneData.filter((f) => f.id !== fneId)

        // Fermer le modal si ouvert
        if (currentFneId === fneId) {
          closeModal()
        }

        // Rafraîchir le tableau
        totalPages = Math.ceil(filteredData.length / 10)
        if (currentPage > totalPages && totalPages > 0) {
          currentPage = totalPages
        }
        renderTable()
        updatePagination()

        // Afficher un message de confirmation
        alert(`La FNE #${fneId} a été refusée avec succès.`)
      })
      .catch((error) => {
        console.error("Erreur:", error)
        alert("Erreur lors du refus de la FNE. Veuillez réessayer.")
      })
  }
}

// Fonction pour valider une FNE
function validerFNE(fneId) {
  if (confirm(`Êtes-vous sûr de vouloir valider la FNE #${fneId} ?`)) {
    // Envoyer une requête AJAX pour valider la FNE
    fetch(`/auth/api/fne/${fneId}/valider`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la validation de la FNE")
        }
        return response.json()
      })
      .then((data) => {
        // Supprimer de la liste filtrée car ce n'est plus "En attente"
        filteredData = filteredData.filter((f) => f.id !== fneId)
        fneData = fneData.filter((f) => f.id !== fneId)

        // Fermer le modal si ouvert
        if (currentFneId === fneId) {
          closeModal()
        }

        // Rafraîchir le tableau
        totalPages = Math.ceil(filteredData.length / 10)
        if (currentPage > totalPages && totalPages > 0) {
          currentPage = totalPages
        }
        renderTable()
        updatePagination()

        // Afficher un message de confirmation
        alert(`La FNE #${fneId} a été validée avec succès.`)
      })
      .catch((error) => {
        console.error("Erreur:", error)
        alert("Erreur lors de la validation de la FNE. Veuillez réessayer.")
      })
  }
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("fneDetailsModal")
  if (event.target === modal) {
    closeModal()
  }
}

