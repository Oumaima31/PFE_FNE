package com.example.logsign.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.logsign.models.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.matricule = :matricule AND u.motDePasse = :motDePasse")
    User findByMatriculeAndMotDePasse(@Param("matricule") String matricule, @Param("motDePasse") String motDePasse);
}