document.getElementById('fneForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    console.log('Données du formulaire:', data);
    alert('Formulaire soumis avec succès!');
});

    // Fonction pour afficher l'historique des FNE
function showHistorique() {
    alert("Affichage de l'historique des FNE...");
    
}

// Fonction pour afficher le guide PDF
function showGuide() {
    alert("Ouverture du guide PDF...");
    window.open('guide.pdf', '_blank'); // Remplacez 'guide.pdf' par le chemin de votre fichier PDF
}


function showHistorique() {
    hideAllContent();
    document.getElementById('historique').style.display = 'block';
}

function showGuide() {
    hideAllContent();
    document.getElementById('guide').style.display = 'block';
}



function hideAllContent() {
    const contents = document.querySelectorAll('.navbar-content');
    contents.forEach(content => {
        content.style.display = 'none';
    });
}
function toggleNavbar() {
    const navbarContainer = document.querySelector('.navbar-container');
    navbarContainer.classList.toggle('active');
}
function updateRefGneNumber() {
    const type_evt = document.getElementById('type_evt').value;
    const REF_GNE = document.getElementById('REF_GNE');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    REF_GNE.innerHTML = ''; // Efface les options précédentes
    notification.style.display = 'none'; // Masque la notification par défaut

    let start, end, prefix, message, colorClass;

    switch (type_evt) {
        case 'accident':
            start = 1;
            end = 11;
            prefix = "ACCID";
            message = "Accident détecté !";
            colorClass = "red";
            break;
        case 'incident_grave':
            start = 1;
            end = 25;
            prefix = "ING";
            message = "Incident grave détecté !";
            colorClass = "orange";
            break;
        case 'incident':
            start = 1;
            end = 13;
            prefix = "INC";
            message = "Incident détecté !";
            colorClass = "green";
            break;
        case 'evt_technique':
            start = 1;
            end = 39;
            prefix = "EVT";
            message = "Evenement Technique détecté !";
            colorClass = "gray";
            break;
        default:
            return; // Ne rien faire si aucun type sélectionné
    }

    // Générer les options avec préfixe
    for (let i = start; i <= end; i++) {
        const option = document.createElement('option');
        option.value = `${prefix}/${i}`;
        option.textContent = `${prefix}/${i}`;
        REF_GNE.appendChild(option);
    }

    // Afficher la notification
    notificationText.textContent = message;
    notification.className = `notification ${colorClass}`; // Appliquer la classe de couleur
    notification.style.display = 'block';
}

// pour date et heure affiche automatiquement
function updateDateTime() {
    const now = new Date();

    // Formater la date
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('fr-FR', optionsDate);

    // Formater l'heure
    const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const formattedTime = now.toLocaleTimeString('fr-FR', optionsTime);

    // Mettre à jour les éléments HTML
    document.getElementById('current-date').textContent = formattedDate;
    document.getElementById('current-time').textContent = formattedTime;
}
//pour le meteo

async function fetchMeteo() {
    const apiKey = "17cf16edeaed1f9b3bb60006a242d5d1"; 
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Tunis,tn&units=metric&lang=fr&appid=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        
        const data = await response.json();

        // Vérification des données
        if (!data.weather || !data.main) {
            throw new Error("Données météo non disponibles");
        }

        // Récupération des valeurs
        const iconCode = data.weather[0].icon;
        const temperature = Math.round(data.main.temp) + "°C";
        const description = data.weather[0].description;

        // Affichage des valeurs
        document.getElementById("meteo-icon").innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="Météo">`;
        document.getElementById("meteo-temp").textContent = temperature;
        document.getElementById("meteo-description").textContent = description;

    } catch (error) {
        console.error("Erreur : ", error);
        document.getElementById("meteo").innerHTML = `<span style="color:red;">Météo indisponible(${error.message})</span>`;
    }
}


document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Empêche la soumission par défaut

    const matricule = document.getElementById('login-matricule').value;
    const password = document.getElementById('login-password').value;

    fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${matricule}&motDePasse=${password}`, // Utilisez les noms des paramètres attendus par le serveur
    })
    .then(response => {
        if (response.redirected) {
            // Si la réponse est une redirection, naviguer vers l'URL de redirection
            console.log("Redirection vers :", response.url); // Afficher l'URL de redirection dans la console
            window.location.href = response.url;
        } else {
            throw new Error("Erreur lors de la connexion");
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert("Identifiant ou mot de passe incorrect"); // Affiche un message d'erreur
    });
});