// Variables globales
let currentPage = 1
let totalPages = 1
let usersData = []
let filteredData = []
let currentUserId = null
let isEditMode = false

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Charger les données depuis l'API
  loadUsersData()

  // Configurer les écouteurs d'événements
  setupEventListeners()
})

// Fonction pour charger les données des utilisateurs
function loadUsersData() {
  // Afficher un indicateur de chargement
  const tableBody = document.querySelector("#users-table tbody")
  tableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 30px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #76a4d6; margin-bottom: 10px;"></i>
                <p>Chargement des utilisateurs...</p>
            </td>
        </tr>
    `

  // Faire une requête AJAX pour récupérer les utilisateurs
  fetch("/auth/api/users")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des utilisateurs")
      }
      return response.json()
    })
    .then((data) => {
      usersData = data
      filteredData = [...usersData]
      totalPages = Math.ceil(filteredData.length / 10)

      // Afficher les données
      renderTable()
      updatePagination()
    })
    .catch((error) => {
      console.error("Erreur:", error)
      tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;"></i>
                        <p>Erreur lors du chargement des utilisateurs. Veuillez réessayer.</p>
                        <button onclick="loadUsersData()" class="btn btn-primary">Réessayer</button>
                    </td>
                </tr>
            `
    })
}

// Fonction pour configurer les écouteurs d'événements
function setupEventListeners() {
  // Recherche
  document.getElementById("searchBtn").addEventListener("click", () => {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase()
    filterData(searchTerm)
  })

  document.getElementById("searchInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      const searchTerm = e.target.value.toLowerCase()
      filterData(searchTerm)
    }
  })

  // Filtres
  document.getElementById("filterRole").addEventListener("change", applyFilters)
  document.getElementById("filterAeroport").addEventListener("change", applyFilters)

  // Pagination
  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      renderTable()
      updatePagination()
    }
  })

  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++
      renderTable()
      updatePagination()
    }
  })

  // Bouton d'ajout d'utilisateur
  document.getElementById("addUserBtn").addEventListener("click", () => {
    openAddUserModal()
  })

  // Bouton de sauvegarde dans le modal
  document.getElementById("saveUserBtn").addEventListener("click", saveUser)

  // Vérification de la force du mot de passe
  document.getElementById("motDePasse").addEventListener("input", checkPasswordStrength)

  // Bouton de confirmation de suppression
  document.getElementById("confirmDeleteBtn").addEventListener("click", deleteUser)
}

// Fonction pour filtrer les données
function filterData(searchTerm) {
  if (!searchTerm) {
    filteredData = [...usersData]
  } else {
    filteredData = usersData.filter((user) => {
      return (
        user.id.toString().includes(searchTerm) ||
        user.nom.toLowerCase().includes(searchTerm) ||
        user.prenom.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.matricule.toLowerCase().includes(searchTerm) ||
        user.aeroport.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
      )
    })
  }

  applyFilters()
}

// Fonction pour appliquer les filtres
function applyFilters() {
  const roleFilter = document.getElementById("filterRole").value
  const aeroportFilter = document.getElementById("filterAeroport").value

  let tempData = [...filteredData]

  if (roleFilter) {
    tempData = tempData.filter((user) => user.role === roleFilter)
  }

  if (aeroportFilter) {
    tempData = tempData.filter((user) => user.aeroport === aeroportFilter)
  }

  filteredData = tempData
  currentPage = 1
  totalPages = Math.ceil(filteredData.length / 10)

  renderTable()
  updatePagination()
}

