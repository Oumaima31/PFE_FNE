// Variables globales
let currentPage = 1;
let totalPages = 1;
let fneData = [];
let filteredData = [];
let currentFneId = null;
let usersCache = {}; // Cache pour stocker les informations des utilisateurs

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
  fetch("/auth/api/fne/en-attente")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des FNE en attente");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données reçues:", data); // Pour le débogage
      fneData = data;
      filteredData = [...fneData];
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
  const userIds = [...new Set(fneData.map(fne => fne.utilisateur?.id).filter(id => id))];
  
  // Si aucun utilisateur à charger, sortir
  if (userIds.length === 0) return;
  
  // Charger les informations des utilisateurs en une seule requête si possible
  // Sinon, charger individuellement
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

  // Filtre par type
  document.getElementById("filterType").addEventListener("change", () => {
    const filterType = document.getElementById("filterType").value;
    filterByType(filterType);
  });

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
  const tabButtons = document.querySelectorAll(".tab-btn");
  
  tabButtons.forEach(button => {
    button.addEventListener("click", function() {
      // Désactiver tous les onglets
      tabButtons.forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
      
      // Activer l'onglet cliqué
      this.classList.add("active");
      const tabId = this.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });
}

// Fonction pour filtrer les données par terme de recherche
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...fneData];
  } else {
    filteredData = fneData.filter((fne) => {
      // Récupérer le nom de l'utilisateur pour la recherche
      const userName = getUserFullName(fne.utilisateur).toLowerCase();
      
      return (
        (fne.fne_id && fne.fne_id.toString().includes(searchTerm)) ||
        (fne.type_evt && fne.type_evt.toLowerCase().includes(searchTerm)) ||
        (fne.lieu_EVT && fne.lieu_EVT.toLowerCase().includes(searchTerm)) ||
        userName.includes(searchTerm)
      );
    });
  }

  currentPage = 1;
  totalPages = Math.ceil(filteredData.length / 10);

  renderTable();
  updatePagination();
}

// Fonction pour filtrer par type d'événement
function filterByType(type) {
  if (!type) {
    filteredData = [...fneData];
  } else {
    filteredData = fneData.filter((fne) => {
      return fne.type_evt === type;
    });
  }

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

// Fonction pour afficher les données dans le tableau
function renderTable() {
  const tableBody = document.querySelector("#fne-table tbody");
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
  document.getElementById("pageInfo").textContent = `Page ${currentPage} sur ${totalPages || 1}`;

  document.getElementById("prevPage").disabled = currentPage <= 1;
  document.getElementById("nextPage").disabled = currentPage >= totalPages;
}

// Fonction pour afficher les détails d'une FNE
function viewFneDetails(fneId) {
  currentFneId = fneId;

  // Afficher un indicateur de chargement dans le modal
  document.getElementById("modalFneId").textContent = fneId;
  document.getElementById("fneDetailsModal").style.display = "block";

  // Récupérer les détails de la FNE
  fetch(`/auth/api/fne/${fneId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails de la FNE");
      }
      return response.json();
    })
    .then((fne) => {
      // Remplir les détails dans le modal
      populateModalDetails(fne);
      
      // Activer le premier onglet
      document.querySelector('.tab-btn[data-tab="general"]').click();
    })
    .catch((error) => {
      console.error("Erreur:", error);
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
      `;
    });
}

