// Variables globales
let currentPage = 1;
let totalPages = 1;
let notificationsData = [];
let filteredData = [];
let currentNotificationId = null;
let currentFneId = null;

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Charger les données depuis l'API directement
  loadNotificationsData();

  // Configurer les écouteurs d'événements
  setupEventListeners();
});

// Fonction pour charger les notifications de l'utilisateur connecté
function loadNotificationsData() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#notifications-table tbody");
  if (!tableBody) {
    console.error("Élément #notifications-table tbody non trouvé");
    return;
  }

  tableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 30px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
        <p>Chargement des notifications...</p>
      </td>
    </tr>
  `;

  // Faire une requête AJAX pour récupérer les notifications de l'utilisateur connecté
  fetch("/auth/api/notifications", {
    method: "GET",
    credentials: "include", // Important pour envoyer les cookies d'authentification
    headers: {
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données reçues:", data); // Afficher les données pour déboguer
      
      // Vérifier si data est un tableau
      if (Array.isArray(data)) {
        notificationsData = data;
      } else if (data && typeof data === 'object') {
        // Si data est un objet, essayer de trouver un tableau à l'intérieur
        for (const key in data) {
          if (Array.isArray(data[key])) {
            notificationsData = data[key];
            break;
          }
        }
        // Si aucun tableau n'est trouvé, considérer data comme un élément unique
        if (!Array.isArray(notificationsData)) {
          notificationsData = [data];
        }
      } else {
        notificationsData = [];
      }
      
      // Trier les notifications par date d'envoi (de la plus récente à la plus ancienne)
      notificationsData.sort((a, b) => {
        const dateA = a.date_envoi ? new Date(a.date_envoi).getTime() : 0;
        const dateB = b.date_envoi ? new Date(b.date_envoi).getTime() : 0;
        return dateB - dateA; // Ordre décroissant
      });
      
      filteredData = [...notificationsData];
      totalPages = Math.ceil(filteredData.length / 10) || 1;

      // Afficher les données
      renderTable();
      updatePagination();
    })
    .catch((error) => {
      console.error("Erreur:", error);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 30px;">
              <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
              <p>Erreur lors du chargement des notifications: ${error.message}</p>
              <button onclick="loadNotificationsData()" class="btn btn-primary">Réessayer</button>
            </td>
          </tr>
        `;
      }
    });
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

// Fonction pour déterminer le niveau d'urgence en fonction du type d'événement
function getUrgenceByEventType(typeEvt) {
  if (!typeEvt) return "moyenne";
  
  const typeEvtLower = typeEvt.toLowerCase();
  
  if (typeEvtLower.includes("accident")) {
    return "haute";
  } else if (typeEvtLower.includes("incident_grave") || typeEvtLower.includes("incident grave")) {
    return "moyenne";
  } else if (typeEvtLower.includes("incident")) {
    return "basse";
  } else if (typeEvtLower.includes("evt_technique") || typeEvtLower.includes("evt technique")) {
    return "technique";
  }
  
  return "moyenne";
}

// Fonction pour déterminer la classe d'urgence en fonction du type d'événement
function getUrgenceClassByEventType(typeEvt) {
  if (!typeEvt) return "urgence-moyenne";
  
  const typeEvtLower = typeEvt.toLowerCase();
  
  if (typeEvtLower.includes("accident")) {
    return "urgence-haute"; // Rouge
  } else if (typeEvtLower.includes("incident_grave") || typeEvtLower.includes("incident grave")) {
    return "urgence-moyenne"; // Orange
  } else if (typeEvtLower.includes("incident")) {
    return "urgence-basse"; // Vert
  } else if (typeEvtLower.includes("evt_technique") || typeEvtLower.includes("evt technique")) {
    return "urgence-technique"; // Gris
  }
  
  return "urgence-moyenne"; // Par défaut
}

