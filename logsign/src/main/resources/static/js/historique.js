// Variables globales
let currentPage = 1;
let totalPages = 1;
let historiqueData = [];
let filteredData = [];
let currentHistoriqueId = null;
let currentFneId = null;

// Données d'exemple pour la démonstration
const sampleHistoriqueData = [
    {
        id: 1001,
        fneId: 12345,
        action: "Création",
        dateAction: "2023-10-01T10:30:00",
        utilisateurId: 789,
        utilisateurNom: "Jean Dupont",
        fneDetails: {
            type: "Incident",
            refGne: "REF123",
            date: "2023-10-01",
            lieu: "Paris",
            statut: "En attente"
        },
        modifications: []
    },
    {
        id: 1002,
        fneId: 12345,
        action: "Modification",
        dateAction: "2023-10-02T14:15:00",
        utilisateurId: 789,
        utilisateurNom: "Jean Dupont",
        fneDetails: {
            type: "Incident",
            refGne: "REF123",
            date: "2023-10-01",
            lieu: "Paris",
            statut: "En attente"
        },
        modifications: [
            { champ: "description", ancienneValeur: "Description initiale", nouvelleValeur: "Description mise à jour avec plus de détails" },
            { champ: "impacts", ancienneValeur: "Aucun", nouvelleValeur: "Retard" }
        ]
    },
    {
        id: 1003,
        fneId: 12345,
        action: "Validation",
        dateAction: "2023-10-03T09:45:00",
        utilisateurId: 456,
        utilisateurNom: "Marie Martin",
        fneDetails: {
            type: "Incident",
            refGne: "REF123",
            date: "2023-10-01",
            lieu: "Paris",
            statut: "Validé"
        },
        modifications: [
            { champ: "statut", ancienneValeur: "En attente", nouvelleValeur: "Validé" }
        ]
    },
    {
        id: 1004,
        fneId: 12346,
        action: "Création",
        dateAction: "2023-10-02T11:20:00",
        utilisateurId: 790,
        utilisateurNom: "Pierre Dubois",
        fneDetails: {
            type: "Accident",
            refGne: "REF124",
            date: "2023-10-02",
            lieu: "Lyon",
            statut: "En attente"
        },
        modifications: []
    },
    {
        id: 1005,
        fneId: 12346,
        action: "Refus",
        dateAction: "2023-10-04T16:30:00",
        utilisateurId: 456,
        utilisateurNom: "Marie Martin",
        fneDetails: {
            type: "Accident",
            refGne: "REF124",
            date: "2023-10-02",
            lieu: "Lyon",
            statut: "Refusé"
        },
        modifications: [
            { champ: "statut", ancienneValeur: "En attente", nouvelleValeur: "Refusé" },
            { champ: "commentaire", ancienneValeur: "", nouvelleValeur: "Informations insuffisantes pour valider cette FNE" }
        ]
    },
    {
        id: 1006,
        fneId: 12347,
        action: "Création",
        dateAction: "2023-10-03T08:45:00",
        utilisateurId: 791,
        utilisateurNom: "Sophie Leroy",
        fneDetails: {
            type: "Incident grave",
            refGne: "REF125",
            date: "2023-10-03",
            lieu: "Marseille",
            statut: "En attente"
        },
        modifications: []
    },
    {
        id: 1007,
        fneId: 12347,
        action: "Modification",
        dateAction: "2023-10-03T10:15:00",
        utilisateurId: 791,
        utilisateurNom: "Sophie Leroy",
        fneDetails: {
            type: "Incident grave",
            refGne: "REF125",
            date: "2023-10-03",
            lieu: "Marseille",
            statut: "En attente"
        },
        modifications: [
            { champ: "lieu", ancienneValeur: "Toulon", nouvelleValeur: "Marseille" },
            { champ: "impacts", ancienneValeur: "Mineur", nouvelleValeur: "Risque de collision" }
        ]
    },
    {
        id: 1008,
        fneId: 12347,
        action: "Validation",
        dateAction: "2023-10-05T14:00:00",
        utilisateurId: 456,
        utilisateurNom: "Marie Martin",
        fneDetails: {
            type: "Incident grave",
            refGne: "REF125",
            date: "2023-10-03",
            lieu: "Marseille",
            statut: "Validé"
        },
        modifications: [
            { champ: "statut", ancienneValeur: "En attente", nouvelleValeur: "Validé" }
        ]
    }
];

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données (simulé avec les données d'exemple)
    loadHistoriqueData();
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
});

