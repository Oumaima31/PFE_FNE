// Variables globales
let chatbotOpen = false

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Chatbot script loaded")

  // Ajouter un message de bienvenue
  setTimeout(() => {
    addBotMessage(
      "Bonjour ! Je suis l'assistant GNE, spécialisé dans le Guide de Notification d'Événements. Je peux vous aider à trouver des informations sur les différents types d'événements et leurs références. Comment puis-je vous aider aujourd'hui ?",
    )

    // Suggestions de démarrage
    addSuggestions([
      "Qu'est-ce que EVT/01 ?",
      "Parlez-moi des incidents liés au givre",
      "Quels événements concernent les lasers ?",
      "Que signifie ING/08 ?",
    ])
  }, 500)
})

// Fonction pour basculer l'affichage du chatbot
function toggleChatbot(event) {
  console.log("Toggle chatbot called")
  if (event) {
    event.stopPropagation()
  }

  const chatbotBody = document.getElementById("chatbot-body")
  const minimizeBtn = document.getElementById("minimize-btn")

  if (chatbotBody.style.display === "none" || chatbotBody.style.display === "") {
    chatbotBody.style.display = "flex"
    minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>'
    chatbotOpen = true

    // Faire défiler jusqu'au bas du chat
    const chatLog = document.getElementById("chat-log")
    chatLog.scrollTop = chatLog.scrollHeight

    // Mettre le focus sur le champ de saisie
    document.getElementById("chat-input").focus()
  } else {
    chatbotBody.style.display = "none"
    minimizeBtn.innerHTML = '<i class="fas fa-plus"></i>'
    chatbotOpen = false
  }
}

// Modifier la fonction sendQuestion pour améliorer la gestion de l'encodage
function sendQuestion() {
  console.log("Send question called")
  const chatInput = document.getElementById("chat-input")
  const question = chatInput.value.trim()

  if (question === "") return

  // Ajouter la question au chat
  addUserMessage(question)

  // Effacer le champ de saisie
  chatInput.value = ""

  // Afficher l'indicateur de chargement
  showTypingIndicator()

  // Envoyer la question au serveur avec encodage UTF-8 explicite
  fetch("/api/chatbot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json;charset=UTF-8",
    },
    body: JSON.stringify({
      question: question,
    }),
  })
    .then((response) => {
      console.log("Response received:", response.status)
      if (!response.ok) {
        throw new Error("Erreur réseau")
      }
      return response.text() // Utiliser text() au lieu de json() pour voir le contenu brut
    })
    .then((rawText) => {
      console.log("Raw response text:", rawText)

      // Essayer de parser le JSON manuellement
      let data
      try {
        data = JSON.parse(rawText)
        console.log("Parsed data:", data)
      } catch (e) {
        console.error("Error parsing JSON:", e)
        throw new Error("Réponse invalide du serveur")
      }

      // Masquer l'indicateur de chargement
      hideTypingIndicator()

      // Vérifier si la réponse contient des caractères mal encodés et les corriger
      let answer = data.answer || "Désolé, je n'ai pas pu traiter votre demande."

      // Correction des caractères mal encodés courants en français
      answer = answer
        .replace(/RÚfÚrence/g, "Référence")
        .replace(/ÚvÚnement/g, "événement")
        .replace(/Ú/g, "é")
        .replace(/È/g, "è")
        .replace(/À/g, "à")
        .replace(/Ç/g, "ç")
        .replace(/dÆoiseau/g, "d'oiseau")
        .replace(/dÚfaut/g, "défaut")
        .replace(/systÞme/g, "système")
        .replace(/rÚglementaire/g, "réglementaire")
        .replace(/provoquÚ/g, "provoqué")
        .replace(/Þ/g, "è")
        .replace(/Æ/g, "'")

      console.log("Processed answer:", answer)

      // Ajouter la réponse au chat avec effet de frappe
      typeWriterEffect(answer)

      // Ajouter des suggestions contextuelles
      addContextualSuggestions(question, answer)
    })
    .catch((error) => {
      console.error("Error in fetch:", error)
      // Masquer l'indicateur de chargement
      hideTypingIndicator()

      // Afficher un message d'erreur
      addBotMessage("Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.")
    })
}

