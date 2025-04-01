// historique.js

// Variables globales
let currentPage = 1;
let totalPages = 1;
let historiqueData = [];
let filteredData = [];
let currentHistoriqueId = null;
let currentFneId = null;
let usersCache = {}; // Cache pour stocker les informations des utilisateurs

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Mettre à jour les en-têtes du tableau
  updateTableHeaders();
  
  // Charger les données depuis l'API
  loadHistoriqueData();

  // Configurer les écouteurs d'événements
  setupEventListeners();
  
  // Configurer les onglets du modal
  setupTabButtons();
});

// Fonction pour mettre à jour les en-têtes du tableau
function updateTableHeaders() {
  const tableHead = document.querySelector("#historique-table thead tr");
  tableHead.innerHTML = `
    <th>FNE ID</th>
    <th>Type</th>
    <th>Utilisateur</th>
    <th>Date Action</th>
    <th>Action</th>
    <th>Actions</th>
  `;
}

// Fonction pour charger les données d'historique
function loadHistoriqueData() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#historique-table tbody");
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 30px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
        <p>Chargement de l'historique...</p>
      </td>
    </tr>
  `;

  // Faire une requête AJAX pour récupérer l'historique
  fetch("/auth/api/historique")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'historique");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données reçues:", data); // Pour le débogage
      historiqueData = data;
      filteredData = [...historiqueData];
      totalPages = Math.ceil(filteredData.length / 10);

      // Précharger les informations des utilisateurs
      preloadUserInfo();

      // Afficher les données
      renderTable();
      updatePagination();
    })
    .catch((error) => {
      console.error("Erreur:", error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 30px;">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
            <p>Erreur lors du chargement de l'historique. Veuillez réessayer.</p>
            <button onclick="loadHistoriqueData()" class="btn btn-primary">Réessayer</button>
          </td>
        </tr>
      `;
    });
}

// Fonction pour précharger les informations des utilisateurs
function preloadUserInfo() {
  // Collecter tous les IDs d'utilisateurs uniques des FNEs
  const fneUserIds = new Set();
  
  historiqueData.forEach(historique => {
    if (historique.fne && historique.fne.utilisateur && historique.fne.utilisateur.id) {
      fneUserIds.add(historique.fne.utilisateur.id);
    }
  });
  
  // Si aucun utilisateur à charger, sortir
  if (fneUserIds.size === 0) return;
  
  // Charger les informations des utilisateurs
  fneUserIds.forEach(userId => {
    if (!usersCache[userId]) {
      fetch(`/auth/api/users/${userId}`)
        .then(response => {
          if (!response.ok) throw new Error(`Erreur lors de la récupération de l'utilisateur ${userId}`);
          return response.json();
        })
        .then(user => {
          usersCache[userId] = user;
          // Mettre à jour le tableau si nécessaire
          if (document.querySelector("#historique-table tbody")) {
            renderTable();
          }
        })
        .catch(error => {
          console.error("Erreur:", error);
          usersCache[userId] = { nom: "Inconnu", prenom: "" };
        });
    }
  });
}

// Fonction pour obtenir le nom complet d'un utilisateur FNE (créateur)
function getFneUserFullName(fne) {
  if (!fne || !fne.utilisateur) return "Utilisateur inconnu";
  
  const userId = fne.utilisateur.id;
  
  // Si l'utilisateur est dans le cache, utiliser ces informations
  if (usersCache[userId]) {
    const user = usersCache[userId];
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || "Utilisateur inconnu";
  }
  
  // Sinon, utiliser les informations disponibles dans l'objet utilisateur
  return `${fne.utilisateur.prenom || ""} ${fne.utilisateur.nom || ""}`.trim() || "Utilisateur inconnu";
}

// Fonction pour configurer les écouteurs d'événements
function setupEventListeners() {
  // Recherche
  document.getElementById("searchBtn").addEventListener("click", () => {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    filterData(searchTerm);
  });

  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      const searchTerm = e.target.value.toLowerCase();
      filterData(searchTerm);
    }
  });

  // Filtres
  document.getElementById("filterBtn").addEventListener("click", applyFilters);

  // Pagination
  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      updatePagination();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      updatePagination();
    }
  });
}

// Fonction pour configurer les onglets du modal
function setupTabButtons() {
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('tab-btn')) {
      const tabButtons = document.querySelectorAll(".tab-btn");
      tabButtons.forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
      
      // Activer l'onglet cliqué
      e.target.classList.add("active");
      const tabId = e.target.getAttribute("data-tab");
      if (document.getElementById(tabId)) {
        document.getElementById(tabId).classList.add("active");
      }
    }
  });
}

