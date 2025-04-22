package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.logsign.models.Notification;
import com.example.logsign.models.FNE;
import com.example.logsign.models.User;
import com.example.logsign.repositories.NotificationRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private EmailService emailService;
    
    /**
     * Récupère toutes les notifications
     */
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }
    
    /**
     * Récupère les notifications destinées à un utilisateur spécifique
     */
    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUtilisateurId(userId);
    }
    
    /**
     * Récupère les notifications liées à une liste d'IDs de FNE
     */
    public List<Notification> getNotificationsByFneIds(List<Long> fneIds) {
        if (fneIds == null || fneIds.isEmpty()) {
            return new ArrayList<>();
        }
        return notificationRepository.findByFneIdIn(fneIds);
    }
    
    /**
     * Récupère une notification par son ID
     */
    public Notification getNotificationById(Long id) {
        Optional<Notification> notificationOpt = notificationRepository.findById(id);
        return notificationOpt.orElse(null);
    }
    
    /**
     * Détermine le niveau d'urgence en fonction du type d'événement
     * - accident: urgence "haute" (rouge)
     * - incident grave: urgence "moyenne" (orange)
     * - incident: urgence "normale" (vert)
     * - evt technique: urgence "normale" (gris)
     */
    private String determineUrgenceLevel(String typeEvt) {
        if (typeEvt == null) {
            return "moyenne"; // Valeur par défaut
        }
        
        String typeEvtLower = typeEvt.toLowerCase();
        
        if (typeEvtLower.contains("accident")) {
            return "haute";
        } else if (typeEvtLower.contains("incident_grave") || typeEvtLower.contains("incident grave")) {
            return "moyenne";
        } else if (typeEvtLower.contains("incident")) {
            return "basse";
        } else if (typeEvtLower.contains("evt_technique") || typeEvtLower.contains("evt technique")) {
            return "basse";
        }
        
        return "moyenne"; // Valeur par défaut
    }
    
    /**
     * Crée une notification pour une FNE
     */
    public Notification createFneNotification(FNE fne, User user) {
        // Créer la notification
        Notification notification = new Notification();
        notification.setFne(fne);
        notification.setDate_envoi(LocalDateTime.now());
        notification.setMoyen("email");
        
        // Déterminer le niveau d'urgence en fonction du type d'événement
        String urgence = determineUrgenceLevel(fne.getType_evt());
        notification.setUrgence(urgence);
        
        // Définir le contenu de la notification
        String contenu = "L'utilisateur " + user.getPrenom() + " " + user.getNom() + " (ID: " + user.getId() + ") a soumis une nouvelle FNE.";
        notification.setContenu(contenu);
        
        // Trouver l'administrateur (ID 2 selon la capture d'écran)
        User admin = new User();
        admin.setId(2L);
        notification.setUtilisateur(admin);
        
        // Sauvegarder la notification
        Notification savedNotification = notificationRepository.save(notification);
        
        // Envoyer un email à l'administrateur (si configuré)
        try {
            emailService.sendFneNotification(fne, user, "admin@example.com");
        } catch (Exception e) {
            // Logger l'erreur mais continuer
            System.err.println("Erreur lors de l'envoi de l'email: " + e.getMessage());
        }
        
        return savedNotification;
    }
    
    /**
     * Sauvegarde une notification
     */
    public Notification saveNotification(Notification notification) {
        return notificationRepository.save(notification);
    }
}