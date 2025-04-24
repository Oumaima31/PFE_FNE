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
    const section = headerElement.closest(".collapsible-section")
    const content = section.querySelector(".section-content")
    const icon = headerElement.querySelector(".toggle-icon i")
  
    // Basculer la classe active
    headerElement.classList.toggle("active")
    content.classList.toggle("active")
  
    // Changer l'icône
    if (content.classList.contains("active")) {
      icon.className = "fas fa-chevron-up"
    } else {
      icon.className = "fas fa-chevron-down"
    }
  }
  
  function updateRefGneNumber() {
    const type_evt = document.getElementById("type_evt").value
    const REF_GNE = document.getElementById("ref_gne")
    const notification = document.getElementById("notification")
    const notificationText = document.getElementById("notificationText")
  
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
      notification.style.opacity = "0"
      setTimeout(() => {
        notification.style.display = "none"
        notification.style.opacity = "1"
      }, 300)
    }, 3000)
  }
  // Add this to the beginning of your FNEadmin.js file

// Function to load FNE data when editing
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're in edit mode by looking for an ID parameter in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const fneId = urlParams.get('id');
  
  if (fneId) {
      // We're in edit mode, load the FNE data
      loadFneData(fneId);
  }
});

// Function to load FNE data from the server
function loadFneData(fneId) {
  fetch(`/auth/api/fne/${fneId}`)
      .then(response => {
          if (!response.ok) {
              throw new Error('Erreur lors de la récupération des données de la FNE');
          }
          return response.json();
      })
      .then(fne => {
          // Populate form fields with FNE data
          populateFormFields(fne);
      })
      .catch(error => {
          console.error('Erreur:', error);
          // Show error notification
          const notification = document.getElementById('notification');
          notification.innerHTML = `<span style="color: red;">Erreur lors du chargement des données: ${error.message}</span>`;
          notification.style.display = 'block';
          notification.classList.add('red');
          
          // Hide notification after 5 seconds
          setTimeout(() => {
              notification.style.opacity = "0";
              setTimeout(() => {
                  notification.style.display = "none";
                  notification.style.opacity = "1";
              }, 300);
          }, 5000);
      });
}


// Helper function to set value if the element exists
function setValueIfExists(id, value) {
  const element = document.getElementById(id);
  if (element && value !== null && value !== undefined) {
      element.value = value;
  }
}

// Helper function to set radio button value
function setRadioValue(name, value) {
  if (value === null || value === undefined) return;
  
  const radioButtons = document.querySelectorAll(`input[name="${name}"]`);
  radioButtons.forEach(radio => {
      if (radio.value === String(value)) {
          radio.checked = true;
      }
  });
}

