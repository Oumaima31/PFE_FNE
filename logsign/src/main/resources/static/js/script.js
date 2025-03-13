// Fonction pour basculer l'affichage de la navbar sur mobile
function toggleNavbar() {
    const navbarContainer = document.querySelector(".navbar-container")
    navbarContainer.classList.toggle("active")
  }
  
  function updateRefGneNumber() {
    const type_evt = document.getElementById("type_evt").value
    const REF_GNE = document.getElementById("REF_GNE")
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
  
    // Afficher la notification
    notificationText.textContent = message
    notification.className = `notification ${colorClass}` // Appliquer la classe de couleur
    notification.style.display = "block"
  
    // Masquer la notification après 3 secondes
    setTimeout(() => {
      notification.style.display = "none"
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
  
  // Fonctions pour basculer entre les formulaires
  function showLogin() {
    document.getElementById("login-form-container").classList.add("active")
    document.getElementById("register-form-container").classList.remove("active")
    document.getElementById("login-tab").classList.add("active")
    document.getElementById("register-tab").classList.remove("active")
  }
  
  function showRegister() {
    document.getElementById("register-form-container").classList.add("active")
    document.getElementById("login-form-container").classList.remove("active")
    document.getElementById("register-tab").classList.add("active")
    document.getElementById("login-tab").classList.remove("active")
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
          notification.style.display = "none"
        }, 5000)
      }
    }
  
    // Initialiser le sélecteur de type d'événement
    const typeEvt = document.getElementById("type_evt")
    if (typeEvt && typeEvt.value) {
      updateRefGneNumber()
    }
  })
  
  // Pour le formulaire d'inscription
  if (document.getElementById("registrationForm")) {
    document.getElementById("registrationForm").addEventListener("submit", (event) => {
      event.preventDefault() // Empêche la soumission par défaut
  
      const nom = document.getElementById("nom").value
      const prenom = document.getElementById("prenom").value
      const email = document.getElementById("mail").value
      const matricule = document.getElementById("register-matricule").value
      const motDePasse = document.getElementById("register-motDePasse").value
      const aeroport = document.getElementById("airport").value
      const role = document.getElementById("role").value
  
      fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `nom=${nom}&prenom=${prenom}&email=${email}&role=${role}&matricule=${matricule}&motDePasse=${motDePasse}&aeroport=${aeroport}`,
      })
        .then((response) => {
          if (response.ok) {
            return response.text() // Lit la réponse textuelle
          } else {
            throw new Error("Erreur lors de l'inscription")
          }
        })
        .then((message) => {
          alert(message) // Affiche le message de succès
          showLogin() // Redirige vers la partie de connexion
        })
        .catch((error) => {
          console.error("Erreur:", error)
          alert(error.message) // Affiche un message d'erreur
        })
    })
  }
  
  