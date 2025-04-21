// historique.js

// Variables globales
let currentPage = 1;
let totalPages = 1;
let historiqueData = [];
let filteredData = [];
let groupedData = []; // Nouvelle variable pour stocker les données groupées
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
    <th>REF GNE</th>
    <th>Utilisateur</th>
    <th>Date de création</th>
    <th>Statut</th>
    <th>Actions</th>
  `;
}

// Fonction pour charger les données d'historique
function loadHistoriqueData() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#historique-table tbody");
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 30px;">
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
      
      // Grouper les données par FNE ID
      groupHistoriqueData();
      
      // Filtrer les données (utilise maintenant groupedData)
      filteredData = [...groupedData];
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
          <td colspan="7" style="text-align: center; padding: 30px;">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
            <p>Erreur lors du chargement de l'historique. Veuillez réessayer.</p>
            <button onclick="loadHistoriqueData()" class="btn btn-primary">Réessayer</button>
          </td>
        </tr>
      `;
    });
}

// Fonction pour grouper les données d'historique par FNE ID
function groupHistoriqueData() {
  // Créer un objet pour stocker les données groupées temporairement
  const groupedObj = {};
  
  // Parcourir toutes les entrées d'historique
  historiqueData.forEach(historique => {
    if (!historique.fne || !historique.fne.fne_id) return;
    
    const fneId = historique.fne.fne_id;
    
    // Si cette FNE n'existe pas encore dans notre objet groupé, l'initialiser
    if (!groupedObj[fneId]) {
      groupedObj[fneId] = {
        fne: historique.fne,
        historiques: [],
        // Trouver la date de création (la plus ancienne action "Création")
        dateCreation: null,
        // Statut actuel (le plus récent)
        lastHistorique: null
      };
    }
    
    // Ajouter cet historique au tableau des historiques pour cette FNE
    groupedObj[fneId].historiques.push(historique);
    
    // Mettre à jour la date de création si c'est une action de création
    if (historique.action === "Création") {
      if (!groupedObj[fneId].dateCreation || new Date(historique.dateAction) < new Date(groupedObj[fneId].dateCreation)) {
        groupedObj[fneId].dateCreation = historique.dateAction;
      }
    }
    
    // Mettre à jour le dernier historique (pour déterminer le statut actuel)
    if (!groupedObj[fneId].lastHistorique || new Date(historique.dateAction) > new Date(groupedObj[fneId].lastHistorique.dateAction)) {
      groupedObj[fneId].lastHistorique = historique;
    }
  });
  
  // Convertir l'objet en tableau pour faciliter le tri et l'affichage
  groupedData = Object.values(groupedObj);
  
  // Trier par ID de FNE (décroissant pour avoir les plus récents en premier)
  groupedData.sort((a, b) => b.fne.fne_id - a.fne.fne_id);
}