// Fonction pour afficher les données dans le tableau
function renderTable() {
  const tableBody = document.querySelector("#users-table tbody")
  tableBody.innerHTML = ""

  const startIndex = (currentPage - 1) * 10
  const endIndex = Math.min(startIndex + 10, filteredData.length)

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
          <tr>
              <td colspan="8" style="text-align: center; padding: 30px;">
                  <i class="fas fa-search" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
                  <p>Aucun utilisateur trouvé. Veuillez modifier vos critères de recherche.</p>
              </td>
          </tr>
      `
    return
  }

  for (let i = startIndex; i < endIndex; i++) {
    const user = filteredData[i]

    // Déterminer la classe du badge en fonction du rôle
    let roleClass = ""
    let roleDisplay = ""
    switch (user.role.toLowerCase()) {
      case "admin":
        roleClass = "role-admin"
        roleDisplay = "Admin"
        break
      case "sml":
        roleClass = "role-utilisateur"
        roleDisplay = "SML"
        break
      default:
        roleClass = "role-validateur"
        roleDisplay = user.role
        break
    }

    // Formater l'affichage de l'aéroport
    const aeroportMap = {
      "Tunis-Carthage (TUN)": "AITC: Aéroport International Tunis Carthage",
      "Djerba-Zarzis (DJE)": "AIDZ: Aéroport International Djerba Zarzis",
      "Monastir Habib Bourguiba (MIR)": "AIMHB: Aéroport International Monastir Habib Bourguiba",
      "Sfax-Thyna (SFA)": "AIST: Aéroport International Sfax Thyna",
      "Tozeur-Nefta (TOE)": "AITN: Aéroport International Tozeur Nefta",
      "Tabarka(TBJ)": "AITA: Aéroport International Tabarka Aindraham",
      "Gafsa (GAF)": "AIGK: Aéroport International Gafsa Ksar",
      "Gabès-Matmata (GAE)": "AIGM: Aéroport International Gabès Matmata",
      "Enfidha (NBE)": "AIEH: Aéroport International Enfidha Hammamet",
    }

    const aeroportDisplay = aeroportMap[user.aeroport] || user.aeroport

    const row = document.createElement("tr")
    row.innerHTML = `
          <td>${user.id}</td>
          <td>${user.nom}</td>
          <td>${user.prenom}</td>
          <td>${user.email}</td>
          <td>${user.matricule}</td>
          <td>${aeroportDisplay}</td>
          <td><span class="role-badge ${roleClass}">${roleDisplay}</span></td>
          <td>
              <div class="action-buttons">
                  <button class="btn btn-warning" onclick="editUser(${user.id})">
                      <i class="fas fa-edit"></i> Modifier
                  </button>
                  <button class="btn btn-danger" onclick="confirmDeleteUser(${user.id})">
                      <i class="fas fa-trash"></i> Supprimer
                  </button>
              </div>
          </td>
      `

    tableBody.appendChild(row)
  }
}

// Fonction pour mettre à jour la pagination
function updatePagination() {
  document.getElementById("pageInfo").textContent = `Page ${currentPage} sur ${totalPages || 1}`

  document.getElementById("prevPage").disabled = currentPage <= 1
  document.getElementById("nextPage").disabled = currentPage >= totalPages
}

// Fonction pour ouvrir le modal d'ajout d'utilisateur
function openAddUserModal() {
  isEditMode = false
  currentUserId = null

  // Réinitialiser le formulaire
  document.getElementById("userForm").reset()
  document.getElementById("userId").value = ""

  // Mettre à jour le titre du modal
  document.getElementById("modalTitle").textContent = "Ajouter un utilisateur"

  // Afficher les champs de mot de passe comme requis
  document.getElementById("passwordLabel").innerHTML = 'Mot de passe <span class="required">*</span>'
  document.getElementById("confirmPasswordLabel").innerHTML =
    'Confirmer le mot de passe <span class="required">*</span>'
  document.getElementById("motDePasse").setAttribute("required", "required")
  document.getElementById("confirmMotDePasse").setAttribute("required", "required")

  // Cacher l'indicateur de force du mot de passe
  document.getElementById("passwordStrength").style.display = "none"

  // Afficher le modal
  document.getElementById("userModal").style.display = "block"
}

// Fonction pour éditer un utilisateur
function editUser(userId) {
  isEditMode = true
  currentUserId = userId

  // Afficher un indicateur de chargement dans le modal
  document.getElementById("modalTitle").textContent = "Chargement..."
  document.getElementById("userModal").style.display = "block"

  // Récupérer les données de l'utilisateur
  fetch(`/auth/api/users/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données de l'utilisateur")
      }
      return response.json()
    })
    .then((user) => {
      // Remplir le formulaire avec les données de l'utilisateur
      document.getElementById("userId").value = user.id
      document.getElementById("nom").value = user.nom
      document.getElementById("prenom").value = user.prenom
      document.getElementById("email").value = user.email
      document.getElementById("matricule").value = user.matricule
      document.getElementById("aeroport").value = user.aeroport
      document.getElementById("role").value = user.role

      // Vider les champs de mot de passe et les rendre optionnels
      document.getElementById("motDePasse").value = ""
      document.getElementById("confirmMotDePasse").value = ""
      document.getElementById("passwordLabel").innerHTML =
        "Mot de passe <small>(laisser vide pour ne pas modifier)</small>"
      document.getElementById("confirmPasswordLabel").innerHTML = "Confirmer le mot de passe"
      document.getElementById("motDePasse").removeAttribute("required")
      document.getElementById("confirmMotDePasse").removeAttribute("required")

      // Cacher l'indicateur de force du mot de passe
      document.getElementById("passwordStrength").style.display = "none"

      // Mettre à jour le titre du modal
      document.getElementById("modalTitle").textContent = "Modifier un utilisateur"
    })
    .catch((error) => {
      console.error("Erreur:", error)
      alert("Erreur lors de la récupération des données de l'utilisateur. Veuillez réessayer.")
      closeModal()
    })
}

