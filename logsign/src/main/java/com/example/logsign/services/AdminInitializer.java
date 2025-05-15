package com.example.logsign.services;
// Code à ajouter dans la classe principale (ex: Application.java ou dans un @PostConstruct init method)

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.example.logsign.models.User;
import com.example.logsign.repositories.UserRepository;

@Component
public class AdminInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        String adminMatricule = "admin";

        // Vérifier si un admin existe déjà
        if (!userRepository.existsByMatricule(adminMatricule)) {
            User admin = new User();
            admin.setNom("admin");
            admin.setPrenom("admin");
            admin.setEmail("oumaimabenhamou781@gmail.com");
            admin.setRole("admin");
            admin.setMatricule(adminMatricule);
            admin.setMotDePasse("admin"); // à crypter avec BCrypt si sécurité souhaitée
            admin.setAeroport("Tunis-Carthage (AITC)");

            userRepository.save(admin);
            System.out.println("Admin par défaut créé avec succès.");
        } else {
            System.out.println("Admin déjà existant. Aucune action nécessaire.");
        }
    }
}