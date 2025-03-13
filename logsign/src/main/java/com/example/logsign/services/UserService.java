package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.logsign.models.User;
import com.example.logsign.repositories.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {

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

