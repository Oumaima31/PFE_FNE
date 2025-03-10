package com.example.logsign.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.logsign.models.User;

import java.util.Optional;

// UserRepository est une interface qui étend JpaRepository pour effectuer des opérations CRUD sur l'entité User
public interface UserRepository extends JpaRepository<User, Long> {

    // Méthode automatique générée par Spring Data JPA pour rechercher un utilisateur par email
    Optional<User> findByEmail(String email);
    // Renvoie un Optional<User>, ce qui signifie que le résultat peut être vide ou contenir un utilisateur
    // Utilisé pour éviter les erreurs NullPointerException lors de la recherche par email

    // Requête personnalisée avec @Query pour rechercher un utilisateur par matricule et mot de passe
    @Query("SELECT u FROM User u WHERE u.matricule = :matricule AND u.motDePasse = :motDePasse")
    User findByMatriculeAndMotDePasse(
        @Param("matricule") String matricule, 
        @Param("motDePasse") String motDePasse
    );
    // Utilisation de @Param pour lier les paramètres de la requête aux arguments de la méthode
    // Cette méthode est utilisée pour l'authentification de l'utilisateur lors de la connexion
}
