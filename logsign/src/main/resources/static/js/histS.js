// Variables globales
let currentPage = 1;
let totalPages = 1;
let historiqueData = [];
let filteredData = [];
let currentHistoriqueId = null;
let currentFneId = null;
let currentUserId = null;
let aircraftsCache = {}; // Cache pour stocker les informations des aéronefs

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Récupérer l'ID de l'utilisateur connecté
  getCurrentUser()
    .then((user) => {
      if (user && user.id) {
        currentUserId = user.id;
        // Charger les données depuis l'API
        loadHistoriqueData();
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
  const tableBody = document.querySelector("#historique-table tbody");
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 30px;">
        <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
        <p>${message}</p>
      </td>
    </tr>
  `;
}

// Fonction pour charger les données d'historique de l'utilisateur connecté
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

  // Faire une requête AJAX pour récupérer l'historique de l'utilisateur connecté
  fetch(`/auth/api/historique/user/${currentUserId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'historique");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données reçues:", data); // Afficher les données pour déboguer
      historiqueData = data;
      filteredData = [...historiqueData];
      totalPages = Math.ceil(filteredData.length / 10);

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
    filteredData = [...historiqueData];
  } else {
    filteredData = historiqueData.filter((historique) => {
      // Vérifier si les propriétés existent avant d'y accéder
      const historiqueId = historique.historique_id || "";
      const fneId = historique.fne ? historique.fne.fne_id : "";
      const statut = historique.fne ? historique.fne.statut || "" : "";
      const dateAction = formatDateTime(historique.dateAction || "").toLowerCase();

      searchTerm = searchTerm.toLowerCase();

      return (
        historiqueId.toString().includes(searchTerm) ||
        fneId.toString().includes(searchTerm) ||
        statut.toLowerCase().includes(searchTerm) ||
        dateAction.includes(searchTerm)
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
  const dateFilter = document.getElementById("dateFilter").value;
  const timeFilter = document.getElementById("timeFilter").value;

  console.log("Filtres appliqués:", {
    action: actionFilter,
    date: dateFilter,
    time: timeFilter,
  });

  // Commencer avec toutes les données
  let tempData = [...historiqueData];

  // Filtrer par action/statut
  if (actionFilter) {
    tempData = tempData.filter((historique) => {
      if (historique.fne && historique.fne.statut) {
        return historique.fne.statut === actionFilter;
      } else {
        return historique.action === actionFilter;
      }
    });
  }

  // Filtrage par date et heure
  if (dateFilter || timeFilter) {
    tempData = tempData.filter((historique) => {
      // Vérifier si dateAction existe
      if (!historique.dateAction) {
        return false;
      }

      const actionDate = new Date(historique.dateAction);

      // Vérifier la date
      if (dateFilter) {
        const filterDate = new Date(dateFilter);

        // Comparer seulement les dates (jour, mois, année)
        if (
          actionDate.getFullYear() !== filterDate.getFullYear() ||
          actionDate.getMonth() !== filterDate.getMonth() ||
          actionDate.getDate() !== filterDate.getDate()
        ) {
          return false;
        }
      }

      // Vérifier l'heure
      if (timeFilter) {
        const [filterHour, filterMinute] = timeFilter.split(":").map(Number);
        const actionHour = actionDate.getHours();
        const actionMinute = actionDate.getMinutes();

        // Comparer l'heure exacte
        if (actionHour !== filterHour || actionMinute !== filterMinute) {
          return false;
        }
      }

      return true;
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

    // Déterminer la classe du badge en fonction du statut de la FNE
    let statusClass = "";
    let statusText = "";

    if (historique.fne && historique.fne.statut) {
      statusText = historique.fne.statut;
      switch (historique.fne.statut) {
        case "En attente":
          statusClass = "status-pending";
          break;
        case "Validé":
          statusClass = "action-validation";
          break;
        case "Refusé":
          statusClass = "action-refus";
          break;
        default:
          statusClass = "action-modification";
      }
    } else {
      // Si pas de statut FNE, utiliser l'action de l'historique
      statusText = historique.action || "";
      switch (historique.action) {
        case "Création":
          statusClass = "action-creation";
          break;
        case "Modification":
          statusClass = "action-modification";
          break;
        case "Validation":
          statusClass = "action-validation";
          break;
        case "Refus":
          statusClass = "action-refus";
          break;
      }
    }

    // Extraire les IDs et les valeurs avec sécurité
    const fneId = historique.fne ? historique.fne.fne_id : "";
    const historiqueId = historique.historique_id || "";

    // Formater la date et l'heure séparément
    let dateAction = "";
    let heureAction = "";

    if (historique.dateAction) {
      try {
        const date = new Date(historique.dateAction);

        // Format de date: JJ/MM/AAAA
        dateAction = date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // Format d'heure: HH:MM
        heureAction = date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        console.error("Erreur lors du formatage de la date:", error);
      }
    }

    // Déterminer le type d'événement
    let typeEvenement = "";
    if (historique.fne && historique.fne.type_evt) {
      switch (historique.fne.type_evt) {
        case "accident":
          typeEvenement = "Accident";
          break;
        case "incident_grave":
          typeEvenement = "Incident grave";
          break;
        case "incident":
          typeEvenement = "Incident";
          break;
        case "evt_technique":
          typeEvenement = "Événement technique";
          break;
        default:
          typeEvenement = historique.fne.type_evt;
      }
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${fneId}</td>
      <td><span class="action-badge ${statusClass}">${statusText}</span></td>
      <td>${heureAction}</td>
      <td>${dateAction}</td>
      <td>${typeEvenement}</td>
      <td>
        <button class="btn btn-view" onclick="viewHistoriqueDetails(${historiqueId})">
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

// Fonction pour formater la date
function formatDate(dateString) {
  if (!dateString) return "";

  try {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return "";
  }
}

// Fonction pour afficher les détails d'une entrée d'historique
function viewHistoriqueDetails(historiqueId) {
  if (!historiqueId) {
    console.error("L'ID de l'historique est indéfini.");
    return;
  }

  currentHistoriqueId = historiqueId;

  // Afficher un indicateur de chargement dans le modal
  document.getElementById("modalHistoriqueId").textContent = historiqueId;
  document.getElementById("historiqueDetailsModal").style.display = "block";

  // Récupérer les détails de l'historique
  fetch(`/auth/api/historique/${historiqueId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    })
    .then((historique) => {
      // Ajouter des logs détaillés pour déboguer
      console.log("Détails historique complet:", JSON.stringify(historique, null, 2));
      console.log("Structure de l'objet historique:", Object.keys(historique));

      if (historique.fne) {
        console.log("Structure de l'objet FNE:", Object.keys(historique.fne));
      } else {
        console.error("L'objet FNE est null ou undefined");
      }

      // Extraire les valeurs avec sécurité
      const historiqueId = historique.historique_id || "";

      // Vérifier si fne existe et extraire son ID
      if (historique.fne && historique.fne.fne_id) {
        currentFneId = historique.fne.fne_id;
      } else {
        currentFneId = null;
      }

      // Informations de base
      document.getElementById("detail-historique-id").textContent = historiqueId;
      document.getElementById("detail-fne-id").textContent = currentFneId || "N/A";
      document.getElementById("detail-date").textContent = formatDateTime(historique.dateAction || "");

      // Formater l'utilisateur
      let utilisateur = "";
      if (historique.utilisateur) {
        utilisateur = `${historique.utilisateur.nom || ""} ${historique.utilisateur.prenom || ""}`.trim();
      }
      document.getElementById("detail-utilisateur").textContent = utilisateur || "N/A";

      // Action avec badge
      const detailAction = document.getElementById("detail-action");
      detailAction.textContent = historique.action || "";
      detailAction.className = "action-badge"; // Réinitialiser les classes

      // Ajouter la classe appropriée pour l'action
      switch (historique.action) {
        case "Création":
          detailAction.classList.add("action-creation");
          break;
        case "Modification":
          detailAction.classList.add("action-modification");
          break;
        case "Validation":
          detailAction.classList.add("action-validation");
          break;
        case "Refus":
          detailAction.classList.add("action-refus");
          break;
      }

      // Récupérer les détails de la FNE associée
      if (currentFneId) {
        fetch(`/auth/api/fne/${currentFneId}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Erreur lors de la récupération des détails de la FNE");
            }
            return response.json();
          })
          .then((fne) => {
            console.log("Détails FNE:", fne); // Afficher les détails pour déboguer

            // Adapter en fonction de la structure réelle de vos données
            let fneType = "";
            switch (fne.type_evt) {
              case "accident":
                fneType = "Accident";
                break;
              case "incident":
                fneType = "Incident";
                break;
              case "incident_grave":
                fneType = "Incident grave";
                break;
              case "evt_technique":
                fneType = "Événement technique";
                break;
              default:
                fneType = fne.type_evt || "";
            }

            // Informations sur la FNE
            document.getElementById("detail-fne-type").textContent = fneType;
            document.getElementById("detail-fne-ref").textContent = fne.ref_gne || "";
            document.getElementById("detail-fne-date").textContent = formatDate(fne.date);
            document.getElementById("detail-fne-lieu").textContent = fne.lieu_EVT || "";

            // Statut avec badge
            const detailStatut = document.getElementById("detail-fne-statut");
            detailStatut.textContent = fne.statut || "En attente";
            detailStatut.className = "status-badge"; // Réinitialiser les classes

            // Ajouter la classe appropriée
            switch (fne.statut) {
              case "En attente":
                detailStatut.classList.add("status-pending");
                break;
              case "Validé":
                detailStatut.classList.add("status-approved");
                break;
              case "Refusé":
                detailStatut.classList.add("status-rejected");
                break;
              case "En cours de traitement":
                detailStatut.classList.add("status-processing");
                break;
            }

            // Mettre à jour les boutons du modal en fonction du statut
            const modalFooter = document.querySelector(".modal-footer");
            let footerButtons = `
              <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
              <button class="btn btn-primary" onclick="voirFNE(${currentFneId})">Voir la FNE</button>
            `;

            // Ajouter le bouton Modifier uniquement si le statut est "En attente"
            if (fne.statut === "En attente") {
              footerButtons += `
                <button class="btn btn-warning" onclick="modifierFNE(${currentFneId})">
                  <i class="fas fa-edit"></i> Modifier
                </button>
              `;
            }

            modalFooter.innerHTML = footerButtons;
          })
          .catch((error) => {
            console.error("Erreur lors de la récupération des détails de la FNE:", error);
            // Afficher un message d'erreur pour les détails de la FNE
            document.getElementById("detail-fne-type").textContent = "Erreur de chargement";
            document.getElementById("detail-fne-ref").textContent = "Erreur de chargement";
            document.getElementById("detail-fne-date").textContent = "Erreur de chargement";
            document.getElementById("detail-fne-lieu").textContent = "Erreur de chargement";
            document.getElementById("detail-fne-statut").textContent = "Erreur de chargement";
          });
      } else {
        // Si aucune FNE n'est associée
        document.getElementById("detail-fne-type").textContent = "Non disponible";
        document.getElementById("detail-fne-ref").textContent = "Non disponible";
        document.getElementById("detail-fne-date").textContent = "Non disponible";
        document.getElementById("detail-fne-lieu").textContent = "Non disponible";
        document.getElementById("detail-fne-statut").textContent = "Non disponible";
      }

      // Afficher les modifications (si disponibles)
      const changesContainer = document.getElementById("detail-changes");
      changesContainer.innerHTML = "";

      if (!historique.modifications || historique.modifications.length === 0) {
        changesContainer.innerHTML = "<p>Aucune modification détaillée disponible.</p>";
      } else {
        const changesList = document.createElement("ul");
        changesList.className = "changes-list";

        historique.modifications.forEach((modification) => {
          const changeItem = document.createElement("li");
          changeItem.className = "change-item";

          const fieldName = formatFieldName(modification.champ);
          const oldValue = modification.ancienne_valeur || "Non défini";
          const newValue = modification.nouvelle_valeur || "Non défini";

          changeItem.innerHTML = `
            <div class="change-field">${fieldName}</div>
            <div class="change-values">
              <div class="old-value">
                <span class="label">Avant:</span> 
                <span class="value">${oldValue}</span>
              </div>
              <div class="new-value">
                <span class="label">Après:</span> 
                <span class="value">${newValue}</span>
              </div>
            </div>
          `;

          changesList.appendChild(changeItem);
        });

        changesContainer.appendChild(changesList);
      }
    })
    .catch((error) => {
      console.error("Erreur:", error);
      document.getElementById("historiqueDetailsModal").innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Erreur</h2>
            <button class="close-modal" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <p>Une erreur est survenue lors du chargement des détails de l'historique. Veuillez réessayer.</p>
            <p>Détail de l'erreur: ${error.message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
          </div>
        </div>
      `;
    });
}

// Fonction pour formater le nom des champs
function formatFieldName(fieldName) {
  if (!fieldName) return "";

  const fieldMappings = {
    description_evt: "Description",
    impacts_operationnels: "Impacts opérationnels",
    statut: "Statut",
    lieu_EVT: "Lieu",
    commentaire: "Commentaire",
    type_evt: "Type d'événement",
    REF_GNE: "Référence GNE",
    Date: "Date",
    heure_UTC: "Heure UTC",
    Organisme_concerné: "Organisme concerné",
  };

  return fieldMappings[fieldName] || fieldName;
}

// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("historiqueDetailsModal").style.display = "none";

  // Fermer également le modal PDF s'il est ouvert
  const fnePdfModal = document.getElementById("fnePdfModal");
  if (fnePdfModal) {
    fnePdfModal.style.display = "none";
  }

  currentHistoriqueId = null;
  currentFneId = null;
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
  fetch(`/auth/api/fne/${fneId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails de la FNE");
      }
      return response.json();
    })
    .then((fne) => {
      // Récupérer les aéronefs associés à cette FNE
      fetch(`/auth/api/aircrafts?fne_id=${fneId}`)
        .then(response => {
          if (!response.ok && response.status !== 404) {
            throw new Error("Erreur lors de la récupération des aéronefs");
          }
          return response.status === 404 ? [] : response.json();
        })
        .then(aircrafts => {
          // Stocker les aéronefs dans le cache
          aircraftsCache[fneId] = aircrafts;
          
          // Supprimer l'indicateur de chargement
          document.body.removeChild(loadingOverlay);

          // Fermer le modal des détails de l'historique
          document.getElementById("historiqueDetailsModal").style.display = "none";

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
      alert("Erreur lors du chargement des détails de la FNE. Veuillez réessayer.");
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
  `;

  // Ajouter le bouton Modifier uniquement pour les FNE en attente
  if (fne.statut === "En attente") {
    actionButtons += `
      <button class="btn btn-warning" onclick="modifierFNE(${fne.fne_id})">
        <i class="fas fa-edit"></i> Modifier
      </button>
    `;
  }

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

  // Afficher le modal PDF
  const fnePdfModal = document.getElementById("fnePdfModal");
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
  window.location.href = `/auth/fneSML?id=${fneId}`;
}

// Fonction pour formater les valeurs pour l'affichage
function formatValue(value, defaultValue = "Non spécifié") {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  return value;
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

// Fonction pour réinitialiser les filtres
function resetFilters() {
  // Réinitialiser les valeurs des filtres
  document.getElementById("filterAction").value = "";
  document.getElementById("dateFilter").value = "";
  document.getElementById("timeFilter").value = "";

  // Réinitialiser les données filtrées
  filteredData = [...historiqueData];
  currentPage = 1;
  totalPages = Math.ceil(filteredData.length / 10) || 1;

  // Mettre à jour l'affichage
  renderTable();
  updatePagination();
}

// Ajouter cette fonction pour améliorer l'animation des modals
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  // Ajouter une classe pour l'animation d'entrée
  modal.classList.add('modal-opening');
  modal.style.display = 'block';
  
  // Forcer un reflow pour que l'animation se déclenche
  void modal.offsetWidth;
  
  // Ajouter la classe pour l'animation complète
  modal.classList.add('modal-open');
}

// Améliorer l'affichage des changements dans les détails
function renderChanges(modifications) {
  const changesContainer = document.getElementById("detail-changes");
  changesContainer.innerHTML = "";

  if (!modifications || modifications.length === 0) {
    changesContainer.innerHTML = "<p class='no-changes'>Aucune modification détaillée disponible.</p>";
    return;
  }

  const changesList = document.createElement("ul");
  changesList.className = "changes-list";

  modifications.forEach((modification) => {
    const changeItem = document.createElement("li");
    changeItem.className = "change-item";

    const fieldName = formatFieldName(modification.champ);
    const oldValue = modification.ancienne_valeur || "Non défini";
    const newValue = modification.nouvelle_valeur || "Non défini";

    // Mettre en évidence les différences
    const isDifferent = oldValue !== newValue;
    
    changeItem.innerHTML = `
      <div class="change-field">${fieldName}</div>
      <div class="change-values">
        <div class="old-value">
          <span class="label">Avant:</span> 
          <span class="value ${isDifferent ? 'changed' : ''}">${oldValue}</span>
        </div>
        <div class="new-value">
          <span class="label">Après:</span> 
          <span class="value ${isDifferent ? 'changed' : ''}">${newValue}</span>
        </div>
      </div>
    `;

    changesList.appendChild(changeItem);
  });

  changesContainer.appendChild(changesList);
}