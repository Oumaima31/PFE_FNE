package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.logsign.models.User;
import com.example.logsign.repositories.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Méthode pour vérifier les informations de connexion
    public User loginUser(String matricule, String motDePasse) {
        return userRepository.findByMatriculeAndMotDePasse(matricule, motDePasse);
    }

    public User registerUser(User user) {
        // Vérifier si l'email existe déjà
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé");
        }
        return userRepository.save(user);
    }
}