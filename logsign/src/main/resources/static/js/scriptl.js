// Fonctions pour basculer entre les formulaires
function showLogin() {
    document.getElementById('login-form-container').classList.add('active');
    document.getElementById('register-form-container').classList.remove('active');
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
}

function showRegister() {
    document.getElementById('register-form-container').classList.add('active');
    document.getElementById('login-form-container').classList.remove('active');
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
}
document.getElementById('registrationForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Empêche la soumission par défaut

    const nom = document.getElementById('nom').value;
    const prenom = document.getElementById('prenom').value;
    const email = document.getElementById('mail').value;
    const matricule = document.getElementById('register-matricule').value;
    const motDePasse = document.getElementById('register-motDePasse').value;
    const aeroport = document.getElementById('airport').value;
    const role = document.getElementById('role').value;

    fetch('/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `nom=${nom}&prenom=${prenom}&email=${email}&role=${role}&matricule=${matricule}&motDePasse=${motDePasse}&aeroport=${aeroport}`,
    })
    .then(response => {
        if (response.ok) {
            return response.text(); // Lit la réponse textuelle
        } else {
            throw new Error("Erreur lors de l'inscription");
        }
    })
    .then(message => {
        alert(message); // Affiche le message de succès
        showLogin(); // Redirige vers la partie de connexion
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert(error.message); // Affiche un message d'erreur
    });
});