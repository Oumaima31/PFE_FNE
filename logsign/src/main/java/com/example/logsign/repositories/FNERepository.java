package com.example.logsign.repositories;

import com.example.logsign.models.FNE;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FNERepository extends JpaRepository<FNE, Long> {
    // Trouver les FNE par statut
    List<FNE> findByStatut(String statut);
    
    // Trouver les FNE par utilisateur
    @Query("SELECT f FROM FNE f WHERE f.utilisateur.id = :userId")
    List<FNE> findByUtilisateurId(@Param("userId") Long userId);
    
    // Trouver les FNE par type d'événement - Correction avec @Query
    @Query("SELECT f FROM FNE f WHERE f.type_evt = :typeEvt")
    List<FNE> findByTypeEvt(@Param("typeEvt") String typeEvt);
    
    // Trouver les FNE par référence GNE
    @Query("SELECT f FROM FNE f WHERE f.REF_GNE = :REF_GNE")
    List<FNE> findByrefGne(String REF_GNE);  // Changed from findByREFGNE to findByREF_GNE
    
    // Trouver toutes les FNE triées par date (le plus récent en premier)
    @Query("SELECT f FROM FNE f ORDER BY f.Date DESC")
    List<FNE> findAllOrderByDateDesc();
}

