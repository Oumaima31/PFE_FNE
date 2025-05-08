// Fonction pour mettre à jour la date et l'heure
function updateDateTime() {
    const now = new Date()
  
    // Format de la date: JJ/MM/AAAA
    const dateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    document.getElementById("current-date").textContent = now.toLocaleDateString("fr-FR", dateOptions)
  
    // Format de l'heure: HH:MM:SS
    const timeOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
    document.getElementById("current-time").textContent = now.toLocaleTimeString("fr-FR", timeOptions)
  }
  
  // Fonction pour récupérer les données météo
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
  
      // Choisir l'icône appropriée
      const weatherCode = data.weather[0].id
  
      if (weatherCode >= 200 && weatherCode < 300) {
        meteoIcon.innerHTML = '<i class="fas fa-bolt"></i>' // Orage
      } else if (weatherCode >= 300 && weatherCode < 500) {
        meteoIcon.innerHTML = '<i class="fas fa-cloud-rain"></i>' // Bruine
      } else if (weatherCode >= 500 && weatherCode < 600) {
        meteoIcon.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i>' // Pluie
      } else if (weatherCode >= 600 && weatherCode < 700) {
        meteoIcon.innerHTML = '<i class="fas fa-snowflake"></i>' // Neige
      } else if (weatherCode >= 700 && weatherCode < 800) {
        meteoIcon.innerHTML = '<i class="fas fa-smog"></i>' // Brouillard
      } else if (weatherCode === 800) {
        meteoIcon.innerHTML = '<i class="fas fa-sun"></i>' // Ciel dégagé
      } else {
        meteoIcon.innerHTML = '<i class="fas fa-cloud-sun"></i>' // Nuageux
      }
  
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
      document.getElementById("meteo-icon").innerHTML = '<i class="fas fa-exclamation-triangle"></i>'
      document.getElementById("meteo-temp").textContent = "--°C"
      document.getElementById("meteo-description").textContent = "Non disponible"
    }
  }
  
  // Toggle du menu sur mobile
  function toggleNavbar() {
    document.getElementById("navbar-menu").classList.toggle("active")
  }
  
  // Toggle du dropdown utilisateur
  function toggleUserDropdown() {
    const toggle = document.getElementById("user-dropdown-toggle")
    toggle.classList.toggle("active")
    document.getElementById("user-dropdown-menu").classList.toggle("show")
  }
  
  // Fonction pour afficher une notification
  function showNotification(message, type = "info") {
    const notification = document.getElementById("notification")
    const notificationMessage = document.getElementById("notification-message")
  
    // Définir le message
    notificationMessage.textContent = message
  
    // Définir le type (info, success, error, warning)
    notification.className = "notification"
    notification.classList.add(type)
    notification.classList.add("show")
  
    // Masquer après 5 secondes
    setTimeout(() => {
      notification.classList.remove("show")
    }, 5000)
  }
  
  // Fonction de déconnexion
  function logout() {
    fetch("/auth/logout", {
      method: "POST",
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          // Rediriger vers la page de login
          window.location.href = "/auth/index"
        } else {
          console.error("Échec de la déconnexion")
          window.location.href = "/auth/index" // Redirection même en cas d'erreur
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la déconnexion:", error)
        window.location.href = "/auth/index"
      })
  }
  
  // Initialisation
  document.addEventListener("DOMContentLoaded", () => {
    // Mettre à jour la date et l'heure immédiatement
    updateDateTime()
  
    // Mettre à jour la date et l'heure toutes les secondes
    setInterval(updateDateTime, 1000)
  
    // Récupérer les données météo
    fetchMeteo()
  
    // Récupérer les données météo toutes les 30 minutes
    setInterval(fetchMeteo, 30 * 60 * 1000)
  
    // Ajouter les écouteurs d'événements
    document.getElementById("navbar-toggle").addEventListener("click", toggleNavbar)
    document.getElementById("user-dropdown-toggle").addEventListener("click", toggleUserDropdown)
  
    // Fermer le dropdown si on clique ailleurs
    document.addEventListener("click", (event) => {
      const dropdown = document.getElementById("user-dropdown-menu")
      const toggle = document.getElementById("user-dropdown-toggle")
  
      if (!toggle.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove("show")
        toggle.classList.remove("active")
      }
    })
  
    // Afficher un message de bienvenue
    const userName = document.querySelector(".user-dropdown-toggle span").textContent
    showNotification(`Bienvenue, ${userName} ! Vous êtes connecté avec succès.`, "success")
  })
  