package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.User;
import com.example.logsign.services.UserService;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/auth")
public class UserController {
    @GetMapping("/")
public String home() {
    return "index"; // Retourne la vue index.html
} 
    @Autowired
    private UserService userService;

    @PostMapping("/register")
    @ResponseBody
    public String register(@RequestParam String nom, @RequestParam String prenom, @RequestParam String email,
                           @RequestParam String role, @RequestParam String matricule, @RequestParam String motDePasse,
                           @RequestParam String aeroport) {
        User user = new User();
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setEmail(email);
        user.setRole(role);
        user.setMatricule(matricule);
        user.setMotDePasse(motDePasse);
        user.setAeroport(aeroport);

        userService.registerUser(user);
        return "Inscription avec succès"; // Retourne un message de succès

        
    }
    // Route pour l'interface SML
    @GetMapping("/fneSML")
    public String fneSML() {
        return "fneSML"; // Retourne la vue FNE_SML.html
    }

    // Route pour l'interface Admin
    @GetMapping("/fneAdmin")
    public String fneAdmin() {
        return "fneAdmin"; // Retourne la vue FNE_Admin.html
    }
    @PostMapping("/login")
    public String login(@RequestParam String matricule, @RequestParam String motDePasse, HttpSession session, Model model) {
        // Appeler le service pour vérifier les informations de connexion
        User user = userService.loginUser(matricule, motDePasse);
    
        if (user != null) {
            System.out.println("Utilisateur trouvé : " + user.getMatricule() + ", Rôle : " + user.getRole());
            // Stocker l'utilisateur dans la session (optionnel, pour une utilisation ultérieure)
            session.setAttribute("user", user);
    
            // Rediriger en fonction du rôle
            if (user.getRole().equals("SML")) {
                System.out.println("Redirection vers /fneSML");
                return "redirect:/auth/fneSML"; // Redirection vers l'interface SML
            } else if (user.getRole().equals("admin")) {
                System.out.println("Redirection vers /fneAdmin");
                return "redirect:/auth/fneAdmin"; // Redirection vers l'interface admin
            }
        } else {
            System.out.println("Aucun utilisateur trouvé avec ce matricule et ce mot de passe.");
            // Ajouter un message d'erreur au modèle
            model.addAttribute("error", "Aucun utilisateur trouvé avec ce matricule ou ce mot de passe.");
        }
    
        // Si l'utilisateur n'existe pas ou si les informations sont incorrectes
        return "index"; // Retourne la vue index.html avec le message d'erreur
    }

}