// Variables globales
let currentPage = 1;
let totalPages = 1;
let fneData = [];
let filteredData = [];
let currentFneId = null;
let usersCache = {}; // Cache pour stocker les informations des utilisateurs
let aircraftsCache = {}; // Cache pour stocker les informations des aéronefs

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Charger les données depuis l'API
  loadFneEnAttente();

  // Configurer les écouteurs d'événements
  setupEventListeners();
  
  // Configurer les onglets du modal
  setupTabButtons();
});

// Fonction pour charger les FNE en attente
function loadFneEnAttente() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#fne-table tbody");
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 30px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
        <p>Chargement des FNE en attente...</p>
      </td>
    </tr>
  `;

  // Faire une requête AJAX pour récupérer les FNE en attente
  fetch("/auth/api/fne?statut=En attente")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données reçues:", data); // Pour le débogage
      
      // S'assurer que data est un tableau
      fneData = Array.isArray(data) ? data : [];
      
      // Si data n'est pas un tableau mais un objet avec une propriété contenant les données
      if (!Array.isArray(data) && data && typeof data === 'object') {
        // Essayer de trouver une propriété qui contient un tableau
        for (const key in data) {
          if (Array.isArray(data[key])) {
            fneData = data[key];
            break;
          }
        }
      }
      
      filteredData = [...fneData];
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
          <td colspan="7" style="text-align: center; padding: 30px;">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
            <p>Erreur lors du chargement des FNE. Veuillez réessayer.</p>
            <button onclick="loadFneEnAttente()" class="btn btn-primary">Réessayer</button>
          </td>
        </tr>
      `;
    });
}