// Fonction pour filtrer les données
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...historiqueData];
  } else {
    searchTerm = searchTerm.toLowerCase();
    filteredData = historiqueData.filter((historique) => {
      // Obtenir le nom de l'utilisateur FNE (créateur)
      const fneUserName = getFneUserFullName(historique.fne).toLowerCase();
      
      return (
        (historique.fne && historique.fne.fne_id && historique.fne.fne_id.toString().includes(searchTerm)) ||
        (historique.fne && historique.fne.type_evt && historique.fne.type_evt.toLowerCase().includes(searchTerm)) ||
        fneUserName.includes(searchTerm) ||
        (historique.action && historique.action.toLowerCase().includes(searchTerm)) ||
        (historique.dateAction && formatDateTime(historique.dateAction).toLowerCase().includes(searchTerm))
      );
    });
  }

  currentPage = 1;
  totalPages = Math.ceil(filteredData.length / 10);

  renderTable();
  updatePagination();
}

// Fonction pour appliquer les filtres
function applyFilters() {
  const actionFilter = document.getElementById("filterAction").value;
  const dateDebut = document.getElementById("dateDebut").value;
  const dateFin = document.getElementById("dateFin").value;

  let tempData = [...historiqueData];

  if (actionFilter) {
    tempData = tempData.filter((historique) => historique.action === actionFilter);
  }

  // Filtrage par date
  if (dateDebut || dateFin) {
    tempData = tempData.filter((historique) => {
      const actionDate = new Date(historique.dateAction);

      // Vérifier la date de début
      if (dateDebut) {
        const debutDate = new Date(dateDebut);
        debutDate.setHours(0, 0, 0, 0); // Début de journée

        if (actionDate < debutDate) {
          return false;
        }
      }

      // Vérifier la date de fin
      if (dateFin) {
        const finDate = new Date(dateFin);
        finDate.setHours(23, 59, 59, 999); // Fin de journée

        if (actionDate > finDate) {
          return false;
        }
      }

      return true;
    });
  }

  filteredData = tempData;
  currentPage = 1;
  totalPages = Math.ceil(filteredData.length / 10);

  renderTable();
  updatePagination();
}

// Fonction pour formater les valeurs pour l'affichage
function formatValue(value, defaultValue = "Non spécifié") {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  return value;
}

// Fonction pour formater la date
function formatDate(dateString) {
  if (!dateString) return "Non spécifiée";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date invalide";
    
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch (error) {
    console.error("Erreur de formatage de date:", error);
    return "Date invalide";
  }
}

// Fonction pour formater l'heure
function formatTime(timeString) {
  if (!timeString) return "Non spécifiée";
  
  // Si c'est déjà au format heure (HH:MM ou HH:MM:SS)
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeString)) {
    return timeString;
  }
  
  // Si c'est une date complète, extraire l'heure
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return "Heure invalide";
    
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    console.error("Erreur de formatage d'heure:", error);
    return "Heure invalide";
  }
}

// Fonction pour formater la date et l'heure
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "Non spécifiée";
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "Date invalide";
    
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    console.error("Erreur de formatage de date et heure:", error);
    return "Date invalide";
  }
}

