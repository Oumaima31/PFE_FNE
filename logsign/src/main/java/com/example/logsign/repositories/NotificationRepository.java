package com.example.logsign.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.logsign.models.Notification;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Trouver les notifications par utilisateur
    @Query("SELECT n FROM Notification n WHERE n.utilisateur.id = :userId ORDER BY n.date_envoi DESC")
    List<Notification> findByUtilisateurId(@Param("userId") Long userId);
    
    // Trouver les notifications par FNE
    @Query("SELECT n FROM Notification n WHERE n.fne.fne_id = :fneId ORDER BY n.date_envoi DESC")
    List<Notification> findByFneId(@Param("fneId") Long fneId);
    
    
}

