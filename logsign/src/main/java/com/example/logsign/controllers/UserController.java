package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.User;
import com.example.logsign.services.UserService;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Controller
@RequestMapping("/auth") // Définit la route de base pour ce contrôleur
public class UserController {

    @Autowired
    private UserService userService; // Injection de dépendance du service utilisateur
    
    @GetMapping("/")
    public String home() {
        return "index"; // Retourne la vue de la page d'accueil
    }
    
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
    
    // API pour récupérer tous les utilisateurs
    @GetMapping("/api/users")
    @ResponseBody
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
    
    // API pour récupérer un utilisateur par son ID
    @GetMapping("/api/users/{id}")
    @ResponseBody
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // API pour créer un nouvel utilisateur
    @PostMapping("/api/users")
    @ResponseBody
    public ResponseEntity<User> createUser(@RequestBody User user) {
        try {
            User savedUser = userService.registerUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // API pour mettre à jour un utilisateur
    @PutMapping("/api/users/{id}")
    @ResponseBody
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            user.setId(id);
            User updatedUser = userService.updateUser(user);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // API pour supprimer un utilisateur
    @DeleteMapping("/api/users/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Boolean>> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            Map<String, Boolean> response = new HashMap<>();
            response.put("deleted", Boolean.TRUE);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Méthodes pour afficher les vues
    @GetMapping("/utilisateurs")
    public String utilisateurs() {
        return "utilisateurs";
    }
}

