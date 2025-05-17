package com.example.logsign.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.logsign.models.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    // Nouvelle méthode pour trouver un utilisateur par matricule
    Optional<User> findByMatricule(String matricule);

    // Nouvelle méthode pour verifier si la matricule existe ou pas 
    boolean existsByMatricule(String matricule);

    // Nouvelle méthode pour verifier si l'email existe ou pas
    boolean existsByEmail(String email);

    // Nouvelle méthode pour trouver les utilisateurs par rôle
    @Query("SELECT u FROM User u WHERE u.role = :role")
    List<User> findByRole(@Param("role") String role);
}
