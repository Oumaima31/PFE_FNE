// Variables globales
let currentPage = 1;
let totalPages = 1;
let fneData = [];
let filteredData = [];
let currentFneId = null;

// Données d'exemple pour la démonstration
const sampleData = [
   
];

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données (simulé avec les données d'exemple)
    loadFneData();
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
});

// Fonction pour charger les données FNE
function loadFneData() {
    // Dans une application réelle, vous feriez une requête AJAX ici
    // Pour cette démo, nous utilisons les données d'exemple
    
    // Filtrer pour n'afficher que les FNE avec le statut "En attente"
    fneData = sampleData.filter(fne => fne.statut === "En attente");
    filteredData = [...fneData];
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
    document.getElementById('filterType').addEventListener('change', applyFilters);
    
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
    
    // Onglets du modal
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Désactiver tous les onglets
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activer l'onglet sélectionné
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Fonction pour filtrer les données
function filterData(searchTerm) {
    if (!searchTerm) {
        filteredData = [...fneData];
    } else {
        filteredData = fneData.filter(fne => {
            return (
                fne.id.toString().includes(searchTerm) ||
                fne.type.toLowerCase().includes(searchTerm) ||
                fne.refGne.toLowerCase().includes(searchTerm) ||
                fne.lieu.toLowerCase().includes(searchTerm) ||
                fne.indicatif.toLowerCase().includes(searchTerm) ||
                fne.description.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    applyFilters();
}

// Fonction pour appliquer les filtres
function applyFilters() {
    const typeFilter = document.getElementById('filterType').value;
    
    let tempData = [...filteredData];
    
    if (typeFilter) {
        tempData = tempData.filter(fne => fne.type === typeFilter);
    }
    
    filteredData = tempData;
    currentPage = 1;
    totalPages = Math.ceil(filteredData.length / 10);
    
    renderTable();
    updatePagination();
}

// Fonction pour afficher les données dans le tableau
function renderTable() {
    const tableBody = document.querySelector('#fne-table tbody');
    tableBody.innerHTML = '';
    
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
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fne.id}</td>
            <td>${fne.type}</td>
            <td>${fne.refGne}</td>
            <td>${formatDate(fne.date)}</td>
            <td>${fne.lieu}</td>
            <td>${fne.indicatif} (${fne.appareil})</td>
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

// Fonction pour formater la date
function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Fonction pour afficher les détails d'une FNE
function viewFneDetails(fneId) {
    currentFneId = fneId;
    const fne = fneData.find(f => f.id === fneId);
    
    if (!fne) return;
    
    // Remplir les détails dans le modal
    document.getElementById('modalFneId').textContent = fne.id;
    
    // Onglet Informations générales
    document.getElementById('detail-type').textContent = fne.type;
    document.getElementById('detail-ref').textContent = fne.refGne;
    document.getElementById('detail-organisme').textContent = fne.organisme;
    document.getElementById('detail-date').textContent = formatDate(fne.date);
    document.getElementById('detail-heure').textContent = fne.heure;
    document.getElementById('detail-lieu').textContent = fne.lieu;
    document.getElementById('detail-detection').textContent = fne.detection;
    document.getElementById('detail-impacts').textContent = fne.impacts;
    
    // Onglet Aéronef
    document.getElementById('detail-indicatif').textContent = fne.indicatif;
    document.getElementById('detail-ssr').textContent = fne.ssr;
    document.getElementById('detail-appareil').textContent = fne.appareil;
    document.getElementById('detail-regles').textContent = fne.regles;
    document.getElementById('detail-depart').textContent = fne.depart;
    document.getElementById('detail-arrivee').textContent = fne.arrivee;
    document.getElementById('detail-cap').textContent = fne.cap;
    document.getElementById('detail-alt-reel').textContent = fne.altReel;
    document.getElementById('detail-alt-auto').textContent = fne.altAuto;
    document.getElementById('detail-vitesse').textContent = fne.vitesse;
    
    // Onglet Victimes
    document.getElementById('detail-passagers').textContent = fne.passagers;
    document.getElementById('detail-personnel').textContent = fne.personnel;
    document.getElementById('detail-equipage').textContent = fne.equipage;
    document.getElementById('detail-autre').textContent = fne.autre;
    
    // Onglet Météo
    document.getElementById('detail-vent-dir').textContent = fne.ventDir;
    document.getElementById('detail-vent-vitesse').textContent = fne.ventVitesse;
    document.getElementById('detail-visibilite').textContent = fne.visibilite;
    document.getElementById('detail-nebulosite').textContent = fne.nebulosite;
    document.getElementById('detail-precipitation').textContent = fne.precipitation;
    document.getElementById('detail-autres-phenomenes').textContent = fne.autresPhenomenes;
    
    // Onglet Équipement
    document.getElementById('detail-implique-installation').textContent = fne.impliqueInstallation;
    document.getElementById('detail-type-installation').textContent = fne.typeInstallation || 'N/A';
    document.getElementById('detail-compagnie').textContent = fne.compagnie || 'N/A';
    document.getElementById('detail-implique-vehicule').textContent = fne.impliqueVehicule;
    document.getElementById('detail-type-materiel').textContent = fne.typeMateriel || 'N/A';
    
    // Onglet Description
    document.getElementById('detail-description').textContent = fne.description;
    document.getElementById('detail-redacteur').textContent = fne.redacteur;
    
    // Afficher le modal
    document.getElementById('fneDetailsModal').style.display = 'block';
    
    // Activer le premier onglet par défaut
    document.querySelector('.tab-btn[data-tab="general"]').click();
}

// Fonction pour fermer le modal
function closeModal() {
    document.getElementById('fneDetailsModal').style.display = 'none';
    currentFneId = null;
}

// Fonction pour modifier une FNE
function modifierFNE(fneId) {
    // Dans une application réelle, vous redirigeriez vers un formulaire d'édition
    // Pour cette démo, nous affichons simplement une alerte
    alert(`Modification de la FNE #${fneId}`);
    
    // Vous pourriez rediriger vers une page d'édition comme ceci:
    // window.location.href = `modifier-fne.html?id=${fneId}`;
}

// Fonction pour refuser une FNE
function refuserFNE(fneId) {
    if (confirm(`Êtes-vous sûr de vouloir refuser la FNE #${fneId} ?`)) {
        // Dans une application réelle, vous feriez une requête AJAX ici
        // Pour cette démo, nous mettons simplement à jour les données locales
        const fneIndex = fneData.findIndex(f => f.id === fneId);
        if (fneIndex !== -1) {
            fneData[fneIndex].statut = 'Refusé';
            
            // Supprimer de la liste filtrée car ce n'est plus "En attente"
            filteredData = filteredData.filter(f => f.id !== fneId);
            
            // Fermer le modal si ouvert
            if (currentFneId === fneId) {
                closeModal();
            }
            
            // Rafraîchir le tableau
            totalPages = Math.ceil(filteredData.length / 10);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            renderTable();
            updatePagination();
            
            // Afficher un message de confirmation
            alert(`La FNE #${fneId} a été refusée avec succès.`);
        }
    }
}

// Fonction pour valider une FNE
function validerFNE(fneId) {
    if (confirm(`Êtes-vous sûr de vouloir valider la FNE #${fneId} ?`)) {
        // Dans une application réelle, vous feriez une requête AJAX ici
        // Pour cette démo, nous mettons simplement à jour les données locales
        const fneIndex = fneData.findIndex(f => f.id === fneId);
        if (fneIndex !== -1) {
            fneData[fneIndex].statut = 'Validé';
            
            // Supprimer de la liste filtrée car ce n'est plus "En attente"
            filteredData = filteredData.filter(f => f.id !== fneId);
            
            // Fermer le modal si ouvert
            if (currentFneId === fneId) {
                closeModal();
            }
            
            // Rafraîchir le tableau
            totalPages = Math.ceil(filteredData.length / 10);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            renderTable();
            updatePagination();
            
            // Afficher un message de confirmation
            alert(`La FNE #${fneId} a été validée avec succès.`);
        }
    }
}

// Fermer le modal si l'utilisateur clique en dehors
window.onclick = function(event) {
    const modal = document.getElementById('fneDetailsModal');
    if (event.target === modal) {
        closeModal();
    }
};