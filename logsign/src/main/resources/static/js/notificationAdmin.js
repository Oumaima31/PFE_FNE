// Variables globales
let currentPage = 1;
let totalPages = 1;
let notificationsData = [];
let filteredData = [];
let currentNotificationId = null;
let currentFneId = null;
let currentUserId = null;

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Récupérer l'ID de l'utilisateur connecté
  getCurrentUser()
    .then((user) => {
      if (user && user.id) {
        currentUserId = user.id;
        // Charger les données depuis l'API
        loadNotificationsData();
      } else {
        console.error("Utilisateur non connecté ou ID non disponible");
        showError("Vous devez être connecté pour accéder à cette page.");
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      showError("Erreur lors de la récupération des informations utilisateur.");
    });

  // Configurer les écouteurs d'événements
  setupEventListeners();
});

// Fonction pour récupérer l'utilisateur connecté
async function getCurrentUser() {
  try {
    const response = await fetch("/auth/api/current-user");
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération de l'utilisateur connecté");
    }
    return await response.json();
  } catch (error) {
    console.error("Erreur:", error);
    return null;
  }
}

// Fonction pour afficher une erreur
function showError(message) {
  const tableBody = document.querySelector("#notifications-table tbody");
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 30px;">
        <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
        <p>${message}</p>
      </td>
    </tr>
  `;
}

// Fonction pour charger les notifications de l'utilisateur connecté
function loadNotificationsData() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#notifications-table tbody");
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 30px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
        <p>Chargement des notifications...</p>
      </td>
    </tr>
  `;

  // Faire une requête AJAX pour récupérer les notifications de l'utilisateur connecté
  fetch(`/auth/api/notifications`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des notifications");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données reçues:", data); // Afficher les données pour déboguer
      notificationsData = data;
      filteredData = [...notificationsData];
      totalPages = Math.ceil(filteredData.length / 10);

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
            <p>Erreur lors du chargement des notifications. Veuillez réessayer.</p>
            <button onclick="loadNotificationsData()" class="btn btn-primary">Réessayer</button>
          </td>
        </tr>
      `;
    });
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

// Fonction pour filtrer les données
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...notificationsData];
  } else {
    filteredData = notificationsData.filter((notification) => {
      // Vérifier si les propriétés existent avant d'y accéder
      const notificationId = notification.notification_id || "";
      const contenu = notification.contenu || "";
      const fneId = notification.fne ? notification.fne.fne_id : "";
      const dateEnvoi = formatDateTime(notification.date_envoi || "").toLowerCase();
      const moyen = notification.moyen || "";
      const urgence = notification.urgence || "";

      searchTerm = searchTerm.toLowerCase();

      return (
        notificationId.toString().includes(searchTerm) ||
        contenu.toLowerCase().includes(searchTerm) ||
        fneId.toString().includes(searchTerm) ||
        dateEnvoi.includes(searchTerm) ||
        moyen.toLowerCase().includes(searchTerm) ||
        urgence.toLowerCase().includes(searchTerm)
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
  const urgenceFilter = document.getElementById("filterUrgence").value;
  const moyenFilter = document.getElementById("filterMoyen").value;
  const dateFilter = document.getElementById("dateFilter").value;

  console.log("Filtres appliqués:", {
    urgence: urgenceFilter,
    moyen: moyenFilter,
    date: dateFilter,
  });

  // Commencer avec toutes les données
  let tempData = [...notificationsData];

  // Filtrer par urgence
  if (urgenceFilter) {
    tempData = tempData.filter((notification) => {
      return notification.urgence === urgenceFilter;
    });
  }

  // Filtrer par moyen
  if (moyenFilter) {
    tempData = tempData.filter((notification) => {
      return notification.moyen === moyenFilter;
    });
  }

  // Filtrage par date
  if (dateFilter) {
    tempData = tempData.filter((notification) => {
      // Vérifier si date_envoi existe
      if (!notification.date_envoi) {
        return false;
      }

      const notifDate = new Date(notification.date_envoi);
      const filterDate = new Date(dateFilter);

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

    // Déterminer la classe du badge en fonction de l'urgence
    let urgenceClass = "";
    switch (notification.urgence) {
      case "haute":
        urgenceClass = "urgence-haute";
        break;
      case "moyenne":
        urgenceClass = "urgence-moyenne";
        break;
      case "basse":
        urgenceClass = "urgence-basse";
        break;
    }

    // Extraire les IDs et les valeurs avec sécurité
    const notificationId = notification.notification_id || "";
    const fneId = notification.fne ? notification.fne.fne_id : "";
    const utilisateurId = notification.utilisateur ? notification.utilisateur.id : "";

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
      <td><span class="urgence-badge ${urgenceClass}">${notification.urgence || ""}</span></td>
      <td>${fneId}</td>
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
  document.getElementById("pageInfo").textContent = `Page ${currentPage} sur ${totalPages || 1}`;

  document.getElementById("prevPage").disabled = currentPage <= 1;
  document.getElementById("nextPage").disabled = currentPage >= totalPages;
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
// Fonction améliorée pour afficher les détails d'une notification
function viewNotificationDetails(notificationId) {
  if (!notificationId) {
      console.error("ID de notification invalide");
      showAlert("Erreur", "ID de notification invalide", "error");
      return;
  }

  // Mettre à jour les variables globales
  currentNotificationId = notificationId;
  
  // Afficher le modal avec un indicateur de chargement
  const modal = document.getElementById("notificationDetailsModal");
  modal.style.display = "block";
  document.getElementById("modalNotificationId").textContent = `#${notificationId}`;
  
  // Afficher un loader pendant le chargement
  const modalBody = document.querySelector(".modal-body");
  const originalContent = modalBody.innerHTML;
  modalBody.innerHTML = `
      <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Chargement des détails...</p>
      </div>
  `;

  // Récupérer les détails de la notification
  fetch(`/auth/api/notifications/${notificationId}`)
      .then(response => {
          if (!response.ok) {
              throw new Error(`Erreur HTTP: ${response.status}`);
          }
          return response.json();
      })
      .then(notification => {
          // Formater la date
          const formattedDate = formatDateTime(notification.date_envoi) || "Date non disponible";
          
          // Déterminer les classes CSS pour les badges
          const moyenClass = getMoyenClass(notification.moyen);
          const urgenceClass = getUrgenceClass(notification.urgence);
          
          // Construire le contenu du modal
          modalBody.innerHTML = `
              <div class="detail-grid">
                  <div class="detail-item">
                      <label>ID de la notification:</label>
                      <span>${notification.notification_id || "N/A"}</span>
                  </div>
                  <div class="detail-item">
                      <label>Date d'envoi:</label>
                      <span>${formattedDate}</span>
                  </div>
                  <div class="detail-item">
                      <label>Moyen:</label>
                      <span class="moyen-badge ${moyenClass}">${notification.moyen || "N/A"}</span>
                  </div>
                  <div class="detail-item">
                      <label>Urgence:</label>
                      <span class="urgence-badge ${urgenceClass}">${notification.urgence || "N/A"}</span>
                  </div>
                  <div class="detail-item">
                      <label>FNE ID:</label>
                      <span>${notification.fne?.fne_id || "N/A"}</span>
                  </div>
              </div>
              
              <div class="detail-section">
                  <h3>Contenu complet</h3>
                  <div class="notification-content">
                      ${notification.contenu || "Aucun contenu disponible"}
                  </div>
              </div>
          `;
          
          // Masquer le bouton "Voir la FNE" s'il existe
          const viewFneBtn = document.getElementById("viewFneBtn");
          if (viewFneBtn) {
              viewFneBtn.style.display = "none";
          }
      })
      .catch(error => {
          console.error("Erreur:", error);
          modalBody.innerHTML = `
              <div class="error-message">
                  <i class="fas fa-exclamation-triangle"></i>
                  <p>Une erreur est survenue lors du chargement des détails.</p>
                  <p>${error.message}</p>
                  <button class="btn btn-retry" onclick="viewNotificationDetails(${notificationId})">
                      <i class="fas fa-sync-alt"></i> Réessayer
                  </button>
              </div>
          `;
      });
}

// Fonctions utilitaires pour les classes CSS
function getMoyenClass(moyen) {
  switch (moyen) {
      case "email": return "moyen-email";
      case "sms": return "moyen-sms";
      default: return "moyen-systeme";
  }
}

function getUrgenceClass(urgence) {
  switch (urgence) {
      case "haute": return "urgence-haute";
      case "moyenne": return "urgence-moyenne";
      case "basse": return "urgence-basse";
      default: return "";
  }
}

// Fonction pour fermer le modal (inchangée)
function closeModal() {
  document.getElementById("notificationDetailsModal").style.display = "none";
  currentNotificationId = null;
  currentFneId = null;
}
// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("notificationDetailsModal").style.display = "none";
  currentNotificationId = null;
  currentFneId = null;
}



// Fonction pour réinitialiser les filtres
function resetFilters() {
  // Réinitialiser les valeurs des filtres
  document.getElementById("filterUrgence").value = "";
  document.getElementById("filterMoyen").value = "";
  document.getElementById("dateFilter").value = "";
  document.getElementById("searchInput").value = "";

  // Réinitialiser les données filtrées
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