// Helper function to format date for input fields (YYYY-MM-DD)
function formatDateForInput(dateString) {
  if (!dateString) return '';
  
  try {
      // If it's already in the correct format, return it
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
      }
      
      // Try to parse the date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
          return '';
      }
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
  } catch (error) {
      console.error('Error formatting date:', error);
      return '';
  }
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
      const meteoIcon = document.getElementById("meteo-icon")
      const meteoTemp = document.getElementById("meteo-temp")
      const meteoDesc = document.getElementById("meteo-description")
  
      meteoIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Météo" style="width:40px;height:40px;">`
  
      // Animation simple pour les valeurs de température et description
      meteoTemp.style.opacity = "0"
      meteoDesc.style.opacity = "0"
  
      setTimeout(() => {
        meteoTemp.textContent = temperature
        meteoDesc.textContent = description
        meteoTemp.style.transition = "opacity 0.5s ease"
        meteoDesc.style.transition = "opacity 0.5s ease"
        meteoTemp.style.opacity = "1"
        meteoDesc.style.opacity = "1"
      }, 300)
    } catch (error) {
      console.error("Erreur : ", error)
      document.getElementById("meteo").innerHTML =
        `<span style="color:white;">Météo indisponible (${error.message})</span>`
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
          notification.style.opacity = "0"
          setTimeout(() => {
            notification.style.display = "none"
            notification.style.opacity = "1"
          }, 300)
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
        window.location.href = '/'; // ou '/login' selon votre configuration
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
  // Fonction pour populer les champs du formulaire avec les données FNE
function populateFormFields(fne) {
  // Set type_evt and trigger the REF GNE options update
  const typeEvtSelect = document.getElementById("type_evt")
  if (fne.type_evt) {
    typeEvtSelect.value = fne.type_evt
    // Trigger the change event to update REF GNE options
    updateRefGneNumber()

    // Set REF GNE after options are generated
    setTimeout(() => {
      const refGneSelect = document.getElementById("ref_gne")
      if (refGneSelect && fne.ref_gne) {
        refGneSelect.value = fne.ref_gne
      }
    }, 100)
  }

  // Section 1: Informations générales
  setValueIfExists("Organisme_concerné", fne.organisme_concerné)
  setValueIfExists("Date", formatDateForInput(fne.date))
  setValueIfExists("heure_UTC", fne.heure_UTC)
  setValueIfExists("Lieu_EVT", fne.lieu_EVT)
  setValueIfExists("moyen_detection", fne.moyen_detection)
  setValueIfExists("impacts_operationnels", fne.impacts_operationnels)

  // Section 2: Aéronef(s) concerné(s) - Ligne A
  setValueIfExists("indicatif_immatricultion", fne.indicatif_immatricultion)
  setValueIfExists("code_ssr", fne.code_ssr)
  setValueIfExists("type_appareil", fne.type_appareil)
  setValueIfExists("regles_vol", fne.regles_vol)
  setValueIfExists("terrain_depart", fne.terrain_depart)
  setValueIfExists("terrain_arrivée", fne.terrain_arrivée)
  setValueIfExists("cap", fne.cap)
  setValueIfExists("altitude_reel", fne.altitude_reel)
  setValueIfExists("altitude_autorise", fne.altitude_autorise)
  setValueIfExists("vitesse", fne.vitesse)

  // Section 2: Aéronef(s) concerné(s) - Ligne B
  setValueIfExists("indicatif_immatricultion_b", fne.indicatif_immatricultion_b)
  setValueIfExists("code_ssr_b", fne.code_ssr_b)
  setValueIfExists("type_appareil_b", fne.type_appareil_b)
  setValueIfExists("regles_vol_b", fne.regles_vol_b)
  setValueIfExists("terrain_depart_b", fne.terrain_depart_b)
  setValueIfExists("terrain_arrivée_b", fne.terrain_arrivée_b)
  setValueIfExists("cap_b", fne.cap_b)
  setValueIfExists("altitude_reel_b", fne.altitude_reel_b)
  setValueIfExists("altitude_autorise_b", fne.altitude_autorise_b)
  setValueIfExists("vitesse_b", fne.vitesse_b)

  // Section 3: Nombre de victimes
  setValueIfExists("passagers", fne.passagers)
  setValueIfExists("personnel", fne.personnel)
  setValueIfExists("equipage", fne.equipage)
  setValueIfExists("autre", fne.autre)

  // Section 4: Conditions météorologiques
  setValueIfExists("vent_direction", fne.vent_direction)
  setValueIfExists("vent_vitesse", fne.vent_vitesse)
  setValueIfExists("visibilite", fne.visibilite)
  setValueIfExists("nebulosite", fne.nebulosite)
  setValueIfExists("precipitation", fne.precipitation)
  setValueIfExists("autres_phenomenes", fne.autres_phenomenes)

  // Section 5: Matériel, installation ou équipement
  setRadioValue("evt_implique_installation_équipement", fne.evt_implique_installation_équipement)
  setValueIfExists("type_installation_équipement", fne.type_installation_équipement)
  setValueIfExists(
    "nom_compagnie_assistance_organisme_exploitant_véhicule",
    fne.nom_compagnie_assistance_organisme_exploitant_véhicule,
  )
  setRadioValue("evt_implique_véhicule_materiel_assistance_sol", fne.evt_implique_véhicule_materiel_assistance_sol)
  setValueIfExists("type_materiel_véhicule", fne.type_materiel_véhicule)

  // Section 6: Description de l'événement
  setValueIfExists("description_evt", fne.description_evt)

  // Set the statut field (admin specific)
  setValueIfExists("statut", fne.statut)

  // Add a hidden input for the FNE ID to submit with the form
  const form = document.querySelector("form")
  let hiddenInput = document.getElementById("fne_id")
  if (!hiddenInput) {
    hiddenInput = document.createElement("input")
    hiddenInput.type = "hidden"
    hiddenInput.id = "fne_id"
    hiddenInput.name = "fne_id"
    form.appendChild(hiddenInput)
  }
  hiddenInput.value = fne.fne_id

  // Update form action to indicate this is an update
  form.action = "/auth/updateFNEAdmin"

  // Update submit button text
  const submitButton = document.querySelector(".submit-button")
  if (submitButton) {
    submitButton.innerHTML = '<i class="fas fa-save"></i> Mettre à jour'
  }

  // Show notification that we're in edit mode
  const notification = document.getElementById("notification")
  notification.innerHTML = "<span>Vous êtes en train de modifier la FNE #" + fne.fne_id + "</span>"
  notification.style.display = "block"
  notification.classList.add("blue")

  // Open all sections for easier editing
  const sectionHeaders = document.querySelectorAll(".section-header")
  sectionHeaders.forEach((header) => {
    if (!header.classList.contains("active")) {
      toggleSection(header)
    }
  })
}
