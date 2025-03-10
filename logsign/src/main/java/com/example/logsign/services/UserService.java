package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.logsign.models.User;
import com.example.logsign.repositories.UserRepository;

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
}
