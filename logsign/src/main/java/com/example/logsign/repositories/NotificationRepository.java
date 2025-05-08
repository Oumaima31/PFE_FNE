package com.example.logsign.repositories;

import com.example.logsign.models.FNE;
import com.example.logsign.models.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Utiliser une requête JPQL explicite pour éviter les problèmes avec les underscores
    @Query("SELECT n FROM Notification n WHERE n.fne = :fne ORDER BY n.date_envoi DESC")
    Notification findTopByFneOrderByDateEnvoiDesc(@Param("fne") FNE fne);
    
    // Trouver les notifications par utilisateur
    @Query("SELECT n FROM Notification n WHERE n.utilisateur.id = :userId ORDER BY n.date_envoi DESC")
    List<Notification> findByUtilisateurId(@Param("userId") Long userId);
    
    // Trouver les notifications par liste d'IDs de FNE
    @Query("SELECT n FROM Notification n WHERE n.fne.fne_id IN :fneIds ORDER BY n.date_envoi DESC")
    List<Notification> findByFneIdIn(@Param("fneIds") List<Long> fneIds);
}
