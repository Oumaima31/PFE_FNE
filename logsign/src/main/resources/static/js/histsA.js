// Variables globales
let currentPage = 1;
let totalPages = 1;
let historiqueData = [];
let filteredData = [];
let currentFneId = null;
let usersCache = {}; // Cache pour stocker les informations des utilisateurs
let aircraftsCache = {}; // Cache pour stocker les informations des aéronefs

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Mettre à jour les en-têtes du tableau
  updateTableHeaders();

  // Charger les données depuis l'API
  loadHistoriqueData();

  // Configurer les écouteurs d'événements
  setupEventListeners();
});

// Fonction pour mettre à jour les en-têtes du tableau
function updateTableHeaders() {
  const tableHead = document.querySelector("#historique-table thead tr");
  if (tableHead) {
    tableHead.innerHTML = `
      <th>ID</th>
      <th>FNE ID</th>
      <th>Type</th>
      <th>REF GNE</th>
      <th>Action</th>
      <th>Date_action</th>
      <th>Utilisateur</th>
      <th>Actions</th>
    `;
  }
}

// Fonction pour charger les données d'historique
function loadHistoriqueData() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#historique-table tbody");
  if (!tableBody) {
    console.error("Élément #historique-table tbody non trouvé");
    return;
  }

  tableBody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 30px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
        <p>Chargement de l'historique...</p>
      </td>
    </tr>
  `;

  // Faire une requête AJAX pour récupérer l'historique avec credentials
  fetch("/auth/api/historique", {
    method: "GET",
    credentials: 'include', // Important pour les cookies d'authentification
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données historique reçues:", data); // Pour le débogage
      
      // Vérifier si data est un tableau ou un objet avec une propriété contenant les données
      if (Array.isArray(data)) {
        historiqueData = data;
      } else if (data && typeof data === 'object') {
        // Chercher une propriété qui contient un tableau
        for (const key in data) {
          if (Array.isArray(data[key])) {
            historiqueData = data[key];
            break;
          }
        }
        // Si aucun tableau n'est trouvé, utiliser l'objet comme élément unique
        if (!Array.isArray(historiqueData)) {
          historiqueData = [data];
        }
      } else {
        historiqueData = [];
        console.error("Format de données inattendu:", data);
      }
      
      // Filtrer les données
      filteredData = [...historiqueData];
      totalPages = Math.ceil(filteredData.length / 10) || 1;

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
          <td colspan="8" style="text-align: center; padding: 30px;">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
            <p>Erreur lors du chargement de l'historique: ${error.message}</p>
            <button onclick="loadHistoriqueData()" class="btn btn-primary">Réessayer</button>
          </td>
        </tr>
      `;
    });
}

// Fonction pour précharger les informations des utilisateurs
function preloadUserInfo() {
  // Collecter tous les IDs d'utilisateurs uniques
  const userIds = new Set();

  historiqueData.forEach(historique => {
    if (historique.utilisateur && historique.utilisateur.id) {
      userIds.add(historique.utilisateur.id);
    }
    if (historique.fne && historique.fne.utilisateur && historique.fne.utilisateur.id) {
      userIds.add(historique.fne.utilisateur.id);
    }
  });

  // Si aucun utilisateur à charger, sortir
  if (userIds.size === 0) return;

  // Charger les informations des utilisateurs
  userIds.forEach(userId => {
    if (!usersCache[userId]) {
      fetch(`/auth/api/users/${userId}`, {
        credentials: 'include' // Important pour les cookies d'authentification
      })
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

// Fonction pour obtenir le nom complet d'un utilisateur
function getUserFullName(user) {
  if (!user) return "Utilisateur inconnu";

  const userId = user.id;
  if (!userId) return "Utilisateur inconnu";

  // Si l'utilisateur est dans le cache, utiliser ces informations
  if (usersCache[userId]) {
    const cachedUser = usersCache[userId];
    return `${cachedUser.prenom || ""} ${cachedUser.nom || ""}`.trim() || "Utilisateur inconnu";
  }

  // Sinon, utiliser les informations disponibles dans l'objet utilisateur
  return `${user.prenom || ""} ${user.nom || ""}`.trim() || "Utilisateur inconnu";
}

// Fonction pour configurer les écouteurs d'événements
function setupEventListeners() {
  // Recherche
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        const searchTerm = searchInput.value.toLowerCase();
        filterData(searchTerm);
      }
    });
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        const searchTerm = e.target.value.toLowerCase();
        filterData(searchTerm);
      }
    });
  }

  // Filtres
  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) {
    filterBtn.addEventListener("click", applyFilters);
  }

  // Pagination
  const prevPage = document.getElementById("prevPage");
  if (prevPage) {
    prevPage.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
        updatePagination();
      }
    });
  }

  const nextPage = document.getElementById("nextPage");
  if (nextPage) {
    nextPage.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
        updatePagination();
      }
    });
  }
}