// Fonction pour filtrer les données
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...notificationsData];
  } else {
    filteredData = notificationsData.filter((notification) => {
      // Vérifier si les propriétés existent avant d'y accéder
      const notificationId = notification.notification_id ? notification.notification_id.toString() : "";
      const contenu = notification.contenu || "";
      const fneId = notification.fne && notification.fne.fne_id ? notification.fne.fne_id.toString() : "";
      const dateEnvoi = formatDateTime(notification.date_envoi || "").toLowerCase();
      const moyen = notification.moyen || "";
      const urgence = notification.urgence || "";
      const typeEvt = notification.fne && notification.fne.type_evt ? notification.fne.type_evt.toLowerCase() : "";

      searchTerm = searchTerm.toLowerCase();

      return (
        notificationId.includes(searchTerm) ||
        contenu.toLowerCase().includes(searchTerm) ||
        fneId.includes(searchTerm) ||
        dateEnvoi.includes(searchTerm) ||
        moyen.toLowerCase().includes(searchTerm) ||
        urgence.toLowerCase().includes(searchTerm) ||
        typeEvt.includes(searchTerm)
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
  const urgenceFilter = document.getElementById("filterUrgence");
  const moyenFilter = document.getElementById("filterMoyen");
  const dateFilter = document.getElementById("dateFilter");
  
  const urgenceValue = urgenceFilter ? urgenceFilter.value : "";
  const moyenValue = moyenFilter ? moyenFilter.value : "";
  const dateValue = dateFilter ? dateFilter.value : "";

  console.log("Filtres appliqués:", {
    urgence: urgenceValue,
    moyen: moyenValue,
    date: dateValue,
  });

  // Commencer avec toutes les données
  let tempData = [...notificationsData];

  // Filtrer par urgence
  if (urgenceValue) {
    tempData = tempData.filter((notification) => {
      // Si la notification a une FNE avec un type d'événement, déterminer l'urgence en fonction du type
      if (notification.fne && notification.fne.type_evt) {
        const urgenceByType = getUrgenceByEventType(notification.fne.type_evt);
        return urgenceByType === urgenceValue;
      }
      // Sinon, utiliser l'urgence de la notification
      return notification.urgence === urgenceValue;
    });
  }

  // Filtrer par moyen
  if (moyenValue) {
    tempData = tempData.filter((notification) => {
      return notification.moyen === moyenValue;
    });
  }

  // Filtrage par date
  if (dateValue) {
    tempData = tempData.filter((notification) => {
      // Vérifier si date_envoi existe
      if (!notification.date_envoi) {
        return false;
      }

      const notifDate = new Date(notification.date_envoi);
      const filterDate = new Date(dateValue);

      // Comparer seulement les dates (jour, mois, année)
      return (
        notifDate.getFullYear() === filterDate.getFullYear() &&
        notifDate.getMonth() === filterDate.getMonth() &&
        notifDate.getDate() === filterDate.getDate()
      );
    });
  }

  console.log("Nombre d'éléments après filtrage:", tempData.length);
  filteredData = tempData;
  currentPage = 1;
  totalPages = Math.ceil(filteredData.length / 10) || 1;

  renderTable();
  updatePagination();
}

// Fonction pour afficher les données dans le tableau
function renderTable() {
  const tableBody = document.querySelector("#notifications-table tbody");
  if (!tableBody) {
    console.error("Élément #notifications-table tbody non trouvé");
    return;
  }
  
  tableBody.innerHTML = "";

  const startIndex = (currentPage - 1) * 10;
  const endIndex = Math.min(startIndex + 10, filteredData.length);

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px;">
          <i class="fas fa-bell-slash" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
          <p>Aucune notification trouvée. Veuillez modifier vos critères de recherche.</p>
        </td>
      </tr>
    `;
    return;
  }

  for (let i = startIndex; i < endIndex; i++) {
    const notification = filteredData[i];

    // Déterminer la classe du badge en fonction du moyen
    let moyenClass = "";
    switch (notification.moyen) {
      case "email":
        moyenClass = "moyen-email";
        break;
      case "sms":
        moyenClass = "moyen-sms";
        break;
      default:
        moyenClass = "moyen-système";
    }

    // Extraire le type d'événement de la FNE
    const typeEvt = notification.fne ? notification.fne.type_evt : "";
    
    // Déterminer l'urgence et la classe d'urgence en fonction du type d'événement
    let urgenceText = notification.urgence; // Valeur par défaut
    let urgenceClass = "urgence-moyenne"; // Valeur par défaut
    
    if (typeEvt) {
      // Remplacer l'urgence par celle déterminée par le type d'événement
      urgenceText = getUrgenceByEventType(typeEvt);
      urgenceClass = getUrgenceClassByEventType(typeEvt);
    }

    // Extraire les IDs et les valeurs avec sécurité
    const notificationId = notification.notification_id || "";
    const fneId = notification.fne && notification.fne.fne_id ? notification.fne.fne_id : "";
    
    // Formater la date d'envoi
    const dateEnvoi = formatDateTime(notification.date_envoi || "");

    // Tronquer le contenu s'il est trop long
    const contenu = notification.contenu || "";
    const truncatedContenu = contenu.length > 50 ? contenu.substring(0, 50) + "..." : contenu;

    const row = document.createElement("tr");
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

// Fonction pour formater la date et l'heure
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "";

  try {
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateTimeString).toLocaleDateString("fr-FR", options);
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return "";
  }
}

// Fonction pour afficher les détails d'une notification
function viewNotificationDetails(notificationId) {
  if (!notificationId) {
    console.error("L'ID de la notification est indéfini.");
    return;
  }

  currentNotificationId = notificationId;

  // Afficher un indicateur de chargement dans le modal
  const modalNotificationId = document.getElementById("modalNotificationId");
  if (modalNotificationId) {
    modalNotificationId.textContent = notificationId;
  }
  
  const notificationDetailsModal = document.getElementById("notificationDetailsModal");
  if (notificationDetailsModal) {
    notificationDetailsModal.style.display = "block";
  }

  // Récupérer les détails de la notification
  fetch(`/auth/api/notifications/${notificationId}`, {
    credentials: "include" // Important pour envoyer les cookies d'authentification
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    })
    .then((notification) => {
      // Ajouter des logs détaillés pour déboguer
      console.log("Détails notification:", notification);

      // Extraire les valeurs avec sécurité
      const notificationId = notification.notification_id || "";
      const dateEnvoi = formatDateTime(notification.date_envoi || "");
      const moyen = notification.moyen || "";
      const utilisateurId = notification.utilisateur && notification.utilisateur.id ? notification.utilisateur.id : "";
      const contenu = notification.contenu || "";

      // Extraire le type d'événement de la FNE
      const typeEvt = notification.fne ? notification.fne.type_evt : "";
      
      // Déterminer l'urgence et la classe d'urgence en fonction du type d'événement
      let urgenceText = notification.urgence; // Valeur par défaut
      let urgenceClass = "urgence-moyenne"; // Valeur par défaut
      
      if (typeEvt) {
        // Remplacer l'urgence par celle déterminée par le type d'événement
        urgenceText = getUrgenceByEventType(typeEvt);
        urgenceClass = getUrgenceClassByEventType(typeEvt);
      }

      // Vérifier si fne existe et extraire son ID
      if (notification.fne && notification.fne.fne_id) {
        currentFneId = notification.fne.fne_id;
        const viewFneBtn = document.getElementById("viewFneBtn");
        if (viewFneBtn) {
          viewFneBtn.style.display = "inline-flex";
        }
      } else {
        currentFneId = null;
        const viewFneBtn = document.getElementById("viewFneBtn");
        if (viewFneBtn) {
          viewFneBtn.style.display = "none";
        }
      }

      // Informations de base
      const detailNotificationId = document.getElementById("detail-notification-id");
      if (detailNotificationId) {
        detailNotificationId.textContent = notificationId;
      }
      
      const detailDateEnvoi = document.getElementById("detail-date-envoi");
      if (detailDateEnvoi) {
        detailDateEnvoi.textContent = dateEnvoi;
      }
      
      const detailUtilisateurId = document.getElementById("detail-utilisateur-id");
      if (detailUtilisateurId) {
        detailUtilisateurId.textContent = utilisateurId;
      }
      
      const detailFneId = document.getElementById("detail-fne-id");
      if (detailFneId) {
        detailFneId.textContent = currentFneId || "N/A";
      }
      
      const detailTypeEvt = document.getElementById("detail-type-evt");
      if (detailTypeEvt) {
        detailTypeEvt.textContent = typeEvt || "N/A";
      }
      
      const detailContenu = document.getElementById("detail-contenu");
      if (detailContenu) {
        detailContenu.textContent = contenu;
      }

      // Moyen avec badge
      const detailMoyen = document.getElementById("detail-moyen");
      if (detailMoyen) {
        detailMoyen.textContent = moyen;
        detailMoyen.className = "moyen-badge"; // Réinitialiser les classes

        // Ajouter la classe appropriée pour le moyen
        switch (moyen) {
          case "email":
            detailMoyen.classList.add("moyen-email");
            break;
          case "sms":
            detailMoyen.classList.add("moyen-sms");
            break;
          default:
            detailMoyen.classList.add("moyen-système");
        }
      }

      // Urgence avec badge
      const detailUrgence = document.getElementById("detail-urgence");
      if (detailUrgence) {
        detailUrgence.textContent = urgenceText;
        detailUrgence.className = "urgence-badge"; // Réinitialiser les classes
        detailUrgence.classList.add(urgenceClass);
      }
    })
    .catch((error) => {
      console.error("Erreur:", error);
      const notificationDetailsModal = document.getElementById("notificationDetailsModal");
      if (notificationDetailsModal) {
        notificationDetailsModal.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <h2>Erreur</h2>
              <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p>Une erreur est survenue lors du chargement des détails de la notification. Veuillez réessayer.</p>
              <p>Détail de l'erreur: ${error.message}</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
            </div>
          </div>
        `;
      }
    });
}