// Fonction pour ajouter un message utilisateur au chat
function addUserMessage(message) {
  console.log("Adding user message:", message)
  const chatLog = document.getElementById("chat-log")
  const messageElement = document.createElement("div")
  messageElement.className = "chat-message user-message"
  messageElement.innerHTML = `
    <div class="message-content">
      <p>${escapeHtml(message)}</p>
    </div>
  `
  chatLog.appendChild(messageElement)

  // Faire défiler jusqu'au bas du chat
  chatLog.scrollTop = chatLog.scrollHeight
}

// Fonction pour ajouter un message du bot au chat
function addBotMessage(message) {
  console.log("Adding bot message:", message)
  const chatLog = document.getElementById("chat-log")
  const messageElement = document.createElement("div")
  messageElement.className = "chat-message bot-message"

  // Convertir les sauts de ligne en balises <br>
  const formattedMessage = message.replace(/\n/g, "<br>")

  messageElement.innerHTML = `
    <div class="bot-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <p>${formattedMessage}</p>
    </div>
  `
  chatLog.appendChild(messageElement)

  // Faire défiler jusqu'au bas du chat
  chatLog.scrollTop = chatLog.scrollHeight
}

// Fonction pour afficher l'indicateur de chargement
function showTypingIndicator() {
  console.log("Showing typing indicator")
  const chatLog = document.getElementById("chat-log")
  const typingIndicator = document.createElement("div")
  typingIndicator.className = "chat-message bot-message typing-indicator"
  typingIndicator.id = "typing-indicator"
  typingIndicator.innerHTML = `
    <div class="bot-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `
  chatLog.appendChild(typingIndicator)

  // Faire défiler jusqu'au bas du chat
  chatLog.scrollTop = chatLog.scrollHeight
}

// Fonction pour masquer l'indicateur de chargement
function hideTypingIndicator() {
  console.log("Hiding typing indicator")
  const typingIndicator = document.getElementById("typing-indicator")
  if (typingIndicator) {
    typingIndicator.remove()
  }
}

// Fonction pour l'effet de frappe
// Modifier la fonction typeWriterEffect pour résoudre le problème d'ID dupliqué
function typeWriterEffect(text) {
  console.log("Starting typewriter effect with text:", text)
  // Créer l'élément de message
  const chatLog = document.getElementById("chat-log")
  const messageElement = document.createElement("div")
  messageElement.className = "chat-message bot-message"

  // Générer un ID unique pour l'élément de texte
  const uniqueId = "typing-text-" + Date.now()

  messageElement.innerHTML = `
    <div class="bot-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <p id="${uniqueId}"></p>
    </div>
  `
  chatLog.appendChild(messageElement)

  // Faire défiler jusqu'au bas du chat
  chatLog.scrollTop = chatLog.scrollHeight

  // Convertir les sauts de ligne en tableau
  const textParts = text.split("\n")
  let partIndex = 0
  let charIndex = 0
  const typingText = document.getElementById(uniqueId)

  // Fonction pour taper le texte caractère par caractère
  function typeNextChar() {
    if (partIndex < textParts.length) {
      if (charIndex < textParts[partIndex].length) {
        typingText.innerHTML += escapeHtml(textParts[partIndex].charAt(charIndex))
        charIndex++
        chatLog.scrollTop = chatLog.scrollHeight
        setTimeout(typeNextChar, 10) // Vitesse de frappe
      } else {
        if (partIndex < textParts.length - 1) {
          typingText.innerHTML += "<br>"
        }
        partIndex++
        charIndex = 0
        setTimeout(typeNextChar, 50) // Pause entre les lignes
      }
    }
  }

  // Commencer l'effet de frappe
  typeNextChar()
}