// Fonction pour précharger les informations des utilisateurs
function preloadUserInfo() {
  // Collecter tous les IDs d'utilisateurs uniques
  const userIds = new Set();
  
  fneData.forEach(fne => {
    if (fne.utilisateur && fne.utilisateur.id) {
      userIds.add(fne.utilisateur.id);
    }
  });

  // Si aucun utilisateur à charger, sortir
  if (userIds.size === 0) return;
  
  // Charger les informations des utilisateurs
  userIds.forEach(userId => {
    if (!usersCache[userId]) {
      fetch(`/auth/api/users/${userId}`)
        .then(response => {
          if (!response.ok) throw new Error(`Erreur lors de la récupération de l'utilisateur ${userId}`);
          return response.json();
        })
        .then(user => {
          usersCache[userId] = user;
          // Mettre à jour le tableau si nécessaire
          if (document.querySelector("#fne-table tbody")) {
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
function getUserFullName(utilisateur) {
  if (!utilisateur) return "Utilisateur inconnu";
  
  const userId = utilisateur.id;
  
  // Si l'utilisateur est dans le cache, utiliser ces informations
  if (usersCache[userId]) {
    const user = usersCache[userId];
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || "Utilisateur inconnu";
  }
  
  // Sinon, utiliser les informations disponibles dans l'objet utilisateur
  return `${utilisateur.prenom || ""} ${utilisateur.nom || ""}`.trim() || "Utilisateur inconnu";
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Recherche
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", applyFilters);
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        applyFilters();
      }
    });
  }

  // Filtres
  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) {
    filterBtn.addEventListener("click", applyFilters);
  }
  
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetFilters);
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
  const tableBody = document.querySelector("#fne-table tbody");
  if (!tableBody) return;
  
  tableBody.innerHTML = "";

  const startIndex = (currentPage - 1) * 10;
  const endIndex = Math.min(startIndex + 10, filteredData.length);

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px;">
          <i class="fas fa-search" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
          <p>Aucune FNE en attente trouvée. Veuillez modifier vos critères de recherche.</p>
        </td>
      </tr>
    `;
    return;
  }

  for (let i = startIndex; i < endIndex; i++) {
    const fne = filteredData[i];
    
    // Obtenir le nom de l'utilisateur
    const userName = getUserFullName(fne.utilisateur);
    
    const row = document.createElement("tr");
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
    nextPage.disabled = currentPage >= totalPages || totalPages === 0;
  }
}

// Fonction pour réinitialiser les filtres
function resetFilters() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.value = "";
  }
  
  const dateFilter = document.getElementById("dateFilter");
  if (dateFilter) {
    dateFilter.value = "";
  }
  
  const timeFilter = document.getElementById("timeFilter");
  if (timeFilter) {
    timeFilter.value = "";
  }
  
  // Réinitialiser les données filtrées
  filteredData = [...fneData];
  currentPage = 1;
  totalPages = Math.ceil(filteredData.length / 10) || 1;
  
  // Mettre à jour l'affichage
  renderTable();
  updatePagination();
  
  console.log("Filtres réinitialisés");
}

// Fonction pour appliquer les filtres
function applyFilters() {
  const searchInput = document.getElementById("searchInput");
  const dateFilter = document.getElementById("dateFilter");
  const timeFilter = document.getElementById("timeFilter");
  
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const dateValue = dateFilter ? dateFilter.value : "";
  const timeValue = timeFilter ? timeFilter.value : "";
  
  console.log("Filtres appliqués:", {
    search: searchTerm,
    date: dateValue,
    time: timeValue
  });
  
  // Commencer avec toutes les données
  let result = [...fneData];
  
  // Filtre par terme de recherche
  if (searchTerm) {
    result = result.filter((fne) => {
      const userName = getUserFullName(fne.utilisateur).toLowerCase();
      return (
        (fne.fne_id && fne.fne_id.toString().includes(searchTerm)) ||
        (fne.type_evt && fne.type_evt.toLowerCase().includes(searchTerm)) ||
        (fne.lieu_EVT && fne.lieu_EVT.toLowerCase().includes(searchTerm)) ||
        userName.includes(searchTerm)
      );
    });
  }
  
  // Filtrage par date
  if (dateValue) {
    result = result.filter((fne) => {
      if (!fne.date) return false;
      
      const fneDate = new Date(fne.date);
      const filterDate = new Date(dateValue);
      
      return (
        fneDate.getFullYear() === filterDate.getFullYear() &&
        fneDate.getMonth() === filterDate.getMonth() &&
        fneDate.getDate() === filterDate.getDate()
      );
    });
  }
  
  // Filtrage par heure
  if (timeValue) {
    const [filterHour, filterMinute] = timeValue.split(":").map(Number);
    
    result = result.filter((fne) => {
      if (!fne.heure_UTC) return false;
      
      // Si c'est déjà au format heure (HH:MM ou HH:MM:SS)
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(fne.heure_UTC)) {
        const [hour, minute] = fne.heure_UTC.split(":").map(Number);
        return hour === filterHour && minute === filterMinute;
      }
      
      // Si c'est une date complète
      const fneTime = new Date(fne.heure_UTC);
      return fneTime.getHours() === filterHour && fneTime.getMinutes() === filterMinute;
    });
  }
  
  console.log("Résultats filtrés:", result.length);
  
  filteredData = result;
  currentPage = 1;
  totalPages = Math.ceil(filteredData.length / 10) || 1;
  
  renderTable();
  updatePagination();
}

// Fonction pour afficher les détails d'une FNE
function viewFneDetails(fneId) {
  currentFneId = fneId;

  // Afficher un indicateur de chargement
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Chargement des détails...</p>
    </div>
  `;
  document.body.appendChild(loadingOverlay);

  // Récupérer les détails de la FNE
  fetch(`/auth/api/fne/${fneId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((fne) => {
      // Récupérer les aéronefs associés à cette FNE
      fetch(`/auth/api/aircrafts?fne_id=${fneId}`)
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
          
          // Créer et afficher le modal avec la FNE
          displayFneDetails(fne, aircrafts);
        })
        .catch(error => {
          console.error("Erreur lors de la récupération des aéronefs:", error);
          
          // Supprimer l'indicateur de chargement
          document.body.removeChild(loadingOverlay);
          
          // Créer et afficher le modal avec la FNE, sans aéronefs
          displayFneDetails(fne, []);
        });
    })
    .catch((error) => {
      // Supprimer l'indicateur de chargement s'il est encore présent
      if (document.body.contains(loadingOverlay)) {
        document.body.removeChild(loadingOverlay);
      }
      
      console.error("Erreur:", error);
      alert("Erreur lors du chargement des détails de la FNE. Veuillez réessayer.");
    });
}

// Fonction pour afficher les détails d'une FNE dans le modal
function displayFneDetails(fne, aircrafts) {
  const modalFneId = document.getElementById("modalFneId");
  if (modalFneId) {
    modalFneId.textContent = fne.fne_id;
  }
  
  // Remplir les détails généraux
  const detailElements = {
    "detail-type": fne.type_evt,
    "detail-ref": fne.ref_gne,
    "detail-organisme": fne.organisme_concerné,
    "detail-date": formatDate(fne.date),
    "detail-heure": formatTime(fne.heure_UTC),
    "detail-lieu": fne.lieu_EVT,
    "detail-detection": fne.moyen_detection,
    "detail-impacts": fne.impacts_operationnels
  };
  
  // Mettre à jour tous les éléments de détail
  for (const [id, value] of Object.entries(detailElements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = formatValue(value);
    }
  }
  
  // Remplir les détails de l'aéronef (premier aéronef si disponible)
  const aircraft = aircrafts && aircrafts.length > 0 ? aircrafts[0] : null;
  
  if (aircraft) {
    const aircraftElements = {
      "detail-indicatif": aircraft.indicatif,
      "detail-ssr": aircraft.codeSsr,
      "detail-appareil": aircraft.typeAppareil,
      "detail-regles": aircraft.reglesVol,
      "detail-depart": aircraft.terrainDepart,
      "detail-arrivee": aircraft.terrainArrivee,
      "detail-cap": aircraft.cap,
      "detail-alt-reel": aircraft.altitudeReel,
      "detail-alt-auto": aircraft.altitudeAutorise,
      "detail-vitesse": aircraft.vitesse
    };
    
    for (const [id, value] of Object.entries(aircraftElements)) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = formatValue(value);
      }
    }
  } else {
    // Si pas d'aéronef, afficher "Non spécifié" pour tous les champs
    const aircraftIds = [
      "detail-indicatif", "detail-ssr", "detail-appareil", "detail-regles",
      "detail-depart", "detail-arrivee", "detail-cap", "detail-alt-reel",
      "detail-alt-auto", "detail-vitesse"
    ];
    
    aircraftIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = "Non spécifié";
      }
    });
  }
  
  // Remplir les détails des victimes
  const victimesElements = {
    "detail-passagers": fne.passagers || "0",
    "detail-personnel": fne.personnel || "0",
    "detail-equipage": fne.equipage || "0",
    "detail-autre": fne.autre || "0"
  };
  
  for (const [id, value] of Object.entries(victimesElements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = formatValue(value, "0");
    }
  }
  
  // Remplir les détails météo
  const meteoElements = {
    "detail-vent-dir": fne.vent_direction,
    "detail-vent-vitesse": fne.vent_vitesse,
    "detail-visibilite": fne.visibilite ? `${fne.visibilite} m` : "Non spécifiée",
    "detail-nebulosite": fne.nebulosite,
    "detail-precipitation": fne.precipitation,
    "detail-autres-phenomenes": fne.autres_phenomenes
  };
  
  for (const [id, value] of Object.entries(meteoElements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = formatValue(value);
    }
  }
  
  // Remplir les détails d'équipement
  const equipementElements = {
    "detail-implique-installation": fne.evt_implique_installation_équipement ? "Oui" : "Non",
    "detail-type-installation": fne.type_installation_équipement,
    "detail-compagnie": fne.nom_compagnie_assistance_organisme_exploitant_véhicule,
    "detail-implique-vehicule": fne.evt_implique_véhicule_materiel_assistance_sol ? "Oui" : "Non",
    "detail-type-materiel": fne.type_materiel_véhicule
  };
  
  for (const [id, value] of Object.entries(equipementElements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = formatValue(value);
    }
  }
  
  // Remplir la description
  const detailDescription = document.getElementById("detail-description");
  if (detailDescription) {
    detailDescription.innerHTML = formatValue(fne.description_evt).replace(/\n/g, '<br>');
  }
  
  const detailRedacteur = document.getElementById("detail-redacteur");
  if (detailRedacteur) {
    detailRedacteur.textContent = getUserFullName(fne.utilisateur);
  }
  
  // Afficher le modal
  const fneDetailsModal = document.getElementById("fneDetailsModal");
  if (fneDetailsModal) {
    fneDetailsModal.style.display = "block";
  }
}

// Fonction pour fermer le modal
function closeModal() {
  const fneDetailsModal = document.getElementById("fneDetailsModal");
  if (fneDetailsModal) {
    fneDetailsModal.style.display = "none";
  }
  currentFneId = null;
}

// Fonction pour modifier une FNE
function modifierFNE(fneId) {
  window.location.href = `/auth/fneAdmin?id=${fneId}`;
}

// Fonction pour refuser une FNE
function refuserFNE(fneId) {
  if (!confirm("Êtes-vous sûr de vouloir refuser cette FNE ?")) {
    return;
  }

  fetch(`/auth/api/fne/${fneId}/refuser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include'
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        alert("FNE refusée avec succès !");
        
        // Fermer le modal si ouvert
        closeModal();
        
        // Recharger les données
        loadFneEnAttente();
      } else {
        alert("Erreur : " + (data.error || "Une erreur est survenue"));
      }
    })
    .catch((error) => {
      console.error("Erreur:", error);
      alert("Erreur lors du refus de la FNE. Veuillez réessayer.");
    });
}

// Fonction pour valider une FNE
function validerFNE(fneId) {
  if (!confirm("Êtes-vous sûr de vouloir valider cette FNE ?")) {
    return;
  }

  fetch(`/auth/api/fne/${fneId}/valider`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include'
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        alert("FNE validée avec succès !");
        
        // Fermer le modal si ouvert
        closeModal();
        
        // Recharger les données
        loadFneEnAttente();
      } else {
        alert("Erreur : " + (data.error || "Une erreur est survenue"));
      }
    })
    .catch((error) => {
      console.error("Erreur:", error);
      alert("Erreur lors de la validation de la FNE. Veuillez réessayer.");
    });
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("fneDetailsModal");
  if (modal && event.target === modal) {
    closeModal();
  }
};

// Ajouter un écouteur d'événements pour la touche Échap
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// Fonction pour réessayer le chargement des FNE (pour le bouton Réessayer)
function retryLoading() {
  loadFneEnAttente();
}