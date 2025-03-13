package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.User;
import com.example.logsign.repositories.UserRepository;
import com.example.logsign.services.UserService;

import jakarta.servlet.http.HttpSession;
import java.util.List;

import java.util.Optional;


@Controller
@RequestMapping("/auth") // Définit la route de base pour ce contrôleur
public class UserController {

    @Autowired
    private UserService userService; // Injection de dépendance du service utilisateur
    
    @GetMapping("/")
    public String home() {
        return "index"; // Retourne la vue de la page d'accueil
    }
    @GetMapping("/adminutilisateurs")
    public String adminutilisateurs() {
        return "adminutilisateurs";
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
    
@Autowired
private UserRepository userRepository;

// Récupérer tous les utilisateurs
public List<User> getAllUsers() {
    return userRepository.findAll();
}

// Récupérer un utilisateur par ID
public User getUserById(Long id) {
    return userRepository.findById(id).orElse(null);
}

// Authentifier un utilisateur
public User loginUser(String matricule, String motDePasse) {
    return userRepository.findByMatriculeAndMotDePasse(matricule, motDePasse);
}

// Enregistrer un nouvel utilisateur
public User registerUser(User user) {
    // Vérifier si le matricule existe déjà
    if (userRepository.existsByMatricule(user.getMatricule())) {
        throw new RuntimeException("Ce matricule est déjà utilisé");
    }
    
    // Vérifier si l'email existe déjà
    if (userRepository.existsByEmail(user.getEmail())) {
        throw new RuntimeException("Cet email est déjà utilisé");
    }
    
    return userRepository.save(user);
}

// Mettre à jour un utilisateur
public User updateUser(User user) {
    User existingUser = userRepository.findById(user.getId())
        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    Optional<User> userWithEmail = userRepository.findByEmail(user.getEmail());
    if (userWithEmail.isPresent() && !userWithEmail.get().getId().equals(user.getId())) {
        throw new RuntimeException("Cet email est déjà utilisé par un autre utilisateur");
    }
    
    // Si le mot de passe n'est pas modifié, conserver l'ancien
    if (user.getMotDePasse() == null || user.getMotDePasse().isEmpty()) {
        user.setMotDePasse(existingUser.getMotDePasse());
    }
    
    return userRepository.save(user);
}

// Supprimer un utilisateur
public void deleteUser(Long id) {
    if (!userRepository.existsById(id)) {
        throw new RuntimeException("Utilisateur non trouvé");
    }
    userRepository.deleteById(id);
}
}