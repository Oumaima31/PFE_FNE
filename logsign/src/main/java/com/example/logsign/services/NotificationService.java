package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.logsign.models.FNE;
import com.example.logsign.models.Notification;
import com.example.logsign.models.User;
import com.example.logsign.repositories.NotificationRepository;
import com.example.logsign.repositories.UserRepository;

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
    
    @Autowired
    private UserRepository userRepository; // Pour récupérer les admins
    
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
     * Modifié pour n'envoyer des notifications que lorsqu'un SML soumet une FNE
     */
    public Notification createFneNotification(FNE fne, User user) {
        // Vérifier si l'utilisateur est un SML
        if (user == null || !"SML".equals(user.getRole())) {
            System.out.println("Pas de notification créée car l'utilisateur n'est pas un SML");
            return null;
        }
        
        // Déterminer le niveau d'urgence en fonction du type d'événement
        String urgence = determineUrgenceLevel(fne.getType_evt());
        
        // Définir le contenu de la notification
        String contenu = "L'utilisateur " + user.getPrenom() + " " + user.getNom() + " (ID: " + user.getId() + ") a ";
        
        // Adapter le message en fonction de l'action (création ou modification)
        if (fne.getFne_id() != null) {
            contenu += "ajouté la FNE #" + fne.getFne_id() + ".";
        } else {
            contenu += "soumis une nouvelle FNE.";
        }
        
        // Trouver tous les administrateurs et leur envoyer une notification
        List<User> admins = userRepository.findByRole("admin");
        
        if (admins == null || admins.isEmpty()) {
            System.out.println("Aucun administrateur trouvé pour créer la notification");
            
            // Si aucun admin n'est trouvé, utiliser l'ID 2 comme fallback
            User admin = new User();
            admin.setId(2L);
            
            Notification notification = new Notification();
            notification.setFne(fne);
            notification.setDate_envoi(LocalDateTime.now());
            notification.setMoyen("email");
            notification.setUrgence(urgence);
            notification.setContenu(contenu);
            notification.setUtilisateur(admin);
            
            // Sauvegarder la notification
            Notification savedNotification = notificationRepository.save(notification);
            
            // Envoyer un email à l'administrateur (si configuré)
            try {
                emailService.sendFneNotification(fne, user, "admin@example.com");
                System.out.println("Email envoyé à admin@example.com (fallback)");
            } catch (Exception e) {
                System.err.println("Erreur lors de l'envoi de l'email: " + e.getMessage());
            }
            
            return savedNotification;
        } else {
            System.out.println("Création de notifications pour " + admins.size() + " administrateurs");
            
            // Créer une notification pour chaque admin
            List<Notification> savedNotifications = new ArrayList<>();
            
            for (User admin : admins) {
                Notification notification = new Notification();
                notification.setFne(fne);
                notification.setDate_envoi(LocalDateTime.now());
                notification.setMoyen("email");
                notification.setUrgence(urgence);
                notification.setContenu(contenu);
                notification.setUtilisateur(admin);
                
                // Sauvegarder la notification
                Notification savedNotification = notificationRepository.save(notification);
                savedNotifications.add(savedNotification);
                
                // Envoyer un email à l'administrateur
                try {
                    emailService.sendFneNotification(fne, user, admin.getEmail());
                    System.out.println("Email envoyé à " + admin.getEmail());
                } catch (Exception e) {
                    System.err.println("Erreur lors de l'envoi de l'email à " + admin.getEmail() + ": " + e.getMessage());
                }
            }
            
            // Retourner la première notification créée
            return savedNotifications.isEmpty() ? null : savedNotifications.get(0);
        }
    }
    
    /**
     * Sauvegarde une notification
     */
    public Notification saveNotification(Notification notification) {
        return notificationRepository.save(notification);
    }
}