// Fonction pour afficher les données dans le tableau
function renderTable() {
  const tableBody = document.querySelector("#historique-table tbody");
  tableBody.innerHTML = "";

  const startIndex = (currentPage - 1) * 10;
  const endIndex = Math.min(startIndex + 10, filteredData.length);

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px;">
          <i class="fas fa-search" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
          <p>Aucun historique trouvé. Veuillez modifier vos critères de recherche.</p>
        </td>
      </tr>
    `;
    return;
  }

  for (let i = startIndex; i < endIndex; i++) {
    const historique = filteredData[i];

    // Vérifier si les données nécessaires sont disponibles
    if (!historique.fne) {
      console.error("Données FNE manquantes pour l'historique:", historique);
      continue;
    }

    // Déterminer la classe du badge en fonction de l'action
    let actionClass = "";
    switch (historique.action) {
      case "Création":
        actionClass = "action-creation";
        break;
      case "Modification":
        actionClass = "action-modification";
        break;
      case "Validation":
        actionClass = "action-validation";
        break;
      case "Refus":
        actionClass = "action-refus";
        break;
    }

    // Récupérer le nom de l'utilisateur FNE (créateur)
    const fneUserName = getFneUserFullName(historique.fne);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${historique.fne.fne_id}</td>
      <td>${historique.fne.type_evt || ""}</td>
      <td>${fneUserName}</td>
      <td>${formatDateTime(historique.dateAction)}</td>
      <td><span class="action-badge ${actionClass}">${historique.action}</span></td>
      <td>
        <button class="btn btn-view" onclick="viewHistoriqueDetails(${historique.historique_id})">
          <i class="fas fa-eye"></i> Voir
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  }
}

// Fonction pour mettre à jour la pagination
function updatePagination() {
  document.getElementById("pageInfo").textContent = `Page ${currentPage} sur ${totalPages || 1}`;

  document.getElementById("prevPage").disabled = currentPage <= 1;
  document.getElementById("nextPage").disabled = currentPage >= totalPages;
}

// Fonction pour afficher les détails d'une entrée d'historique
function viewHistoriqueDetails(historiqueId) {
  currentHistoriqueId = historiqueId;

  // Récupérer les détails de l'historique
  fetch(`/auth/api/historique/${historiqueId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails de l'historique");
      }
      return response.json();
    })
    .then((historique) => {
      currentFneId = historique.fne.fne_id;
      
      // Récupérer les détails complets de la FNE
      return fetch(`/auth/api/fne/${historique.fne.fne_id}`);
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails de la FNE");
      }
      return response.json();
    })
    .then((fne) => {
      // Créer et afficher le modal avec les détails complets
      createDetailModal(fne, currentHistoriqueId);
    })
    .catch((error) => {
      console.error("Erreur:", error);
      alert("Erreur lors du chargement des détails. Veuillez réessayer.");
    });
}