// Fonction pour sauvegarder un utilisateur (ajout ou modification)
function saveUser() {
  // Récupérer les valeurs du formulaire
  const userId = document.getElementById("userId").value
  const nom = document.getElementById("nom").value.trim()
  const prenom = document.getElementById("prenom").value.trim()
  const email = document.getElementById("email").value.trim()
  const matricule = document.getElementById("matricule").value.trim()
  const aeroport = document.getElementById("aeroport").value
  const role = document.getElementById("role").value
  const motDePasse = document.getElementById("motDePasse").value
  const confirmMotDePasse = document.getElementById("confirmMotDePasse").value

  // Validation de base
  if (!nom || !prenom || !email || !matricule || !aeroport || !role) {
    alert("Veuillez remplir tous les champs obligatoires.")
    return
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    alert("Veuillez entrer une adresse email valide.")
    return
  }

  // Validation du mot de passe en mode ajout
  if (!isEditMode && (!motDePasse || motDePasse.length < 8)) {
    alert("Le mot de passe doit contenir au moins 8 caractères.")
    return
  }

  // Vérifier que les mots de passe correspondent
  if (motDePasse && motDePasse !== confirmMotDePasse) {
    alert("Les mots de passe ne correspondent pas.")
    return
  }

  // Préparer les données à envoyer
  const userData = {
    nom,
    prenom,
    email,
    matricule,
    aeroport,
    role,
  }

  // Ajouter le mot de passe uniquement s'il a été saisi
  if (motDePasse) {
    userData.motDePasse = motDePasse
  }

  // Ajouter l'ID en mode édition
  if (isEditMode) {
    userData.id = Number.parseInt(userId)
  }

  // Désactiver le bouton de sauvegarde pendant l'envoi
  const saveButton = document.getElementById("saveUserBtn")
  saveButton.disabled = true
  saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...'

  // Envoyer les données à l'API
  const url = isEditMode ? `/auth/api/users/${userId}` : "/auth/api/users"
  const method = isEditMode ? "PUT" : "POST"

  fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(data.error || "Erreur lors de l'enregistrement de l'utilisateur")
          })
          .catch(() => {
            throw new Error("Erreur lors de l'enregistrement de l'utilisateur")
          })
      }
      return response.json()
    })
    .then((data) => {
      // Mettre à jour les données locales
      if (isEditMode) {
        // Mettre à jour l'utilisateur existant
        const userIndex = usersData.findIndex((u) => u.id === Number.parseInt(userId))
        if (userIndex !== -1) {
          usersData[userIndex] = data
        }
      } else {
        // Ajouter le nouvel utilisateur
        usersData.push(data)
      }

      // Mettre à jour les données filtrées
      filteredData = [...usersData]
      applyFilters()

      // Afficher un message de succès
      alert(`L'utilisateur ${data.prenom} ${data.nom} a été ${isEditMode ? "mis à jour" : "ajouté"} avec succès.`)

      // Fermer le modal
      closeModal()
    })
    .catch((error) => {
      console.error("Erreur:", error)
      alert(error.message || "Erreur lors de l'enregistrement de l'utilisateur. Veuillez réessayer.")

      // Réactiver le bouton de sauvegarde
      saveButton.disabled = false
      saveButton.innerHTML = "Enregistrer"
    })
}

// Fonction pour confirmer la suppression d'un utilisateur
function confirmDeleteUser(userId) {
  currentUserId = userId

  const user = usersData.find((u) => u.id === userId)
  if (!user) return

  // Mettre à jour le texte de confirmation
  document.getElementById("deleteUserName").textContent = `${user.prenom} ${user.nom}`

  // Afficher le modal de confirmation
  document.getElementById("confirmDeleteModal").style.display = "block"
}

