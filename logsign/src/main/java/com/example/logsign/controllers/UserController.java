package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.User;
import com.example.logsign.services.UserService;

import jakarta.servlet.http.HttpServletRequest;
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

    @GetMapping("/utilisateurs")
    public String utilisateurs() {
        return "utilisateurs";
    }
    
    @GetMapping("/adminutilisateurs")
    public String adminutilisateurs() {
        return "adminutilisateurs";
    }
    
    @PostMapping("/logout")
    public String logout(HttpServletRequest request) {
        // Invalider la session
        request.getSession().invalidate();
        return "redirect:/auth/index"; // Redirection vers la page de login
    }
    
    @GetMapping("/logout")
    public String logoutGet(HttpServletRequest request) {
        // Invalider la session
        request.getSession().invalidate();
        return "redirect:/auth/index"; // Redirection vers la page de login
    }
    
    @GetMapping("/index")
    public String loginPage() {
        return "index"; // Nom de votre template de login
    }

    @PostMapping("/login")
    public String login(@RequestParam String matricule, @RequestParam String motDePasse, 
                        HttpSession session, Model model) {
        // Vérifie les informations de connexion via le service utilisateur
        User user = userService.loginUser(matricule, motDePasse);

        if (user != null) { // Si l'utilisateur est trouvé
            System.out.println("Utilisateur trouvé : " + user.getMatricule() + ", Rôle : " + user.getRole());

            // Stocke les informations de l'utilisateur dans la session
            session.setAttribute("user", user);
            session.setAttribute("userName", user.getNom() + " " + user.getPrenom());
            session.setAttribute("userRole", user.getRole());
            session.setAttribute("userAirport", user.getAeroport());
            session.setAttribute("userId", user.getId());

            // Rediriger vers le tableau de bord commun
            return "redirect:/auth/dashboard";
        } else {
            // Si l'utilisateur n'est pas trouvé, affiche un message d'erreur
            System.out.println("Aucun utilisateur trouvé avec ce matricule et ce mot de passe.");
            model.addAttribute("error", "Aucun utilisateur trouvé avec ce matricule ou ce mot de passe.");
        }
        // Retourne la vue de la page de connexion en cas d'erreur
        return "index"; 
    }
    
    @GetMapping("/dashboard")
    public String dashboard(HttpSession session, Model model) {
        // Vérifier si l'utilisateur est connecté
        if (session.getAttribute("user") == null) {
            return "redirect:/auth/index";
        }
        
        // L'utilisateur est connecté, afficher le tableau de bord
        return "dashboard";
    }
    
    @GetMapping("/redirectToFneSML")
    public String redirectToFneSML(HttpSession session) {
        // Vérifier si l'utilisateur est connecté et a le rôle SML
        if (session.getAttribute("user") == null) {
            return "redirect:/auth/index";
        }
        
        User user = (User) session.getAttribute("user");
        if (!"SML".equals(user.getRole())) {
            return "redirect:/auth/dashboard";
        }
        
        // Rediriger vers la page FNE SML gérée par FNEController
        return "redirect:/auth/fneSML";
    }
    
    @GetMapping("/redirectToFneAdmin")
    public String redirectToFneAdmin(HttpSession session) {
        // Vérifier si l'utilisateur est connecté et a le rôle admin
        if (session.getAttribute("user") == null) {
            return "redirect:/auth/index";
        }
        
        User user = (User) session.getAttribute("user");
        if (!"admin".equals(user.getRole())) {
            return "redirect:/auth/dashboard";
        }
        
        // Rediriger vers la page FNE Admin gérée par FNEController
        return "redirect:/auth/fneAdmin";
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

    // API pour récupérer un utilisateur par ID
    @GetMapping("/api/users/{id}")
    @ResponseBody
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    // API pour créer un nouvel utilisateur
    @PostMapping("/api/users")
    @ResponseBody
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            User newUser = userService.registerUser(user);
            return ResponseEntity.ok(newUser);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // API pour mettre à jour un utilisateur
    @PutMapping("/api/users/{id}")
    @ResponseBody
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            user.setId(id);
            User updatedUser = userService.updateUser(user);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // API pour supprimer un utilisateur
    @DeleteMapping("/api/users/{id}")
    @ResponseBody
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            Map<String, Boolean> response = new HashMap<>();
            response.put("deleted", true);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/api/current-user")
    @ResponseBody
    public ResponseEntity<User> getCurrentUser(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(user);
    }
}