// Fonction pour échapper les caractères HTML
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// Fonction pour ajouter des suggestions
function addSuggestions(suggestions) {
  console.log("Adding suggestions:", suggestions)
  const chatLog = document.getElementById("chat-log")
  const suggestionsElement = document.createElement("div")
  suggestionsElement.className = "chat-suggestions"

  let suggestionsHtml = ""
  for (const suggestion of suggestions) {
    suggestionsHtml += `<button class="suggestion-btn" onclick="useSuggestion('${suggestion.replace(/'/g, "\\'")}')">${suggestion}</button>`
  }

  suggestionsElement.innerHTML = suggestionsHtml
  chatLog.appendChild(suggestionsElement)

  // Faire défiler jusqu'au bas du chat
  chatLog.scrollTop = chatLog.scrollHeight
}

// Fonction pour utiliser une suggestion
function useSuggestion(suggestion) {
  console.log("Using suggestion:", suggestion)
  const chatInput = document.getElementById("chat-input")
  chatInput.value = suggestion
  sendQuestion()
}

// Fonction pour ajouter des suggestions contextuelles
function addContextualSuggestions(question, answer) {
  console.log("Adding contextual suggestions based on:", question, answer)
  // Analyser la question et la réponse pour générer des suggestions pertinentes
  const suggestions = []

  // Extraire les références d'événements de la réponse
  const refPattern = /(ACCID|ING|INC|EVT)\/\d+/g
  const matches = answer.match(refPattern)
  const references = matches ? [...new Set(matches)] : [] // Éliminer les doublons

  // Si une référence a été trouvée, suggérer des questions connexes
  if (references.length > 0) {
    const ref = references[0]
    const prefix = ref.split("/")[0]

    // Suggérer d'autres événements du même type
    if (prefix === "EVT") {
      suggestions.push("Autres événements techniques")
    } else if (prefix === "ING") {
      suggestions.push("Autres incidents graves")
    } else if (prefix === "INC") {
      suggestions.push("Autres incidents")
    } else if (prefix === "ACCID") {
      suggestions.push("Autres accidents")
    }
  }

  // Extraire des mots-clés de la question et de la réponse
  const keywords = extractKeywords(question + " " + answer)

  // Générer des suggestions basées sur les mots-clés
  for (const keyword of keywords) {
    if (keyword === "givre" || keyword === "glace") {
      suggestions.push("Événements liés au givre")
    } else if (keyword === "foudre" || keyword === "orage") {
      suggestions.push("Événements liés à la foudre")
    } else if (keyword === "laser" || keyword === "éblouissement") {
      suggestions.push("Incidents avec laser")
    } else if (keyword === "oiseau" || keyword === "volatile") {
      suggestions.push("Impact d'oiseau")
    } else if (keyword === "communication" || keyword === "radio") {
      suggestions.push("Problèmes de communication")
    } else if (keyword === "retard" || keyword === "délai") {
      suggestions.push("Événements liés aux retards")
    } else if (keyword === "déroutement") {
      suggestions.push("Qu'est-ce que EVT/10 ?")
    }
  }

  // Ajouter des suggestions générales si nécessaire
  if (suggestions.length < 2) {
    suggestions.push("Liste des événements techniques")
    suggestions.push("Différence entre incident et incident grave")
  }

  // Limiter à 3 suggestions maximum
  if (suggestions.length > 0) {
    addSuggestions(suggestions.slice(0, 3))
  }
}

// Fonction pour extraire des mots-clés d'un texte
function extractKeywords(text) {
  const keywords = []
  const importantWords = [
    "givre",
    "glace",
    "foudre",
    "orage",
    "laser",
    "éblouissement",
    "oiseau",
    "volatile",
    "communication",
    "radio",
    "retard",
    "délai",
    "déroutement",
    "détournement",
    "retour",
    "remise",
    "gaz",
    "incendie",
    "feu",
    "hydrocarbure",
    "carburant",
    "impact",
  ]

  const lowerText = text.toLowerCase()

  for (const word of importantWords) {
    if (lowerText.includes(word)) {
      keywords.push(word)
    }
  }

  return keywords
}

// Ajouter un gestionnaire d'événements pour la touche Entrée
document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chat-input")
  if (chatInput) {
    chatInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        sendQuestion()
      }
    })
  }
})
