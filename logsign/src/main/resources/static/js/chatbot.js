function toggleChatbot(event) {
    if (event) {
        event.stopPropagation();
    }
    
    const body = document.getElementById("chatbot-body");
    const container = document.getElementById("chatbot-container");
    const header = document.getElementById("chatbot-header");
    
    if (body.style.display === "none") {
        body.style.display = "flex";
        container.style.boxShadow = "0 5px 25px rgba(0, 0, 0, 0.2)";
        header.style.borderRadius = "12px 12px 0 0";
        
        // Ajouter un message de bienvenue s'il n'y en a pas déjà un
        const chatLog = document.getElementById("chat-log");
        if (chatLog.innerHTML === "") {
            chatLog.innerHTML = `
                <div class="bot-message">
                    <div class="bot-response response-info">
                        <strong>Assistant GNE</strong>
                        <p>Bonjour ! Je suis votre assistant pour le Guide de Notification des Événements (GNE). Comment puis-je vous aider ?</p>
                        <p>Vous pouvez me poser des questions sur :</p>
                        <ul>
                            <li>L'événement d'une référence precises.</li>
                            <li>Les références spécifiques du GNE (ex: EVT/01)</li>
                            
                        </ul>
                    </div>
                </div>`;
        }
    } else {
        body.style.display = "none";
        container.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
        header.style.borderRadius = "12px";
    }
}

function sendQuestion() {
    const input = document.getElementById("chat-input");
    const question = input.value.trim();
    if (!question) return;

    const chatLog = document.getElementById("chat-log");
    
    // Ajouter le message de l'utilisateur
    chatLog.innerHTML += `
        <div class="user-message">
            ${escapeHtml(question)}
        </div>`;
    
    input.value = '';
    
    // Faire défiler vers le bas
    chatLog.scrollTop = chatLog.scrollHeight;
    
    // Afficher l'indicateur de chargement
    chatLog.innerHTML += `
        <div id="loading" class="bot-message">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>`;
    
    chatLog.scrollTop = chatLog.scrollHeight;

    // Envoyer la requête au serveur
    fetch("/api/chatbot", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(question)
    })
    .then(response => response.text())
    .then(response => {
        // Supprimer l'indicateur de chargement
        document.getElementById("loading")?.remove();
        
        // Déterminer le type de réponse
        let responseClass = "response-normal";
        
        if (response.toLowerCase().includes("erreur") || response.toLowerCase().includes("je n'ai pas trouvé")) {
            responseClass = "response-warning";
        } else if (response.toLowerCase().includes("extrait pertinent")) {
            responseClass = "response-info";
        }
        
        // Formater la réponse
        const formattedResponse = formatResponse(response);
        
        // Ajouter la réponse formatée
        chatLog.innerHTML += `
            <div class="bot-message">
                <div class="bot-response ${responseClass}">
                    <strong>Assistant GNE</strong>
                    ${formattedResponse}
                </div>
            </div>`;
        
        chatLog.scrollTop = chatLog.scrollHeight;
    })
    .catch(err => {
        document.getElementById("loading")?.remove();
        chatLog.innerHTML += `
            <div class="bot-message">
                <div class="bot-response response-error">
                    <strong>Assistant GNE</strong>
                    <p>Erreur de connexion au serveur. Veuillez réessayer.</p>
                </div>
            </div>`;
        
        chatLog.scrollTop = chatLog.scrollHeight;
    });
}

// Fonction pour échapper les caractères HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fonction pour formater la réponse
function formatResponse(text) {
    // Convertir les sauts de ligne en paragraphes
    let formatted = text.split('\n').filter(line => line.trim() !== '').map(line => `<p>${line}</p>`).join('');
    
    // Mettre en évidence les références GNE
    formatted = formatted.replace(/([A-Z]+\/[0-9]+)/g, '<strong class="gne-reference">$1</strong>');
    
    // Mettre en évidence les termes importants
    const importantTerms = ['accident', 'incident grave', 'incident', 'événement technique', 'notification', 'sécurité'];
    importantTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        formatted = formatted.replace(regex, match => `<em>${match}</em>`);
    });
    
    return formatted;
}

// Initialiser le chatbot lorsque la page est chargée
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter un gestionnaire d'événements pour le champ de saisie
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('focus', function() {
            const chatbotBody = document.getElementById('chatbot-body');
            if (chatbotBody.style.display === 'none') {
                toggleChatbot();
            }
        });
    }
});