// Fonction pour créer et afficher le modal avec les détails
function createDetailModal(fne, historiqueId) {
  // Récupérer l'historique correspondant
  const historique = historiqueData.find(h => h.historique_id === historiqueId);
  if (!historique) {
    console.error("Historique non trouvé:", historiqueId);
    return;
  }

  // Déterminer la classe du badge en fonction de l'action
  let actionClass = "";
  switch (historique.action) {
    case "Création":
      actionClass = "action-creation";
      break;
    case "Modification":
      actionClass = "action-modification";
      break;
    case "Validation":
      actionClass = "action-validation";
      break;
    case "Refus":
      actionClass = "action-refus";
      break;
  }

  // Récupérer le nom de l'utilisateur FNE (créateur)
  const fneUserName = getFneUserFullName(fne);

  // Créer le contenu du modal
  const modalHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Détails de l'historique #${historiqueId} - FNE #${fne.fne_id}</h2>
        <button class="close-modal" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="historique-info">
          <h3>Informations de l'historique</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Action:</label>
              <span><span class="action-badge ${actionClass}">${historique.action}</span></span>
            </div>
            <div class="detail-item">
              <label>Date de l'action:</label>
              <span>${formatDateTime(historique.dateAction)}</span>
            </div>
            <div class="detail-item">
              <label>Utilisateur:</label>
              <span>${fneUserName}</span>
            </div>
            <div class="detail-item">
              <label>Statut actuel:</label>
              <span>${formatValue(fne.statut)}</span>
            </div>
          </div>
        </div>
        
        <div class="tabs">
          <button class="tab-btn active" data-tab="general">Informations générales</button>
          <button class="tab-btn" data-tab="aeronef">Aéronef</button>
          <button class="tab-btn" data-tab="victimes">Victimes</button>
          <button class="tab-btn" data-tab="meteo">Météo</button>
          <button class="tab-btn" data-tab="equipement">Équipement</button>
          <button class="tab-btn" data-tab="description">Description</button>
        </div>
        
        <div id="general" class="tab-content active">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Type d'événement:</label>
              <span>${formatValue(fne.type_evt)}</span>
            </div>
            <div class="detail-item">
              <label>REF GNE:</label>
              <span>${formatValue(fne.REF_GNE)}</span>
            </div>
            <div class="detail-item">
              <label>Organisme concerné:</label>
              <span>${formatValue(fne.Organisme_concerné)}</span>
            </div>
            <div class="detail-item">
              <label>Date:</label>
              <span>${formatDate(fne.Date)}</span>
            </div>
            <div class="detail-item">
              <label>Heure UTC:</label>
              <span>${formatValue(fne.heure_UTC)}</span>
            </div>
            <div class="detail-item">
              <label>Lieu de l'événement:</label>
              <span>${formatValue(fne.lieu_EVT)}</span>
            </div>
            <div class="detail-item">
              <label>Moyen de détection:</label>
              <span>${formatValue(fne.moyen_detection)}</span>
            </div>
            <div class="detail-item">
              <label>Impacts opérationnels:</label>
              <span>${formatValue(fne.impacts_operationnels)}</span>
            </div>
          </div>
        </div>
        
        <div id="aeronef" class="tab-content">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Indicatif/Immatriculation:</label>
              <span>${formatValue(fne.Indicatif_immatricultion)}</span>
            </div>
            <div class="detail-item">
              <label>Code SSR:</label>
              <span>${formatValue(fne.code_ssr)}</span>
            </div>
            <div class="detail-item">
              <label>Type d'appareil:</label>
              <span>${formatValue(fne.type_appareil)}</span>
            </div>
            <div class="detail-item">
              <label>Règles de vol:</label>
              <span>${formatValue(fne.regles_vol)}</span>
            </div>
            <div class="detail-item">
              <label>Terrain de départ:</label>
              <span>${formatValue(fne.terrain_depart)}</span>
            </div>
            <div class="detail-item">
              <label>Terrain d'arrivée:</label>
              <span>${formatValue(fne.terrain_arrivée)}</span>
            </div>
            <div class="detail-item">
              <label>Cap:</label>
              <span>${formatValue(fne.cap)}</span>
            </div>
            <div class="detail-item">
              <label>Altitude réelle:</label>
              <span>${formatValue(fne.altitude_reel)}</span>
            </div>
            <div class="detail-item">
              <label>Altitude autorisée:</label>
              <span>${formatValue(fne.altitude_autorise)}</span>
            </div>
            <div class="detail-item">
              <label>Vitesse:</label>
              <span>${formatValue(fne.vitesse)}</span>
            </div>
          </div>
        </div>
        
        <div id="victimes" class="tab-content">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Passagers:</label>
              <span>${formatValue(fne.passagers, "0")}</span>
            </div>
            <div class="detail-item">
              <label>Personnel:</label>
              <span>${formatValue(fne.personnel, "0")}</span>
            </div>
            <div class="detail-item">
              <label>Équipage:</label>
              <span>${formatValue(fne.equipage, "0")}</span>
            </div>
            <div class="detail-item">
              <label>Autre:</label>
              <span>${formatValue(fne.autre, "0")}</span>
            </div>
          </div>
        </div>
        
        <div id="meteo" class="tab-content">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Direction du vent:</label>
              <span>${formatValue(fne.vent_direction)}</span>
            </div>
            <div class="detail-item">
              <label>Vitesse du vent:</label>
              <span>${formatValue(fne.vent_vitesse)}</span>
            </div>
            <div class="detail-item">
              <label>Visibilité:</label>
              <span>${fne.visibilite ? `${fne.visibilite} m` : "Non spécifiée"}</span>
            </div>
            <div class="detail-item">
              <label>Nébulosité:</label>
              <span>${formatValue(fne.nebulosite)}</span>
            </div>
            <div class="detail-item">
              <label>Précipitation:</label>
              <span>${formatValue(fne.precipitation)}</span>
            </div>
            <div class="detail-item">
              <label>Autres phénomènes:</label>
              <span>${formatValue(fne.autres_phenomenes)}</span>
            </div>
          </div>
        </div>
        
        <div id="equipement" class="tab-content">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Événement implique installation/équipement:</label>
              <span>${fne.evt_implique_installation_équipement ? "Oui" : "Non"}</span>
            </div>
            <div class="detail-item">
              <label>Type installation/équipement:</label>
              <span>${formatValue(fne.type_installation_équipement)}</span>
            </div>
            <div class="detail-item">
              <label>Nom compagnie assistance/organisme/exploitant véhicule:</label>
              <span>${formatValue(fne.nom_compagnie_assistance_organisme_exploitant_véhicule)}</span>
            </div>
            <div class="detail-item">
              <label>Événement implique véhicule/matériel assistance sol:</label>
              <span>${fne.evt_implique_véhicule_materiel_assistance_sol ? "Oui" : "Non"}</span>
            </div>
            <div class="detail-item">
              <label>Type matériel/véhicule:</label>
              <span>${formatValue(fne.type_materiel_véhicule)}</span>
            </div>
          </div>
        </div>
        
        <div id="description" class="tab-content">
          <div class="detail-item full-width">
            <label>Description de l'événement:</label>
            <div class="description-box">${formatValue(fne.description_evt)}</div>
          </div>
          <div class="detail-item">
            <label>Nom du rédacteur:</label>
            <span>${formatValue(fne.nom_rédacteur)}</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        <button class="btn btn-primary" onclick="viewFNE(${fne.fne_id})">
          <i class="fas fa-file-alt"></i> Voir la FNE
        </button>
      </div>
    </div>
  `;

  // Afficher le modal
  const modalElement = document.getElementById("historiqueDetailsModal");
  modalElement.innerHTML = modalHTML;
  modalElement.style.display = "block";
  
  // Activer le premier onglet
  const firstTab = modalElement.querySelector('.tab-btn[data-tab="general"]');
  if (firstTab) {
    firstTab.click();
  }
}

// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("historiqueDetailsModal").style.display = "none";
  currentHistoriqueId = null;
  currentFneId = null;
}

// Fonction pour voir la FNE associée
function viewFNE(fneId) {
  if (!fneId) return;

  window.location.href = `/auth/fneAdmin?id=${fneId}&mode=view`;
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("historiqueDetailsModal");
  if (event.target === modal) {
    closeModal();
  }
};
//
// Fonction pour voir la FNE associée en format PDF non modifiable
function viewFNE(fneId) {
  if (!fneId) return;

  // Récupérer les détails complets de la FNE
  fetch(`/auth/api/fne/${fneId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails de la FNE");
      }
      return response.json();
    })
    .then((fne) => {
      // Créer et afficher le modal avec la FNE en format PDF
      createFNEPdfView(fne);
    })
    .catch((error) => {
      console.error("Erreur:", error);
      alert("Erreur lors du chargement de la FNE. Veuillez réessayer.");
    });
}