// Fonction pour filtrer les données
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...historiqueData];
  } else {
    searchTerm = searchTerm.toLowerCase();
    filteredData = historiqueData.filter((historique) => {
      const fne = historique.fne;
      if (!fne) return false;
      
      // Obtenir le nom de l'utilisateur
      const userName = getUserFullName(historique.utilisateur).toLowerCase();
      const fneUserName = getUserFullName(fne.utilisateur).toLowerCase();
      
      return (
        (historique.historique_id && historique.historique_id.toString().includes(searchTerm)) ||
        (fne.fne_id && fne.fne_id.toString().includes(searchTerm)) ||
        (fne.type_evt && fne.type_evt.toLowerCase().includes(searchTerm)) ||
        (fne.ref_gne && fne.ref_gne.toLowerCase().includes(searchTerm)) ||
        (historique.action && historique.action.toLowerCase().includes(searchTerm)) ||
        (historique.dateAction && formatDateTime(historique.dateAction).toLowerCase().includes(searchTerm)) ||
        userName.includes(searchTerm) ||
        fneUserName.includes(searchTerm)
      );
    });
  }

  currentPage = 1;
  totalPages = Math.ceil(filteredData.length / 10) || 1;

  renderTable();
  updatePagination();
}

// Fonction pour appliquer les filtres
function applyFilters() {
  const actionFilter = document.getElementById("filterAction");
  const dateDebut = document.getElementById("dateDebut");
  const dateFin = document.getElementById("dateFin");
  
  const actionValue = actionFilter ? actionFilter.value : "";
  const dateDebutValue = dateDebut ? dateDebut.value : "";
  const dateFinValue = dateFin ? dateFin.value : "";

  let tempData = [...historiqueData];

  if (actionValue) {
    tempData = tempData.filter((historique) => historique.action === actionValue);
  }

  // Filtrage par date
  if (dateDebutValue || dateFinValue) {
    tempData = tempData.filter((historique) => {
      if (!historique.dateAction) return false;
      
      const actionDate = new Date(historique.dateAction);

      // Vérifier la date de début
      if (dateDebutValue) {
        const debutDate = new Date(dateDebutValue);
        debutDate.setHours(0, 0, 0, 0); // Début de journée

        if (actionDate < debutDate) {
          return false;
        }
      }

      // Vérifier la date de fin
      if (dateFinValue) {
        const finDate = new Date(dateFinValue);
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
  totalPages = Math.ceil(filteredData.length / 10) || 1;

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

// Fonction pour obtenir la classe CSS en fonction de l'action
function getActionClass(action) {
  switch (action) {
    case "Création":
      return "action-creation";
    case "Modification":
      return "action-modification";
    case "Validation":
      return "action-validation";
    case "Refus":
      return "action-refus";
    default:
      return "";
  }
}

// Fonction pour afficher les données dans le tableau
function renderTable() {
  const tableBody = document.querySelector("#historique-table tbody");
  if (!tableBody) return;
  
  tableBody.innerHTML = "";

  const startIndex = (currentPage - 1) * 10;
  const endIndex = Math.min(startIndex + 10, filteredData.length);

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px;">
          <i class="fas fa-search" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
          <p>Aucun historique trouvé. Veuillez modifier vos critères de recherche.</p>
        </td>
      </tr>
    `;
    return;
  }

  for (let i = startIndex; i < endIndex; i++) {
    const historique = filteredData[i];
    const fne = historique.fne;

    // Vérifier si les données nécessaires sont disponibles
    if (!fne) {
      console.error("Données FNE manquantes pour l'historique:", historique);
      continue;
    }

    // Récupérer le nom de l'utilisateur
    const userName = getUserFullName(historique.utilisateur);
    const actionClass = getActionClass(historique.action);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${historique.historique_id}</td>
      <td>${fne.fne_id}</td>
      <td>${fne.type_evt || ""}</td>
      <td>${formatValue(fne.ref_gne)}</td>
      <td><span class="action-badge ${actionClass}">${historique.action || "undefined"}</span></td>
      <td>${formatDateTime(historique.dateAction)}</td>
      <td>${userName}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-view" onclick="viewHistoriqueDetails(${historique.historique_id})">
            <i class="fas fa-eye"></i> Voir
          </button>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  }
}

// Fonction pour mettre à jour la pagination
function updatePagination() {
  const pageInfo = document.getElementById("pageInfo");
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} sur ${totalPages || 1}`;
  }

  const prevPage = document.getElementById("prevPage");
  if (prevPage) {
    prevPage.disabled = currentPage <= 1;
  }
  
  const nextPage = document.getElementById("nextPage");
  if (nextPage) {
    nextPage.disabled = currentPage >= totalPages;
  }
}

// Fonction pour afficher les détails d'un historique
function viewHistoriqueDetails(historiqueId) {
  // Trouver l'historique correspondant
  const historique = historiqueData.find(h => h.historique_id === historiqueId);
  if (!historique) {
    console.error("Historique non trouvé:", historiqueId);
    alert("Erreur: Historique non trouvé");
    return;
  }

  const fneId = historique.fne.fne_id;

  // Récupérer les détails complets de la FNE
  fetch(`/auth/api/fne/${fneId}`, {
    credentials: 'include' // Important pour les cookies d'authentification
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((fne) => {
      // Récupérer les aéronefs associés à cette FNE
      fetch(`/auth/api/aircrafts?fne_id=${fneId}`, {
        credentials: 'include' // Important pour les cookies d'authentification
      })
        .then(response => {
          if (!response.ok && response.status !== 404) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          return response.status === 404 ? [] : response.json();
        })
        .then(aircrafts => {
          // Stocker les aéronefs dans le cache
          aircraftsCache[fneId] = aircrafts;
          
          // Récupérer l'historique complet de cette FNE
          fetch(`/auth/api/historique/fne/${fneId}`, {
            credentials: 'include' // Important pour les cookies d'authentification
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
              }
              return response.json();
            })
            .then(fneHistorique => {
              // Afficher le modal avec toutes les informations
              displayHistoriqueModal(historique, fne, aircrafts, fneHistorique);
            })
            .catch(error => {
              console.error("Erreur:", error);
              // Afficher le modal sans l'historique complet
              displayHistoriqueModal(historique, fne, aircrafts, []);
            });
        })
        .catch(error => {
          console.error("Erreur:", error);
          // Afficher le modal sans les aéronefs
          displayHistoriqueModal(historique, fne, [], []);
        });
    })
    .catch((error) => {
      console.error("Erreur:", error);
      alert(`Erreur lors du chargement des détails: ${error.message}`);
    });
}

// Fonction pour afficher le modal avec les détails
function displayHistoriqueModal(historique, fne, aircrafts, fneHistorique) {
  // Récupérer le nom de l'utilisateur de l'historique
  const userName = getUserFullName(historique.utilisateur);

  // Récupérer le nom de l'utilisateur de la FNE
  const fneUserName = getUserFullName(fne.utilisateur);

  // Trier l'historique par date (du plus récent au plus ancien)
  const sortedHistorique = [...fneHistorique].sort((a, b) => 
    new Date(b.dateAction) - new Date(a.dateAction)
  );

  // Créer le contenu de l'historique
  let historiqueHTML = '';
  sortedHistorique.forEach(h => {
    const actionClass = getActionClass(h.action);
    const hUserName = getUserFullName(h.utilisateur);
    
    historiqueHTML += `
      <div class="history-item">
        <div class="history-header">
          <span class="action-badge ${actionClass}">${h.action}</span>
          <span class="history-date">${formatDateTime(h.dateAction)}</span>
        </div>
        <div class="history-content">
          <p><strong>Utilisateur:</strong> ${hUserName}</p>
        </div>
      </div>
    `;
  });

  // Créer le contenu des aéronefs
  let aircraftsHTML = '';
  if (aircrafts && aircrafts.length > 0) {
    aircrafts.forEach(aircraft => {
      aircraftsHTML += `
        <div class="aircraft-item">
          <h4>Aéronef ${aircraft.designation || ''}</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Indicatif/Immatriculation:</label>
              <span>${formatValue(aircraft.indicatif)}</span>
            </div>
            <div class="detail-item">
              <label>Code SSR:</label>
              <span>${formatValue(aircraft.codeSsr)}</span>
            </div>
            <div class="detail-item">
              <label>Type d'appareil:</label>
              <span>${formatValue(aircraft.typeAppareil)}</span>
            </div>
            <div class="detail-item">
              <label>Règles de vol:</label>
              <span>${formatValue(aircraft.reglesVol)}</span>
            </div>
            <div class="detail-item">
              <label>Terrain de départ:</label>
              <span>${formatValue(aircraft.terrainDepart)}</span>
            </div>
            <div class="detail-item">
              <label>Terrain d'arrivée:</label>
              <span>${formatValue(aircraft.terrainArrivee)}</span>
            </div>
            <div class="detail-item">
              <label>Cap:</label>
              <span>${formatValue(aircraft.cap)}</span>
            </div>
            <div class="detail-item">
              <label>Altitude réelle:</label>
              <span>${formatValue(aircraft.altitudeReel)}</span>
            </div>
            <div class="detail-item">
              <label>Altitude autorisée:</label>
              <span>${formatValue(aircraft.altitudeAutorise)}</span>
            </div>
            <div class="detail-item">
              <label>Vitesse:</label>
              <span>${formatValue(aircraft.vitesse)}</span>
            </div>
          </div>
        </div>
      `;
    });
  } else {
    aircraftsHTML = `
      <div class="no-data">
        <p>Aucun aéronef associé à cette FNE.</p>
      </div>
    `;
  }

  // Créer le contenu du modal
  const modalHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Détails de l'historique #${historique.historique_id}</h2>
        <button class="close-modal" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="tabs">
          <button class="tab-btn active" data-tab="details">Détails</button>
          <button class="tab-btn" data-tab="history">Historique complet</button>
          <button class="tab-btn" data-tab="aircrafts">Aéronefs</button>
          <button class="tab-btn" data-tab="general">Informations générales</button>
        </div>
        
        <div id="details" class="tab-content active">
          <div class="detail-section">
            <h3>Informations générales</h3>
            <div class="detail-row">
              <div class="detail-label">ID Historique:</div>
              <div class="detail-value">${historique.historique_id}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">ID FNE:</div>
              <div class="detail-value">${fne.fne_id}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Type d'événement:</div>
              <div class="detail-value">${formatValue(fne.type_evt)}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">REF GNE:</div>
              <div class="detail-value">${formatValue(fne.ref_gne)}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Action:</div>
              <div class="detail-value">
                <span class="action-badge ${getActionClass(historique.action)}">${historique.action || "undefined"}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Date:</div>
              <div class="detail-value">${formatDateTime(historique.dateAction)}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Utilisateur:</div>
              <div class="detail-value">${userName}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Créateur de la FNE:</div>
              <div class="detail-value">${fneUserName}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Statut:</div>
              <div class="detail-value">${formatValue(fne.statut)}</div>
            </div>
          </div>
        </div>
        
        <div id="history" class="tab-content">
          <h3>Chronologie des actions</h3>
          <div class="history-timeline">
            ${historiqueHTML || '<p>Aucun historique disponible.</p>'}
          </div>
        </div>
        
        <div id="aircrafts" class="tab-content">
          <h3>Aéronefs associés à cette FNE</h3>
          ${aircraftsHTML}
        </div>
        
        <div id="general" class="tab-content">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Type d'événement:</label>
              <span>${formatValue(fne.type_evt)}</span>
            </div>
            <div class="detail-item">
              <label>REF GNE:</label>
              <span>${formatValue(fne.ref_gne)}</span>
            </div>
            <div class="detail-item">
              <label>Organisme concerné:</label>
              <span>${formatValue(fne.Organisme_concerné || fne.organisme_concerné)}</span>
            </div>
            <div class="detail-item">
              <label>Date:</label>
              <span>${formatDate(fne.Date || fne.date)}</span>
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
            <div class="detail-item">
              <label>Description de l'événement:</label>
              <div class="description-box">${formatValue(fne.description_evt).replace(/\n/g, '<br>')}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        <button class="btn btn-primary" onclick="voirFNE(${fne.fne_id})">
          <i class="fas fa-file-alt"></i> Voir la FNE complète
        </button>
        <button class="btn btn-warning" onclick="modifierFNE(${fne.fne_id})">
          <i class="fas fa-edit"></i> Modifier
        </button>
        <button class="btn btn-danger" onclick="deleteFNE(${fne.fne_id})">
          <i class="fas fa-trash"></i> Supprimer
        </button>
      </div>
    </div>
  `;

  // Afficher le modal
  const modalElement = document.getElementById("historiqueDetailsModal");
  if (!modalElement) {
    console.error("Élément #historiqueDetailsModal non trouvé");
    return;
  }
  
  modalElement.innerHTML = modalHTML;
  modalElement.style.display = "block";

  // Ajouter du style pour la chronologie et les aéronefs
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 20px;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 10px 15px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-weight: 500;
      color: #6b7280;
      white-space: nowrap;
    }
    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    .history-timeline {
      margin: 20px 0;
    }
    .history-item {
      border-left: 3px solid #ddd;
      padding: 10px 20px;
      margin-bottom: 15px;
      position: relative;
    }
    .history-item:before {
      content: '';
      width: 12px;
      height: 12px;
      background: #fff;
      border: 3px solid #3b82f6;
      border-radius: 50%;
      position: absolute;
      left: -8px;
      top: 15px;
    }
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .history-date {
      color: #666;
      font-size: 0.9rem;
    }
    .history-content {
      background: #f9f9f9;
      padding: 10px;
      border-radius: 4px;
    }
    .aircraft-item {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #3b82f6;
    }
    .aircraft-item h4 {
      margin-top: 0;
      color: #3b82f6;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
    }
    .detail-item {
      margin-bottom: 10px;
    }
    .detail-item label {
      display: block;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .description-box {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      white-space: pre-line;
    }
    .no-data {
      text-align: center;
      padding: 30px;
      color: #666;
    }
    .detail-row {
      display: flex;
      margin-bottom: 10px;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 8px;
    }
    .detail-label {
      font-weight: 500;
      width: 200px;
      color: #6b7280;
    }
    .detail-value {
      flex: 1;
    }
  `;
  document.head.appendChild(styleElement);

  // Configurer les onglets
  const tabButtons = modalElement.querySelectorAll(".tab-btn");
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      // Désactiver tous les onglets
      tabButtons.forEach(btn => btn.classList.remove("active"));
      modalElement.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
      
      // Activer l'onglet cliqué
      button.classList.add("active");
      const tabId = button.getAttribute("data-tab");
      modalElement.querySelector(`#${tabId}`).classList.add("active");
    });
  });
}

// Fonction pour fermer le modal
function closeModal() {
  const historiqueDetailsModal = document.getElementById("historiqueDetailsModal");
  if (historiqueDetailsModal) {
    historiqueDetailsModal.style.display = "none";
  }

  // Fermer également le modal PDF
  const fnePdfModal = document.getElementById("fnePdfModal");
  if (fnePdfModal) {
    fnePdfModal.style.display = "none";
  }
}

// Fonction pour voir la FNE associée
function voirFNE(fneId) {
  if (!fneId) {
    console.error("L'ID de la FNE est indéfini.");
    return;
  }

  // Afficher un indicateur de chargement
  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "loading-overlay";
  loadingOverlay.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Chargement des détails...</p>
    </div>
  `;
  document.body.appendChild(loadingOverlay);

  // Récupérer les détails de la FNE
  fetch(`/auth/api/fne/${fneId}`, {
    credentials: 'include' // Important pour les cookies d'authentification
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((fne) => {
      // Récupérer les aéronefs associés à cette FNE
      fetch(`/auth/api/aircrafts?fne_id=${fneId}`, {
        credentials: 'include' // Important pour les cookies d'authentification
      })
        .then(response => {
          if (!response.ok && response.status !== 404) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          return response.status === 404 ? [] : response.json();
        })
        .then(aircrafts => {
          // Stocker les aéronefs dans le cache
          aircraftsCache[fneId] = aircrafts;
          
          // Supprimer l'indicateur de chargement
          document.body.removeChild(loadingOverlay);

          // Fermer le modal des détails de l'historique
          const historiqueDetailsModal = document.getElementById("historiqueDetailsModal");
          if (historiqueDetailsModal) {
            historiqueDetailsModal.style.display = "none";
          }

          // Créer et afficher le modal avec la FNE en format PDF
          createFNEPdfView(fne, aircrafts);
        })
        .catch(error => {
          console.error("Erreur lors de la récupération des aéronefs:", error);
          
          // Supprimer l'indicateur de chargement
          document.body.removeChild(loadingOverlay);
          
          // Créer et afficher le modal avec la FNE en format PDF, sans aéronefs
          createFNEPdfView(fne, []);
        });
    })
    .catch((error) => {
      // Supprimer l'indicateur de chargement s'il est encore présent
      if (document.body.contains(loadingOverlay)) {
        document.body.removeChild(loadingOverlay);
      }

      console.error("Erreur:", error);
      alert(`Erreur lors du chargement des détails de la FNE: ${error.message}`);
    });
}

// Fonction pour créer et afficher la vue PDF de la FNE
function createFNEPdfView(fne, aircrafts) {
  // Récupérer le nom de l'utilisateur FNE (créateur)
  let fneUserName = "Utilisateur inconnu";
  if (fne.utilisateur) {
    fneUserName = `${fne.utilisateur.prenom || ""} ${fne.utilisateur.nom || ""}`.trim();
  }

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

  // Préparer les boutons d'action en fonction du statut
  let actionButtons = `
    <button class="btn btn-secondary" onclick="closeFnePdfModal()">Fermer</button>
    <button class="btn btn-danger" onclick="deleteFNE(${fne.fne_id})">
      <i class="fas fa-trash"></i> Supprimer
    </button>
    <button class="btn btn-warning" onclick="modifierFNE(${fne.fne_id})">
      <i class="fas fa-edit"></i> Modifier
    </button>
  `;

  // Créer le contenu HTML pour les aéronefs
  let aircraftsHTML = '';
  if (aircrafts && aircrafts.length > 0) {
    // Créer un tableau pour chaque aéronef
    aircrafts.forEach(aircraft => {
      aircraftsHTML += `
        <div class="pdf-table">
          <table>
            <tr>
              <th>Indicatif/Immatriculation</th>
              <th>Code SSR</th>
              <th>Type appareil</th>
              <th>Règles de vol</th>
            </tr>
            <tr>
              <td>${formatValue(aircraft.indicatif)}</td>
              <td>${formatValue(aircraft.codeSsr)}</td>
              <td>${formatValue(aircraft.typeAppareil)}</td>
              <td>${formatValue(aircraft.reglesVol)}</td>
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
              <td>${formatValue(aircraft.terrainDepart)}</td>
              <td>${formatValue(aircraft.terrainArrivee)}</td>
              <td>${formatValue(aircraft.cap)}</td>
              <td>${formatValue(aircraft.altitudeReel)}</td>
              <td>${formatValue(aircraft.altitudeAutorise)}</td>
              <td>${formatValue(aircraft.vitesse)}</td>
            </tr>
          </table>
        </div>
      `;
    });
  } else {
    aircraftsHTML = `
      <div class="pdf-section-content">
        <p class="no-data">Aucun aéronef associé à cette FNE.</p>
      </div>
    `;
  }

  // Créer le contenu du modal PDF
  const modalHTML = `
    <div class="modal-content pdf-view">
      <div class="modal-header ${typeClass}">
        <div class="pdf-header">
          <img src="/image/oacaLogo.jpg" alt="Logo" class="pdf-logo">
          <h2>Fiche de Notification d'Evénement (FNE) #${fne.fne_id}</h2>
        </div>
        <button class="close-modal" onclick="closeFnePdfModal()">&times;</button>
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
                <div class="pdf-value">${formatValue(fne.Organisme_concerné || fne.organisme_concerné)}</div>
              </div>
              <div class="pdf-field">
                <label>Date:</label>
                <div class="pdf-value">${formatDate(fne.Date || fne.date)}</div>
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
          ${aircraftsHTML}
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
        ${actionButtons}
      </div>
    </div>
  `;

  // Créer le modal PDF s'il n'existe pas
  let fnePdfModal = document.getElementById("fnePdfModal");
  if (!fnePdfModal) {
    fnePdfModal = document.createElement("div");
    fnePdfModal.id = "fnePdfModal";
    fnePdfModal.className = "modal";
    document.body.appendChild(fnePdfModal);
  }

  // Afficher le modal PDF
  fnePdfModal.innerHTML = modalHTML;
  fnePdfModal.style.display = "block";
}

// Fonction pour fermer le modal PDF de la FNE
function closeFnePdfModal() {
  const fnePdfModal = document.getElementById("fnePdfModal");
  if (fnePdfModal) {
    fnePdfModal.style.display = "none";
  }
}

// Fonction pour modifier une FNE
function modifierFNE(fneId) {
  if (!fneId) {
    console.error("L'ID de la FNE est indéfini.");
    return;
  }

  // Rediriger vers la page de modification de la FNE
  window.location.href = `/auth/fneAdmin?id=${fneId}`;
}

// Fonction pour supprimer une FNE
function deleteFNE(fneId) {
  // Demander confirmation avant de supprimer
  if (!confirm(`Êtes-vous sûr de vouloir supprimer la FNE #${fneId} ? Cette action est irréversible.`)) {
    return;
  }

  // Afficher un indicateur de chargement
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Suppression en cours...</p>
    </div>
  `;
  document.body.appendChild(loadingOverlay);

  // Envoyer la requête de suppression au serveur
  fetch(`/auth/api/fne/${fneId}/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  .then(response => {
    // Supprimer l'indicateur de chargement
    document.body.removeChild(loadingOverlay);
    
    return response.json().then(data => {
      if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP: ${response.status}`);
      }
      return data;
    });
  })
  .then(data => {
    if (data.success) {
      // Afficher un message de succès
      alert(`La FNE #${fneId} a été supprimée avec succès.`);
      
      // Fermer les modals ouverts
      closeModal();
      closeFnePdfModal();
      
      // Recharger les données
      loadHistoriqueData();
    } else {
      alert(`Erreur: ${data.message || 'Une erreur est survenue lors de la suppression.'}`);
    }
  })
  .catch(error => {
    // Supprimer l'indicateur de chargement s'il est encore présent
    if (document.body.contains(loadingOverlay)) {
      document.body.removeChild(loadingOverlay);
    }
    
    console.error('Erreur:', error);
    alert(`Erreur lors de la suppression: ${error.message}`);
  });
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("historiqueDetailsModal");
  if (event.target === modal) {
    closeModal();
  }

  const fnePdfModal = document.getElementById("fnePdfModal");
  if (event.target === fnePdfModal) {
    closeFnePdfModal();
  }
};

// Ajouter un écouteur d'événements pour la touche Échap
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    closeFnePdfModal();
  }
});