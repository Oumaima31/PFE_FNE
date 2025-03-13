package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.logsign.models.User;
import com.example.logsign.repositories.UserRepository;

import java.util.List;
import java.util.Optional;

@Service // Indique que cette classe est un service Spring (logique métier)
public class UserService {

    @Autowired // Injection automatique du repository UserRepository
    private UserRepository userRepository;

    // Méthode pour authentifier un utilisateur lors de la connexion
    public User loginUser(String matricule, String motDePasse) {
        // Utilise la méthode personnalisée du UserRepository pour trouver l'utilisateur
        return userRepository.findByMatriculeAndMotDePasse(matricule, motDePasse);
    }

    // Méthode pour enregistrer un nouvel utilisateur
    public User registerUser(User user) {
        // Vérification si un utilisateur avec le même email existe déjà
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            // Si oui, lève une exception avec un message d'erreur
            throw new RuntimeException("Email déjà utilisé");
        }
        // Si l'email est unique, enregistre l'utilisateur dans la base de données
        return userRepository.save(user); // Enregistre l'utilisateur et renvoie l'entité sauvegardée
    }
    
    // Méthode pour récupérer tous les utilisateurs
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    // Méthode pour récupérer un utilisateur par son ID
    public User getUserById(Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        return userOptional.orElse(null);
    }
    
    // Méthode pour mettre à jour un utilisateur
    public User updateUser(User user) {
        // Vérifier si l'utilisateur existe
        Optional<User> existingUser = userRepository.findById(user.getId());
        if (!existingUser.isPresent()) {
            throw new RuntimeException("Utilisateur non trouvé");
        }
        
        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        Optional<User> userWithEmail = userRepository.findByEmail(user.getEmail());
        if (userWithEmail.isPresent() && !userWithEmail.get().getId().equals(user.getId())) {
            throw new RuntimeException("Email déjà utilisé par un autre utilisateur");
        }
        
        // Si le mot de passe est vide, conserver l'ancien mot de passe
        if (user.getMotDePasse() == null || user.getMotDePasse().isEmpty()) {
            user.setMotDePasse(existingUser.get().getMotDePasse());
        }
        
        // Enregistrer les modifications
        return userRepository.save(user);
    }
    
    // Méthode pour supprimer un utilisateur
    public void deleteUser(Long id) {
        // Vérifier si l'utilisateur existe
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur non trouvé");
        }
        
        // Supprimer l'utilisateur
        userRepository.deleteById(id);
    }
}

