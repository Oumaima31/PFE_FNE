package com.example.logsign.services;



import org.springframework.security.crypto.bcrypt.BCrypt;

public class Passwordservice {

    // Générer un hash BCrypt pour un mot de passe
    public static String hashPassword(String plainTextPassword) {
        return BCrypt.hashpw(plainTextPassword, BCrypt.gensalt());
    }
    
    // Vérifier si un mot de passe correspond à un hash
    public static boolean checkPassword(String plainTextPassword, String hashedPassword) {
        return BCrypt.checkpw(plainTextPassword, hashedPassword);
    }
}