// Fonction pour remplir les détails dans le modal
function populateModalDetails(fne) {
  // Informations générales
  document.getElementById("detail-type").textContent = formatValue(fne.type_evt);
  document.getElementById("detail-ref").textContent = formatValue(fne.REF_GNE);
  document.getElementById("detail-organisme").textContent = formatValue(fne.Organisme_concerné);
  document.getElementById("detail-date").textContent = formatDate(fne.Date);
  document.getElementById("detail-heure").textContent = formatValue(fne.heure_UTC);
  document.getElementById("detail-lieu").textContent = formatValue(fne.lieu_EVT);
  document.getElementById("detail-detection").textContent = formatValue(fne.moyen_detection);
  document.getElementById("detail-impacts").textContent = formatValue(fne.impacts_operationnels);

  // Ajouter le nom de l'utilisateur
  const userName = getUserFullName(fne.utilisateur);
  if (document.getElementById("detail-utilisateur")) {
    document.getElementById("detail-utilisateur").textContent = userName;
  }

  // Aéronef
  document.getElementById("detail-indicatif").textContent = formatValue(fne.Indicatif_immatricultion);
  document.getElementById("detail-ssr").textContent = formatValue(fne.code_ssr);
  document.getElementById("detail-appareil").textContent = formatValue(fne.type_appareil);
  document.getElementById("detail-regles").textContent = formatValue(fne.regles_vol);
  document.getElementById("detail-depart").textContent = formatValue(fne.terrain_depart);
  document.getElementById("detail-arrivee").textContent = formatValue(fne.terrain_arrivée);
  document.getElementById("detail-cap").textContent = formatValue(fne.cap);
  document.getElementById("detail-alt-reel").textContent = formatValue(fne.altitude_reel);
  document.getElementById("detail-alt-auto").textContent = formatValue(fne.altitude_autorise);
  document.getElementById("detail-vitesse").textContent = formatValue(fne.vitesse);

  // Victimes
  document.getElementById("detail-passagers").textContent = formatValue(fne.passagers, "0");
  document.getElementById("detail-personnel").textContent = formatValue(fne.personnel, "0");
  document.getElementById("detail-equipage").textContent = formatValue(fne.equipage, "0");
  document.getElementById("detail-autre").textContent = formatValue(fne.autre, "0");

  // Météo
  document.getElementById("detail-vent-dir").textContent = formatValue(fne.vent_direction);
  document.getElementById("detail-vent-vitesse").textContent = formatValue(fne.vent_vitesse);
  document.getElementById("detail-visibilite").textContent = fne.visibilite ? `${fne.visibilite} m` : "Non spécifiée";
  document.getElementById("detail-nebulosite").textContent = formatValue(fne.nebulosite);
  document.getElementById("detail-precipitation").textContent = formatValue(fne.precipitation);
  document.getElementById("detail-autres-phenomenes").textContent = formatValue(fne.autres_phenomenes);

  // Équipement
  document.getElementById("detail-implique-installation").textContent = fne.evt_implique_installation_équipement ? "Oui" : "Non";
  document.getElementById("detail-type-installation").textContent = formatValue(fne.type_installation_équipement);
  document.getElementById("detail-compagnie").textContent = formatValue(fne.nom_compagnie_assistance_organisme_exploitant_véhicule);
  document.getElementById("detail-implique-vehicule").textContent = fne.evt_implique_véhicule_materiel_assistance_sol ? "Oui" : "Non";
  document.getElementById("detail-type-materiel").textContent = formatValue(fne.type_materiel_véhicule);

  // Description
  document.getElementById("detail-description").textContent = formatValue(fne.description_evt);
  document.getElementById("detail-redacteur").textContent = formatValue(fne.nom_rédacteur);
}

// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("fneDetailsModal").style.display = "none";
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
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors du refus de la FNE");
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        alert("FNE refusée avec succès !");
        
        // Créer une entrée dans l'historique (si ce n'est pas déjà fait côté serveur)
        createHistoryEntry(fneId, "Refus");
        
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
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la validation de la FNE");
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        alert("FNE validée avec succès !");
        
        // Créer une entrée dans l'historique (si ce n'est pas déjà fait côté serveur)
        createHistoryEntry(fneId, "Validation");
        
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

// Fonction pour créer une entrée dans l'historique
function createHistoryEntry(fneId, action) {
  // Cette fonction est optionnelle si l'historique est déjà créé côté serveur
  console.log(`Création d'une entrée d'historique pour la FNE ${fneId} avec l'action "${action}"`);
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("fneDetailsModal");
  if (event.target === modal) {
    closeModal();
  }
};