// Fonction pour précharger les informations des utilisateurs
function preloadUserInfo() {
  // Collecter tous les IDs d'utilisateurs uniques des FNEs
  const fneUserIds = new Set();
  
  groupedData.forEach(group => {
    if (group.fne && group.fne.utilisateur && group.fne.utilisateur.id) {
      fneUserIds.add(group.fne.utilisateur.id);
    }
    
    // Ajouter également les utilisateurs des historiques
    group.historiques.forEach(historique => {
      if (historique.utilisateur && historique.utilisateur.id) {
        fneUserIds.add(historique.utilisateur.id);
      }
    });
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

// Fonction pour obtenir le nom complet d'un utilisateur
function getUserFullName(user) {
  if (!user) return "Utilisateur inconnu";
  
  const userId = user.id;
  
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
    filteredData = [...groupedData];
  } else {
    searchTerm = searchTerm.toLowerCase();
    filteredData = groupedData.filter((group) => {
      const fne = group.fne;
      // Obtenir le nom de l'utilisateur FNE (créateur)
      const fneUserName = getUserFullName(fne.utilisateur).toLowerCase();
      
      // Rechercher dans les historiques également
      const historiqueMatch = group.historiques.some(historique => 
        historique.action.toLowerCase().includes(searchTerm) ||
        (historique.dateAction && formatDateTime(historique.dateAction).toLowerCase().includes(searchTerm))
      );
      
      return (
        (fne.fne_id && fne.fne_id.toString().includes(searchTerm)) ||
        (fne.type_evt && fne.type_evt.toLowerCase().includes(searchTerm)) ||
        (fne.ref_gne && fne.ref_gne.toLowerCase().includes(searchTerm)) ||
        fneUserName.includes(searchTerm) ||
        historiqueMatch
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

  let tempData = [...groupedData];

  if (actionFilter) {
    tempData = tempData.filter((group) => {
      // Vérifier si au moins un historique correspond à l'action filtrée
      return group.historiques.some(historique => historique.action === actionFilter);
    });
  }

  // Filtrage par date
  if (dateDebut || dateFin) {
    tempData = tempData.filter((group) => {
      // Vérifier si au moins un historique est dans la plage de dates
      return group.historiques.some(historique => {
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

// Fonction pour déterminer le statut actuel d'une FNE en fonction de son dernier historique
function getStatusFromLastAction(group) {
  if (!group.lastHistorique) return "En attente";
  
  switch (group.lastHistorique.action) {
    case "Validation":
      return "Validé";
    case "Refus":
      return "Refusé";
    default:
      return group.fne.statut || "En attente";
  }
}

// Fonction pour obtenir la classe CSS du statut
function getStatusClass(status) {
  switch (status) {
    case "Validé":
      return "action-validation";
    case "Refusé":
      return "action-refus";
    case "En attente":
      return "action-creation";
    default:
      return "";
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
        <td colspan="7" style="text-align: center; padding: 30px;">
          <i class="fas fa-search" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
          <p>Aucun historique trouvé. Veuillez modifier vos critères de recherche.</p>
        </td>
      </tr>
    `;
    return;
  }

  for (let i = startIndex; i < endIndex; i++) {
    const group = filteredData[i];
    const fne = group.fne;

    // Vérifier si les données nécessaires sont disponibles
    if (!fne) {
      console.error("Données FNE manquantes pour le groupe:", group);
      continue;
    }

    // Déterminer le statut actuel
    const currentStatus = getStatusFromLastAction(group);
    const statusClass = getStatusClass(currentStatus);

    // Récupérer le nom de l'utilisateur FNE (créateur)
    const fneUserName = getUserFullName(fne.utilisateur);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${fne.fne_id}</td>
      <td>${fne.type_evt || ""}</td>
      <td>${formatValue(fne.ref_gne)}</td>
      <td>${fneUserName}</td>
      <td>${formatDateTime(group.dateCreation)}</td>
      <td><span class="action-badge ${statusClass}">${currentStatus}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-view" onclick="viewFNEHistory(${fne.fne_id})">
            <i class="fas fa-eye"></i> Voir
          </button>
          <button class="btn btn-danger" onclick="deleteFNE(${fne.fne_id})">
            <i class="fas fa-trash"></i> Supprimer
          </button>
        </div>
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

// Fonction pour afficher l'historique complet d'une FNE
function viewFNEHistory(fneId) {
  currentFneId = fneId;
  
  // Trouver le groupe correspondant à cette FNE
  const group = groupedData.find(g => g.fne.fne_id === fneId);
  if (!group) {
    console.error("FNE non trouvée:", fneId);
    alert("Erreur: FNE non trouvée");
    return;
  }
  
  // Récupérer les détails complets de la FNE
  fetch(`/auth/api/fne/${fneId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails de la FNE");
      }
      return response.json();
    })
    .then((fne) => {
      // Créer et afficher le modal avec les détails complets et l'historique
      createHistoryModal(fne, group.historiques);
    })
    .catch((error) => {
      console.error("Erreur:", error);
      alert("Erreur lors du chargement des détails. Veuillez réessayer.");
    });
}

// Fonction pour créer et afficher le modal avec l'historique complet
function createHistoryModal(fne, historiques) {
  // Trier les historiques par date (du plus récent au plus ancien)
  const sortedHistoriques = [...historiques].sort((a, b) => 
    new Date(b.dateAction) - new Date(a.dateAction)
  );
  
  // Récupérer le nom de l'utilisateur FNE (créateur)
  const fneUserName = getUserFullName(fne.utilisateur);

  // Créer le contenu de l'historique
  let historiqueHTML = '';
  sortedHistoriques.forEach(historique => {
    const actionClass = getActionClass(historique.action);
    const userName = getUserFullName(historique.utilisateur);
    
    historiqueHTML += `
      <div class="history-item">
        <div class="history-header">
          <span class="action-badge ${actionClass}">${historique.action}</span>
          <span class="history-date">${formatDateTime(historique.dateAction)}</span>
        </div>
        <div class="history-content">
          <p><strong>Utilisateur:</strong> ${userName}</p>
        </div>
      </div>
    `;
  });

  // Créer le contenu du modal
  const modalHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Historique de la FNE #${fne.fne_id}</h2>
        <button class="close-modal" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="tabs">
          <button class="tab-btn active" data-tab="history">Historique</button>
          <button class="tab-btn" data-tab="general">Informations générales</button>
          <button class="tab-btn" data-tab="aeronef">Aéronef</button>
          <button class="tab-btn" data-tab="victimes">Victimes</button>
          <button class="tab-btn" data-tab="meteo">Météo</button>
          <button class="tab-btn" data-tab="equipement">Équipement</button>
          <button class="tab-btn" data-tab="description">Description</button>
        </div>
        
        <div id="history" class="tab-content active">
          <h3>Chronologie des actions</h3>
          <div class="history-timeline">
            ${historiqueHTML}
          </div>
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
              <span>${formatValue(fne.organisme_concerné)}</span>
            </div>
            <div class="detail-item">
              <label>Date:</label>
              <span>${formatDate(fne.date)}</span>
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
              <span>${formatValue(fne.indicatif_immatricultion)}</span>
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
            <div class="description-box">${formatValue(fne.description_evt).replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        <button class="btn btn-primary" onclick="viewFNEPdf(${fne.fne_id})">
          <i class="fas fa-file-pdf"></i> Voir en PDF
        </button>
      </div>
    </div>
  `;

  // Afficher le modal
  const modalElement = document.getElementById("historiqueDetailsModal");
  modalElement.innerHTML = modalHTML;
  modalElement.style.display = "block";
  
  // Ajouter du style pour la chronologie
  const styleElement = document.createElement('style');
  styleElement.textContent = `
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
  `;
  document.head.appendChild(styleElement);
  
  // Activer le premier onglet
  const firstTab = modalElement.querySelector('.tab-btn[data-tab="history"]');
  if (firstTab) {
    firstTab.click();
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

// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("historiqueDetailsModal").style.display = "none";
  currentFneId = null;
}

// Fonction pour voir la FNE en format PDF
function viewFNEPdf(fneId) {
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
  const fneUserName = getUserFullName(fne.utilisateur);

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
                <label>Créé par:</label>
                <div class="pdf-value">${fneUserName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        
      </div>
    </div>
  `;

  // Afficher le modal
  const modalElement = document.getElementById("historiqueDetailsModal");
  modalElement.innerHTML = modalHTML;
  modalElement.style.display = "block";
  modalElement.classList.add("pdf-modal");
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
      alert(`La FNE #${fneId} a été supprimée avec succès. Les numéros des FNE suivantes ont été réorganisés.`);
      
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