// Fonction pour supprimer un utilisateur
function deleteUser() {
  if (!currentUserId) return

  // Désactiver le bouton de suppression pendant l'envoi
  const deleteButton = document.getElementById("confirmDeleteBtn")
  deleteButton.disabled = true
  deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suppression...'

  // Envoyer la requête de suppression
  fetch(`/auth/api/users/${currentUserId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'utilisateur")
      }
      return response.json()
    })
    .then((data) => {
      // Supprimer l'utilisateur des données locales
      usersData = usersData.filter((user) => user.id !== currentUserId)

      // Mettre à jour les données filtrées
      filteredData = filteredData.filter((user) => user.id !== currentUserId)

      // Recalculer le nombre de pages
      totalPages = Math.ceil(filteredData.length / 10)

      // Ajuster la page courante si nécessaire
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages
      }

      // Mettre à jour l'affichage
      renderTable()
      updatePagination()

      // Fermer le modal de confirmation
      closeConfirmModal()

      // Afficher un message de confirmation
      alert("L'utilisateur a été supprimé avec succès.")
    })
    .catch((error) => {
      console.error("Erreur:", error)
      alert("Erreur lors de la suppression de l'utilisateur. Veuillez réessayer.")

      // Réactiver le bouton de suppression
      deleteButton.disabled = false
      deleteButton.innerHTML = "Supprimer"
    })
}

// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("userModal").style.display = "none"
  currentUserId = null
  isEditMode = false
}

// Fonction pour fermer le modal de confirmation
function closeConfirmModal() {
  document.getElementById("confirmDeleteModal").style.display = "none"
  currentUserId = null
}

// Fonction pour basculer la visibilité du mot de passe
function togglePasswordVisibility() {
  const passwordInput = document.getElementById("motDePasse")
  const icon = document.querySelector(".toggle-password i")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    icon.classList.remove("fa-eye")
    icon.classList.add("fa-eye-slash")
  } else {
    passwordInput.type = "password"
    icon.classList.remove("fa-eye-slash")
    icon.classList.add("fa-eye")
  }
}

// Fonction pour basculer la visibilité de la confirmation du mot de passe
function toggleConfirmPasswordVisibility() {
  const passwordInput = document.getElementById("confirmMotDePasse")
  const icon = document.querySelector(".toggle-password:nth-of-type(2) i")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    icon.classList.remove("fa-eye")
    icon.classList.add("fa-eye-slash")
  } else {
    passwordInput.type = "password"
    icon.classList.remove("fa-eye-slash")
    icon.classList.add("fa-eye")
  }
}

// Fonction pour vérifier la force du mot de passe
function checkPasswordStrength() {
  const password = document.getElementById("motDePasse").value
  const strengthMeter = document.getElementById("strengthMeter")
  const strengthText = document.getElementById("strengthText")
  const passwordStrength = document.getElementById("passwordStrength")

  if (password.length === 0) {
    passwordStrength.style.display = "none"
    return
  }

  passwordStrength.style.display = "block"

  // Réinitialiser les classes
  strengthMeter.className = "strength-meter-fill"

  // Calculer la force du mot de passe
  let strength = 0

  // Longueur
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1

  // Complexité
  if (/[A-Z]/.test(password)) strength += 1
  if (/[a-z]/.test(password)) strength += 1
  if (/[0-9]/.test(password)) strength += 1
  if (/[^A-Za-z0-9]/.test(password)) strength += 1

  // Afficher la force
  if (strength <= 2) {
    strengthMeter.classList.add("strength-weak")
    strengthText.textContent = "Faible"
    strengthText.style.color = "#ef4444"
  } else if (strength <= 4) {
    strengthMeter.classList.add("strength-medium")
    strengthText.textContent = "Moyen"
    strengthText.style.color = "#f59e0b"
  } else if (strength <= 6) {
    strengthMeter.classList.add("strength-good")
    strengthText.textContent = "Bon"
    strengthText.style.color = "#3b82f6"
  } else {
    strengthMeter.classList.add("strength-strong")
    strengthText.textContent = "Fort"
    strengthText.style.color = "#10b981"
  }
}

// Fermer les modals si l'utilisateur clique en dehors
window.onclick = (event) => {
  const userModal = document.getElementById("userModal")
  const confirmModal = document.getElementById("confirmDeleteModal")

  if (event.target === userModal) {
    closeModal()
  }

  if (event.target === confirmModal) {
    closeConfirmModal()
  }
}

