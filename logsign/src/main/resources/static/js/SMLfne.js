// Validation des champs Indicatif et Code SSR
/*document.addEventListener('DOMContentLoaded', function() {
    // Validation Indicatif
    const indicatifInput = document.getElementById('indicatif_immatricultion');
    const indicatifError = document.getElementById('indicatif_error');
    
    indicatifInput.addEventListener('blur', function() {
        if (!/^[A-Za-z]{4}$/.test(this.value)) {
            indicatifError.style.display = 'block';
        } else {
            indicatifError.style.display = 'none';
        }
    });
  
    // Validation Code SSR
    const ssrInput = document.getElementById('code_ssr');
    const ssrError = document.getElementById('ssr_error');
    
    ssrInput.addEventListener('blur', function() {
        if (!/^[A-Za-z]{4}$/.test(this.value)) {
            ssrError.style.display = 'block';
        } else {
            ssrError.style.display = 'none';
        }
    });
  
    // Validation avant soumission
    document.querySelector('form').addEventListener('submit', function(e) {
        let isValid = true;
        
        if (!/^[A-Za-z]{4}$/.test(indicatifInput.value)) {
            indicatifError.style.display = 'block';
            isValid = false;
        }
        
        if (!/^[A-Za-z]{4}$/.test(ssrInput.value)) {
            ssrError.style.display = 'block';
            isValid = false;
        }
        
        if (!isValid) {
            e.preventDefault();
            alert('Veuillez corriger les erreurs dans les champs avant de soumettre.');
        }
    });
  });*/
  // Fonction pour basculer l'affichage de la navbar sur mobile
  function toggleNavbar() {
    const navbarContainer = document.querySelector(".navbar-container")
    navbarContainer.classList.toggle("active")
  }
  
  // Fonction pour basculer l'affichage des sections
  function toggleSection(headerElement) {
    // Trouver la section parente
    const section = headerElement.closest('.collapsible-section');
    const content = section.querySelector('.section-content');
    const icon = headerElement.querySelector('.toggle-icon i');
    
    // Basculer la classe active
    headerElement.classList.toggle('active');
    content.classList.toggle('active');
    
    // Changer l'icône
    if (content.classList.contains('active')) {
      icon.className = 'fas fa-chevron-up';
    } else {
      icon.className = 'fas fa-chevron-down';
    }
  }
  
  function updateRefGneNumber() {
    const type_evt = document.getElementById("type_evt").value
    const REF_GNE = document.getElementById("ref_gne")
    const notification = document.getElementById("notification")
  
    // Créer un élément span pour le texte de notification si nécessaire
    let notificationText = notification.querySelector("#notificationText")
    if (!notificationText) {
      notificationText = document.createElement("span")
      notificationText.id = "notificationText"
      notification.appendChild(notificationText)
    }
  
    REF_GNE.innerHTML = "" // Efface les options précédentes
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
      REF_GNE.appendChild(option)
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