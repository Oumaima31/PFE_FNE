// Fonction pour basculer l'affichage de la navbar sur mobile
function toggleNavbar() {
    const navbarContainer = document.querySelector(".navbar-container")
    navbarContainer.classList.toggle("active")
  }
  
  // Fonction pour mettre à jour les options REF GNE en fonction du type d'événement
  function updateRefGneNumber() {
    const type_evt = document.getElementById("type_evt").value
    const REF_GNE = document.getElementById("REF_GNE")
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
  
    // Afficher la notification
    notificationText.textContent = message
    notification.className = `notification ${colorClass}` // Appliquer la classe de couleur
    notification.style.display = "block"
  
    // Masquer la notification après 3 secondes
    setTimeout(() => {
      notification.style.display = "none"
    }, 3000)
  }
  
  // Pour date et heure affiche automatiquement
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
  
  // Pour la météo
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
  
      // Affichage des valeurs
      document.getElementById("meteo-icon").innerHTML =
        `<img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="Météo">`
      document.getElementById("meteo-temp").textContent = temperature
      document.getElementById("meteo-description").textContent = description
    } catch (error) {
      console.error("Erreur : ", error)
      document.getElementById("meteo").innerHTML = `<span style="color:red;">Météo indisponible(${error.message})</span>`
    }
  }
  
  // Navigation entre les sections du formulaire
  function nextSection(currentStep) {
    // Masquer la section actuelle
    const currentSection = document.querySelector(`.form-section[data-section="${currentStep}"]`)
    currentSection.classList.remove('active')
    
    // Afficher la section suivante
    const nextStep = currentStep + 1
    const nextSection = document.querySelector(`.form-section[data-section="${nextStep}"]`)
    nextSection.classList.add('active')
    
    // Mettre à jour la barre de progression
    updateProgressBar(nextStep)
    
    // Si c'est la dernière section, générer le résumé
    if (nextStep === 7) {
      generateFormSummary()
    }
    
    // Faire défiler vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  function prevSection(currentStep) {
    // Masquer la section actuelle
    const currentSection = document.querySelector(`.form-section[data-section="${currentStep}"]`)
    currentSection.classList.remove('active')
    
    // Afficher la section précédente
    const prevStep = currentStep - 1
    const prevSection = document.querySelector(`.form-section[data-section="${prevStep}"]`)
    prevSection.classList.add('active')
    
    // Mettre à jour la barre de progression
    updateProgressBar(prevStep)
    
    // Faire défiler vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  function updateProgressBar(activeStep) {
    // Réinitialiser toutes les étapes
    const steps = document.querySelectorAll('.progress-step')
    steps.forEach(step => {
      step.classList.remove('active', 'completed')
    })
    
    // Marquer les étapes terminées et l'étape active
    steps.forEach(step => {
      const stepNumber = parseInt(step.getAttribute('data-step'))
      if (stepNumber < activeStep) {
        step.classList.add('completed')
      } else if (stepNumber === activeStep) {
        step.classList.add('active')
      }
    })
  }
  
  // Générer un résumé du formulaire
  function generateFormSummary() {
    const form = document.getElementById('fneForm')
    const summaryDiv = document.getElementById('formSummary')
    
    // Récupérer les valeurs importantes
    const typeEvt = document.getElementById('type_evt').value
    const refGne = document.getElementById('REF_GNE').value
    const date = document.getElementById('Date').value
    const lieu = document.getElementById('Lieu_EVT').value
    const description = document.getElementById('description_evt').value
    
    // Créer le HTML du résumé
    let summaryHTML = `
      <div class="summary-item">
        <strong>Type d'événement:</strong> ${typeEvt || 'Non spécifié'}
      </div>
      <div class="summary-item">
        <strong>Référence GNE:</strong> ${refGne || 'Non spécifié'}
      </div>
      <div class="summary-item">
        <strong>Date:</strong> ${date || 'Non spécifié'}
      </div>
      <div class="summary-item">
        <strong>Lieu:</strong> ${lieu || 'Non spécifié'}
      </div>
      <div class="summary-item">
        <strong>Description:</strong> ${description ? description.substring(0, 100) + '...' : 'Non spécifié'}
      </div>
    `
    
    summaryDiv.innerHTML = summaryHTML
  }
  
  // Basculer l'affichage des sections
  document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la première section comme active
    updateProgressBar(1)
    
    // Ajouter des écouteurs d'événements pour les en-têtes de section
    const sectionHeaders = document.querySelectorAll('.section-header')
    sectionHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const section = this.parentElement
        const content = section.querySelector('.section-content')
        const toggle = this.querySelector('.section-toggle i')
        
        // Vérifier si la section est déjà active
        const isActive = section.classList.contains('active')
        
        // Fermer toutes les sections
        document.querySelectorAll('.form-section').forEach(s => {
          s.classList.remove('active')
          s.querySelector('.section-toggle i').className = 'fas fa-chevron-down'
        })
        
        // Si la section n'était pas active, l'ouvrir
        if (!isActive) {
          section.classList.add('active')
          toggle.className = 'fas fa-chevron-up'
        }
      })
    })
  })