// Fonction pour charger les données d'historique
function loadHistoriqueData() {
    // Dans une application réelle, vous feriez une requête AJAX ici
    // Pour cette démo, nous utilisons les données d'exemple
    historiqueData = sampleHistoriqueData;
    filteredData = [...historiqueData];
    totalPages = Math.ceil(filteredData.length / 10);
    
    // Afficher les données
    renderTable();
    updatePagination();
}

// Fonction pour configurer les écouteurs d'événements
function setupEventListeners() {
    // Recherche
    document.getElementById('searchBtn').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        filterData(searchTerm);
    });
    
    document.getElementById('searchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = e.target.value.toLowerCase();
            filterData(searchTerm);
        }
    });
    
    // Filtres
    document.getElementById('filterBtn').addEventListener('click', applyFilters);
    
    // Pagination
    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            updatePagination();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', function() {
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
        searchTerm = searchTerm.toLowerCase();
        filteredData = historiqueData.filter(historique => {
            // Recherche dans les informations principales
            const mainInfoMatch = 
                historique.id.toString().includes(searchTerm) ||
                historique.fneId.toString().includes(searchTerm) ||
                historique.action.toLowerCase().includes(searchTerm) ||
                historique.utilisateurNom.toLowerCase().includes(searchTerm) ||
                formatDateTime(historique.dateAction).toLowerCase().includes(searchTerm);
            
            // Recherche dans les détails de la FNE
            const fneDetailsMatch = 
                historique.fneDetails.type.toLowerCase().includes(searchTerm) ||
                historique.fneDetails.refGne.toLowerCase().includes(searchTerm) ||
                historique.fneDetails.lieu.toLowerCase().includes(searchTerm) ||
                historique.fneDetails.statut.toLowerCase().includes(searchTerm);
            
            // Recherche dans les modifications (si elles existent)
            let modificationsMatch = false;
            if (historique.modifications && historique.modifications.length > 0) {
                modificationsMatch = historique.modifications.some(mod => 
                    (mod.champ && mod.champ.toLowerCase().includes(searchTerm)) ||
                    (mod.ancienneValeur && mod.ancienneValeur.toString().toLowerCase().includes(searchTerm)) ||
                    (mod.nouvelleValeur && mod.nouvelleValeur.toString().toLowerCase().includes(searchTerm))
                );
            }
            
            return mainInfoMatch || fneDetailsMatch || modificationsMatch;
        });
    }
    
    currentPage = 1;
    totalPages = Math.ceil(filteredData.length / 10);
    
    renderTable();
    updatePagination();
}

