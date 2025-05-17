package com.example.logsign.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.logsign.models.User;
import com.example.logsign.repositories.UserRepository;

@Configuration
public class PasswordMigration {

    @Bean
    public CommandLineRunner migratePasswords(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            List<User> users = userRepository.findAll();
            for (User user : users) {
                // Vérifier si le mot de passe n'est pas déjà haché (ne commence pas par $2a$)
                if (!user.getMotDePasse().startsWith("$2a$")) {
                    String plainPassword = user.getMotDePasse();
                    user.setMotDePasse(passwordEncoder.encode(plainPassword));
                    userRepository.save(user);
                    System.out.println("Mot de passe migré pour l'utilisateur: " + user.getMatricule());
                }
            }
        };
    }
}
