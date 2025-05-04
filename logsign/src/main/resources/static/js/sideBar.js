// Script pour améliorer l'interactivité du menu latéral

document.addEventListener("DOMContentLoaded", () => {
    // Ajouter la classe active à l'élément de menu correspondant à la page actuelle
    highlightCurrentPage()
  
    // Ajouter des badges de notification (exemple)
    addNotificationBadges()
  
    // Ajouter des séparateurs entre les groupes de menu
    addMenuSeparators()
  })
  
  // Fonction pour mettre en évidence la page actuelle dans le menu
  function highlightCurrentPage() {
    const currentPath = window.location.pathname
    const menuItems = document.querySelectorAll(".sidebar-item")
  
    menuItems.forEach((item) => {
      const link = item.querySelector("a")
      if (link && link.getAttribute("href") && currentPath.includes(link.getAttribute("href"))) {
        item.classList.add("active")
      }
    })
  }
  
  
  // Fonction pour ajouter des séparateurs entre les groupes de menu
  function addMenuSeparators() {
    // Ajouter un séparateur après le 3ème élément (avant les statistiques)
    const menuItems = document.querySelectorAll(".sidebar-item")
    if (menuItems.length >= 4) {
      const separator = document.createElement("div")
      separator.className = "sidebar-separator"
      menuItems[3].parentNode.insertBefore(separator, menuItems[3])
    }
  
    // Ajouter un séparateur avant le dernier élément (déconnexion)
    if (menuItems.length >= 2) {
      const separator = document.createElement("div")
      separator.className = "sidebar-separator"
      menuItems[menuItems.length - 1].parentNode.insertBefore(separator, menuItems[menuItems.length - 1])
    }
  }
  
  // Fonction pour basculer l'affichage du menu sur mobile
  function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar")
    const overlay = document.querySelector(".sidebar-overlay")
  
    sidebar.classList.toggle("active")
    document.body.classList.toggle("sidebar-open")
  
    if (sidebar.classList.contains("active")) {
      overlay.style.display = "block"
      setTimeout(() => {
        overlay.style.opacity = "1"
      }, 10)
    } else {
      overlay.style.opacity = "0"
      setTimeout(() => {
        overlay.style.display = "none"
      }, 300)
    }
  }
  
  // Fermer le menu lorsqu'on clique sur un lien (sur mobile)
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 992 && e.target.closest(".sidebar-link")) {
      toggleSidebar()
    }
  })
  
  // Fermer le menu lorsqu'on clique sur l'overlay
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("sidebar-overlay")) {
      toggleSidebar()
    }
  })
  