// Fonction pour appliquer les filtres
function applyFilters() {
    const actionFilter = document.getElementById('filterAction').value;
    const dateDebut = document.getElementById('dateDebut').value;
    const dateFin = document.getElementById('dateFin').value;
    const heureDebut = document.getElementById('heureDebut').value;
    const heureFin = document.getElementById('heureFin').value;
    
    let tempData = [...historiqueData];
    
    if (actionFilter) {
        tempData = tempData.filter(historique => historique.action === actionFilter);
    }
    
    // Filtrage par date et heure
    if (dateDebut || dateFin || heureDebut || heureFin) {
        tempData = tempData.filter(historique => {
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
            
            // Vérifier l'heure de début
            if (heureDebut) {
                const [heureDebutH, heureDebutM] = heureDebut.split(':').map(Number);
                const actionHeure = actionDate.getHours();
                const actionMinute = actionDate.getMinutes();
                
                if (actionHeure < heureDebutH || (actionHeure === heureDebutH && actionMinute < heureDebutM)) {
                    return false;
                }
            }
            
            // Vérifier l'heure de fin
            if (heureFin) {
                const [heureFinH, heureFinM] = heureFin.split(':').map(Number);
                const actionHeure = actionDate.getHours();
                const actionMinute = actionDate.getMinutes();
                
                if (actionHeure > heureFinH || (actionHeure === heureFinH && actionMinute > heureFinM)) {
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

// Fonction pour afficher les données dans le tableau
function renderTable() {
    const tableBody = document.querySelector('#historique-table tbody');
    tableBody.innerHTML = '';
    
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
        
        // Déterminer la classe du badge en fonction de l'action
        let actionClass = '';
        switch (historique.action) {
            case 'Création':
                actionClass = 'action-creation';
                break;
            case 'Modification':
                actionClass = 'action-modification';
                break;
            case 'Validation':
                actionClass = 'action-validation';
                break;
            case 'Refus':
                actionClass = 'action-refus';
                break;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${historique.id}</td>
            <td>${historique.fneId}</td>
            <td><span class="action-badge ${actionClass}">${historique.action}</span></td>
            <td>${formatDateTime(historique.dateAction)}</td>
            <td>${historique.utilisateurNom}</td>
            <td>
                <button class="btn btn-view" onclick="viewHistoriqueDetails(${historique.id})">
                    <i class="fas fa-eye"></i> Voir
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
}

// Fonction pour mettre à jour la pagination
function updatePagination() {
    document.getElementById('pageInfo').textContent = `Page ${currentPage} sur ${totalPages || 1}`;
    
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// Fonction pour formater la date et l'heure
function formatDateTime(dateTimeString) {
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleDateString('fr-FR', options);
}

// Fonction pour afficher les détails d'une entrée d'historique
function viewHistoriqueDetails(historiqueId) {
    currentHistoriqueId = historiqueId;
    const historique = historiqueData.find(h => h.id === historiqueId);
    
    if (!historique) return;
    
    currentFneId = historique.fneId;
    
    // Remplir les détails dans le modal
    document.getElementById('modalHistoriqueId').textContent = historique.id;
    
    // Informations de base
    document.getElementById('detail-historique-id').textContent = historique.id;
    document.getElementById('detail-fne-id').textContent = historique.fneId;
    
    // Action avec badge
    const detailAction = document.getElementById('detail-action');
    detailAction.textContent = historique.action;
    detailAction.className = 'action-badge'; // Réinitialiser les classes
    
    // Ajouter la classe appropriée
    switch (historique.action) {
        case 'Création':
            detailAction.classList.add('action-creation');
            break;
        case 'Modification':
            detailAction.classList.add('action-modification');
            break;
        case 'Validation':
            detailAction.classList.add('action-validation');
            break;
        case 'Refus':
            detailAction.classList.add('action-refus');
            break;
    }
    
    document.getElementById('detail-date').textContent = formatDateTime(historique.dateAction);
    document.getElementById('detail-utilisateur').textContent = `${historique.utilisateurNom} (ID: ${historique.utilisateurId})`;
    
    // Informations sur la FNE
    document.getElementById('detail-fne-type').textContent = historique.fneDetails.type;
    document.getElementById('detail-fne-ref').textContent = historique.fneDetails.refGne;
    document.getElementById('detail-fne-date').textContent = new Date(historique.fneDetails.date).toLocaleDateString('fr-FR');
    document.getElementById('detail-fne-lieu').textContent = historique.fneDetails.lieu;
    
    // Statut avec badge
    const detailStatut = document.getElementById('detail-fne-statut');
    detailStatut.textContent = historique.fneDetails.statut;
    detailStatut.className = 'status-badge'; // Réinitialiser les classes
    
    // Ajouter la classe appropriée
    switch (historique.fneDetails.statut) {
        case 'En attente':
            detailStatut.classList.add('status-pending');
            break;
        case 'Validé':
            detailStatut.classList.add('status-approved');
            break;
        case 'Refusé':
            detailStatut.classList.add('status-rejected');
            break;
    }
    
    // Modifications
    const changesContainer = document.getElementById('detail-changes');
    changesContainer.innerHTML = '';
    
    if (historique.modifications.length === 0) {
        changesContainer.innerHTML = '<p>Aucune modification spécifique enregistrée pour cette action.</p>';
    } else {
        historique.modifications.forEach(modification => {
            const changeItem = document.createElement('div');
            changeItem.className = 'change-item';
            
            changeItem.innerHTML = `
                <span class="change-field">${formatFieldName(modification.champ)}:</span> 
                <span class="change-old">${modification.ancienneValeur || '(vide)'}</span>
                <span class="change-arrow"><i class="fas fa-arrow-right"></i></span>
                <span class="change-new">${modification.nouvelleValeur || '(vide)'}</span>
            `;
            
            changesContainer.appendChild(changeItem);
        });
    }
    
    // Afficher le modal
    document.getElementById('historiqueDetailsModal').style.display = 'block';
}

// Fonction pour formater le nom des champs
function formatFieldName(fieldName) {
    const fieldMappings = {
        'description': 'Description',
        'impacts': 'Impacts opérationnels',
        'statut': 'Statut',
        'lieu': 'Lieu',
        'commentaire': 'Commentaire'
    };
    
    return fieldMappings[fieldName] || fieldName;
}

// Fonction pour fermer le modal
function closeModal() {
    document.getElementById('historiqueDetailsModal').style.display = 'none';
    currentHistoriqueId = null;
    currentFneId = null;
}

// Fonction pour voir la FNE associée
function voirFNE(fneId) {
    // Dans une application réelle, vous redirigeriez vers la page de détails de la FNE
    alert(`Redirection vers la FNE #${fneId}`);
    
    // Vous pourriez rediriger comme ceci:
    // window.location.href = `voir-fne.html?id=${fneId}`;
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = function(event) {
    const modal = document.getElementById('historiqueDetailsModal');
    if (event.target === modal) {
        closeModal();
    }
};