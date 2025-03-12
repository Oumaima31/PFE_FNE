package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;


import com.example.logsign.models.FNE;
import com.example.logsign.models.User;

import com.example.logsign.services.FNEService;
import com.example.logsign.services.UserService;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/auth") // Définit la route de base pour ce contrôleur
public class UserController {

    /**
     * Méthode pour afficher la page d'accueil.
     * @return le nom de la vue "index.html"
     */
    @GetMapping("/")
    public String home() {
        return "index"; // Retourne la vue de la page d'accueil
    }

    @Autowired
    private UserService userService; // Injection de dépendance du service utilisateur
    
    /**
     * Méthode pour enregistrer un nouvel utilisateur via un formulaire.
     * @param nom Le nom de l'utilisateur
     * @param prenom Le prénom de l'utilisateur
     * @param email L'email de l'utilisateur
     * @param role Le rôle de l'utilisateur (ex: "SML", "admin")
     * @param matricule Le matricule unique de l'utilisateur
     * @param motDePasse Le mot de passe de l'utilisateur
     * @param aeroport L'aéroport associé à l'utilisateur
     * @return un message de succès si l'inscription est réussie
     */
    @PostMapping("/register")
    @ResponseBody
    public String register(@RequestParam String nom, @RequestParam String prenom, @RequestParam String email,
                           @RequestParam String role, @RequestParam String matricule, @RequestParam String motDePasse,
                           @RequestParam String aeroport) {
        // Crée un nouvel objet utilisateur et définit ses propriétés
        User user = new User();
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setEmail(email);
        user.setRole(role);
        user.setMatricule(matricule);
        user.setMotDePasse(motDePasse);
        user.setAeroport(aeroport);

        // Enregistre l'utilisateur via le service
        userService.registerUser(user);
        return "Inscription avec succès"; // Retourne un message de succès
    }

    /**
     * Méthode pour afficher la vue spécifique au rôle SML.
     * @return le nom de la vue "fneSML.html"
     */
    @GetMapping("/fneSML")
    public String fneSML() {
        return "fneSML"; // Retourne la vue pour les utilisateurs SML
    }
    
    /**
     * Méthode pour afficher la vue spécifique au rôle administrateur.
     * @return le nom de la vue "fneAdmin.html"
     */
    @GetMapping("/fneEnAttente")
    public String fneEnAttente() {
        return "fneEnAttente"; // Cela retournera le fichier fne-en-attente.html situé dans le dossier static
    }
    @GetMapping("/historique")
    public String historique() {
        return "historique"; // Cela retournera le fichier historique.html situé dans le dossier static
    }
    @GetMapping("/statistiques")
    public String statistiques() {
        return "statistiques"; // Cela retournera le fichier statistiques.html situé dans le dossier static
    }
    @GetMapping("/utilisateurs")
    public String utilisateurs() {
        return "utilisateurs"; // Cela retournera le fichier utilisateurs.html situé dans le dossier static
    }
    @GetMapping("/historiqueSML")
    public String historiqueSML() {
        return "historiqueSML"; // Cela retournera le fichier historiqueSML.html situé dans le dossier static
    }
    /**
     * Méthode pour afficher l'historique des FNE
     * @return le nom de la vue "historique.html"
     */

    @GetMapping("/fneAdmin")
    public String fneAdmin() {
        return "fneAdmin"; // Retourne la vue pour les administrateurs
    }

    /**
     * Méthode pour gérer la connexion d'un utilisateur.
     * @param matricule Le matricule saisi par l'utilisateur
     * @param motDePasse Le mot de passe saisi par l'utilisateur
     * @param session La session HTTP pour stocker l'utilisateur connecté
     * @param model Le modèle pour ajouter des attributs à la vue
     * @return une redirection vers l'interface appropriée ou la page de connexion en cas d'erreur
     */
    @PostMapping("/login")
    public String login(@RequestParam String matricule, @RequestParam String motDePasse, 
                        HttpSession session, Model model) {
        // Vérifie les informations de connexion via le service utilisateur
        User user = userService.loginUser(matricule, motDePasse);

        if (user != null) { // Si l'utilisateur est trouvé
            System.out.println("Utilisateur trouvé : " + user.getMatricule() + ", Rôle : " + user.getRole());

            // Stocke l'utilisateur dans la session pour une utilisation ultérieure
            session.setAttribute("user", user);

            // Redirige en fonction du rôle de l'utilisateur
            if (user.getRole().equals("SML")) {
                System.out.println("Redirection vers /fneSML");
                return "redirect:/auth/fneSML"; // Redirection vers l'interface SML
            } else if (user.getRole().equals("admin")) {
                System.out.println("Redirection vers /fneAdmin");
                return "redirect:/auth/fneAdmin"; // Redirection vers l'interface administrateur
            }
        } else {
            // Si l'utilisateur n'est pas trouvé, affiche un message d'erreur
            System.out.println("Aucun utilisateur trouvé avec ce matricule et ce mot de passe.");
            model.addAttribute("error", "Aucun utilisateur trouvé avec ce matricule ou ce mot de passe.");
        }

        // Retourne la vue de la page de connexion en cas d'erreur
        return "index"; 
    }
    @Autowired
private FNEService fneService;

    // Vos autres méthodes...

    @PostMapping("/submitFNE")
    public String submitFNE(@ModelAttribute FNE fne, HttpSession session, Model model) {
        User user = (User) session.getAttribute("user");

        if (user != null) {
            try {
                
                // Soumettre la FNE
                fneService.submitFNE(fne, user);
                model.addAttribute("message", "FNE soumise avec succès !");

                return "fneSML";
            } catch (Exception e) {
                model.addAttribute("error", "Erreur lors de la soumission de la FNE : " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            model.addAttribute("error", "Utilisateur non connecté.");
        }

        return "fneSML";
    }

}
