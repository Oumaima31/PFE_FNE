// Fonction pour combiner les données des aéronefs A et B en un seul objet JSON
function combineAircraftData() {
  const aircraftA = {
      indicatif: document.getElementById('indicatif_immatricultion_A').value,
      code_ssr: document.getElementById('code_ssr_A').value,
      type_appareil: document.getElementById('type_appareil_A').value,
      regles_vol: document.getElementById('regles_vol_A').value,
      terrain_depart: document.getElementById('terrain_depart_A').value,
      terrain_arrivee: document.getElementById('terrain_arrivée_A').value,
      cap: document.getElementById('cap_A').value,
      altitude_reel: document.getElementById('altitude_reel_A').value,
      altitude_autorise: document.getElementById('altitude_autorise_A').value,
      vitesse: document.getElementById('vitesse_A').value
  };

  const aircraftB = {
      indicatif: document.getElementById('indicatif_immatricultion_B').value,
      code_ssr: document.getElementById('code_ssr_B').value,
      type_appareil: document.getElementById('type_appareil_B').value,
      regles_vol: document.getElementById('regles_vol_B').value,
      terrain_depart: document.getElementById('terrain_depart_B').value,
      terrain_arrivee: document.getElementById('terrain_arrivée_B').value,
      cap: document.getElementById('cap_B').value,
      altitude_reel: document.getElementById('altitude_reel_B').value,
      altitude_autorise: document.getElementById('altitude_autorise_B').value,
      vitesse: document.getElementById('vitesse_B').value
  };

  return JSON.stringify({
      aircraftA: aircraftA,
      aircraftB: aircraftB
  });
}

// Fonction de validation pour l'indicatif
function validateIndicatif(input, suffix) {
  const value = input.value.trim();
  const errorElement = document.getElementById(`indicatif-error-${suffix}`);
  
  // Expression régulière: exactement 4 caractères alphanumériques
  const regex = /^[A-Za-z0-9]{4}$/;
  
  if (value && !regex.test(value)) {
      errorElement.style.display = 'block';
      return false;
  } else {
      errorElement.style.display = 'none';
      return true;
  }
}

// Fonction de validation pour le code SSR
function validateSSR(input, suffix) {
  const value = input.value.trim();
  const errorElement = document.getElementById(`ssr-error-${suffix}`);
  
  // Expression régulière: exactement 4 chiffres
  const regex = /^[A-Za-z0-9]{4}$/;
  
  if (value && !regex.test(value)) {
      errorElement.style.display = 'block';
      return false;
  } else {
      errorElement.style.display = 'none';
      return true;
  }
}

// Validation lors de la perte de focus
document.getElementById('indicatif_immatricultion_A').addEventListener('blur', function() {
  validateIndicatif(this, 'A');
});

document.getElementById('code_ssr_A').addEventListener('blur', function() {
  validateSSR(this, 'A');
});

document.getElementById('indicatif_immatricultion_B').addEventListener('blur', function() {
  validateIndicatif(this, 'B');
});

document.getElementById('code_ssr_B').addEventListener('blur', function() {
  validateSSR(this, 'B');
});

// Validation avant soumission du formulaire
document.querySelector('form').addEventListener('submit', function(e) {
  // Valider tous les champs
  const indicatifAValid = validateIndicatif(document.getElementById('indicatif_immatricultion_A'), 'A');
  const ssrAValid = validateSSR(document.getElementById('code_ssr_A'), 'A');
  const indicatifBValid = validateIndicatif(document.getElementById('indicatif_immatricultion_B'), 'B');
  const ssrBValid = validateSSR(document.getElementById('code_ssr_B'), 'B');
  
  // Combiner les données des aéronefs
  const combinedAircraftData = combineAircraftData();
  
  // Créer un champ caché pour envoyer les données combinées
  const hiddenField = document.createElement('input');
  hiddenField.type = 'hidden';
  hiddenField.name = 'aircraft_data';
  hiddenField.value = combinedAircraftData;
  this.appendChild(hiddenField);
  
  // Vérifier les validations
  if (!indicatifAValid || !ssrAValid || !indicatifBValid || !ssrBValid) {
      e.preventDefault(); // Empêche la soumission du formulaire
      alert('Veuillez corriger les erreurs avant de soumettre le formulaire.');
  }
});

// Fonction pour basculer l'affichage de la navbar sur mobile
function toggleNavbar() {
  const navbarContainer = document.querySelector(".navbar-container");
  navbarContainer.classList.toggle("active");
}

