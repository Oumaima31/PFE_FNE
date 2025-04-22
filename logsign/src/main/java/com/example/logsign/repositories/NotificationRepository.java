package com.example.logsign.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.logsign.models.Notification;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Trouve les notifications destinées à un utilisateur spécifique
     */
    List<Notification> findByUtilisateurId(Long utilisateurId);
    
    /**
     * Trouve les notifications liées à une liste d'IDs de FNE
     */
    @Query("SELECT n FROM Notification n WHERE n.fne.fne_id IN :fneIds")
    List<Notification> findByFneIdIn(@Param("fneIds") List<Long> fneIds);
}