// Fonction pour créer et afficher la vue PDF de la FNE
function createFNEPdfView(fne) {
  // Récupérer le nom de l'utilisateur FNE (créateur)
  const fneUserName = getFneUserFullName(fne);

  // Déterminer la classe de couleur en fonction du type d'événement
  let typeClass = "";
  switch (fne.type_evt) {
    case "accident":
      typeClass = "red";
      break;
    case "incident_grave":
      typeClass = "orange";
      break;
    case "incident":
      typeClass = "green";
      break;
    case "evt_technique":
      typeClass = "gray";
      break;
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
          <span class="pdf-status-value status-${fne.statut.toLowerCase().replace(/ /g, '-')}">${fne.statut}</span>
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
                <div class="pdf-value">${formatValue(fne.REF_GNE)}</div>
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
                <div class="pdf-value">${formatValue(fne.Organisme_concerné)}</div>
              </div>
              <div class="pdf-field">
                <label>Date:</label>
                <div class="pdf-value">${formatDate(fne.Date)}</div>
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
            <div class="pdf-table">
              <table>
                <tr>
                  <th>Indicatif/Immatriculation</th>
                  <th>Code SSR</th>
                  <th>Type appareil</th>
                  <th>Règles de vol</th>
                </tr>
                <tr>
                  <td>${formatValue(fne.Indicatif_immatricultion)}</td>
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
              <div class="pdf-description">${formatValue(fne.description_evt).replace(/\n/g, '<br>')}</div>
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
                <label>Nom du rédacteur:</label>
                <div class="pdf-value">${formatValue(fne.nom_rédacteur)}</div>
              </div>
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
        <button class="btn btn-primary" onclick="printFNE()">
          <i class="fas fa-print"></i> Imprimer
        </button>
      </div>
    </div>
  `;

  // Afficher le modal
  const modalElement = document.getElementById("historiqueDetailsModal");
  modalElement.innerHTML = modalHTML;
  modalElement.style.display = "block";
  modalElement.classList.add("pdf-modal");
}

// Fonction pour imprimer la FNE
function printFNE() {
  const modalContent = document.querySelector(".pdf-view").cloneNode(true);
  
  // Supprimer les boutons et éléments non nécessaires pour l'impression
  const closeButton = modalContent.querySelector(".close-modal");
  const footer = modalContent.querySelector(".modal-footer");
  if (closeButton) closeButton.remove();
  if (footer) footer.remove();
  
  // Créer une fenêtre d'impression
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>FNE - Impression</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        <link rel="stylesheet" href="/css/styleadmin.css">
        <link rel="stylesheet" href="/css/historiqueA.css">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: white;
          }
          .pdf-view {
            width: 100%;
            margin: 0;
            box-shadow: none;
          }
          .pdf-section {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .pdf-description {
            white-space: pre-wrap;
          }
          @media print {
            .modal-header {
              background-color: #f0f0f0 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .pdf-section-header {
              background-color: #f9f9f9 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${modalContent.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}