// Fonction pour fermer le modal
function closeModal() {
  const notificationDetailsModal = document.getElementById("notificationDetailsModal");
  if (notificationDetailsModal) {
    notificationDetailsModal.style.display = "none";
  }
  currentNotificationId = null;
  currentFneId = null;
}

// Fonction pour voir la FNE associée
function voirFNE(fneId) {
  if (!fneId) {
    console.error("L'ID de la FNE est indéfini.");
    return;
  }

  // Rediriger vers la page de détails de la FNE
  window.location.href = `/auth/fneSML?id=${fneId}`;
}

// Fonction pour réinitialiser les filtres
function resetFilters() {
  // Réinitialiser les valeurs des filtres
  const filterUrgence = document.getElementById("filterUrgence");
  if (filterUrgence) {
    filterUrgence.value = "";
  }
  
  const filterMoyen = document.getElementById("filterMoyen");
  if (filterMoyen) {
    filterMoyen.value = "";
  }
  
  const dateFilter = document.getElementById("dateFilter");
  if (dateFilter) {
    dateFilter.value = "";
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.value = "";
  }

  // Réinitialiser les données filtrées (les données sont déjà triées)
  filteredData = [...notificationsData];
  currentPage = 1;
  totalPages = Math.ceil(filteredData.length / 10) || 1;

  // Mettre à jour l'affichage
  renderTable();
  updatePagination();
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = (event) => {
  const modal = document.getElementById("notificationDetailsModal");
  if (event.target === modal) {
    closeModal();
  }
};

// Ajouter un écouteur d'événements pour la touche Échap
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});