// Fonction pour basculer l'affichage des sections
function toggleSection(headerElement) {
  // Trouver la section parente
  const section = headerElement.closest(".collapsible-section");
  const content = section.querySelector(".section-content");
  const icon = headerElement.querySelector(".toggle-icon i");

  // Basculer la classe active
  headerElement.classList.toggle("active");
  content.classList.toggle("active");

  // Changer l'icône
  if (content.classList.contains("active")) {
      icon.className = "fas fa-chevron-up";
  } else {
      icon.className = "fas fa-chevron-down";
  }
}
function updateRefGneNumber() {
  const type_evt = document.getElementById("type_evt").value
  const ref_gne = document.getElementById("ref_gne")
  const notification = document.getElementById("notification")

  // Créer un élément span pour le texte de notification si nécessaire
  let notificationText = notification.querySelector("#notificationText")
  if (!notificationText) {
    notificationText = document.createElement("span")
    notificationText.id = "notificationText"
    notification.appendChild(notificationText)
  }

  ref_gne.innerHTML = "" // Efface les options précédentes
  notification.style.display = "none" // Masque la notification par défaut

  let start, end, prefix, message, colorClass

  switch (type_evt) {
    case "accident":
      start = 1
      end = 11
      prefix = "ACCID"
      message = "Accident détecté !"
      colorClass = "red"
      break
    case "incident_grave":
      start = 1
      end = 25
      prefix = "ING"
      message = "Incident grave détecté !"
      colorClass = "orange"
      break
    case "incident":
      start = 1
      end = 13
      prefix = "INC"
      message = "Incident détecté !"
      colorClass = "green"
      break
    case "evt_technique":
      start = 1
      end = 39
      prefix = "EVT"
      message = "Evenement Technique détecté !"
      colorClass = "gray"
      break
    default:
      return // Ne rien faire si aucun type sélectionné
  }

  // Générer les options avec préfixe
  for (let i = start; i <= end; i++) {
    const option = document.createElement("option")
    option.value = `${prefix}/${i}`
    option.textContent = `${prefix}/${i}`
    ref_gne.appendChild(option)
  }

  // Afficher la notification avec animation
  notificationText.textContent = message
  notification.className = `notification ${colorClass}` // Appliquer la classe de couleur
  notification.style.display = "block"

  // Masquer la notification après 3 secondes
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.style.display = "none";
      notification.style.opacity = "1";
    }, 300);
  }, 3000)
}

// pour date et heure affiche automatiquement
function updateDateTime() {
  const now = new Date()

  // Formater la date
  const optionsDate = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  const formattedDate = now.toLocaleDateString("fr-FR", optionsDate)

  // Formater l'heure
  const optionsTime = { hour: "2-digit", minute: "2-digit", second: "2-digit" }
  const formattedTime = now.toLocaleTimeString("fr-FR", optionsTime)

  // Mettre à jour les éléments HTML
  document.getElementById("current-date").textContent = formattedDate
  document.getElementById("current-time").textContent = formattedTime
}

//pour le meteo
async function fetchMeteo() {
  const apiKey = "17cf16edeaed1f9b3bb60006a242d5d1"
  const url = `https://api.openweathermap.org/data/2.5/weather?q=Tunis,tn&units=metric&lang=fr&appid=${apiKey}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`)
    }

    const data = await response.json()

    // Vérification des données
    if (!data.weather || !data.main) {
      throw new Error("Données météo non disponibles")
    }

    // Récupération des valeurs
    const iconCode = data.weather[0].icon
    const temperature = Math.round(data.main.temp) + "°C"
    const description = data.weather[0].description

    // Affichage des valeurs avec animation
    const meteoIcon = document.getElementById("meteo-icon");
    const meteoTemp = document.getElementById("meteo-temp");
    const meteoDesc = document.getElementById("meteo-description");
    
    meteoIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Météo" style="width:40px;height:40px;">`;
    
    // Animation simple pour les valeurs de température et description
    meteoTemp.style.opacity = "0";
    meteoDesc.style.opacity = "0";
    
    setTimeout(() => {
      meteoTemp.textContent = temperature;
      meteoDesc.textContent = description;
      meteoTemp.style.transition = "opacity 0.5s ease";
      meteoDesc.style.transition = "opacity 0.5s ease";
      meteoTemp.style.opacity = "1";
      meteoDesc.style.opacity = "1";
    }, 300);
    
  } catch (error) {
    console.error("Erreur : ", error)
    document.getElementById("meteo").innerHTML = `<span style="color:white;">Météo indisponible (${error.message})</span>`
  }
}

// Vérifier si des messages de notification sont présents au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Vérifier s'il y a des messages dans les éléments Thymeleaf
  const notification = document.getElementById("notification")

  if (notification) {
    // Vérifier si la notification contient du texte
    if (notification.textContent.trim() !== "") {
      // Ajouter la classe appropriée en fonction du contenu
      if (notification.querySelector('[th\\:if="${message}"]')) {
        notification.classList.add("green")
        notification.style.display = "block"
      } else if (notification.querySelector('[th\\:if="${error}"]')) {
        notification.classList.add("red")
        notification.style.display = "block"
      }

      // Masquer la notification après 5 secondes
      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => {
          notification.style.display = "none";
          notification.style.opacity = "1";
        }, 300);
      }, 5000)
    }
  }

  // Initialiser le sélecteur de type d'événement
  const typeEvt = document.getElementById("type_evt")
  if (typeEvt && typeEvt.value) {
    updateRefGneNumber()
  }
})
function logout() {
  fetch('/logout', {
    method: 'POST',
    credentials: '/include'
  })
  .then(response => {
    if (response.ok) {
      // Rediriger vers la page de login
      window.location.href = '/'; 
    } else {
      console.error("Échec de la déconnexion");
      window.location.href = '/'; // Redirection même en cas d'erreur
    }
  })
  .catch(error => {
    console.error("Erreur lors de la déconnexion:", error);
    window.location.href = '/';
  });
}