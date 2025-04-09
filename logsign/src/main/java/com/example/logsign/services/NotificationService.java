package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.logsign.models.FNE;
import com.example.logsign.models.Notification;
import com.example.logsign.models.User;
import com.example.logsign.repositories.NotificationRepository;
import com.example.logsign.repositories.UserRepository;

import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

@Service
@Transactional
public class NotificationService {

    private static final Logger logger = Logger.getLogger(NotificationService.class.getName());

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    /**
     * Crée une notification pour une nouvelle FNE et envoie un email aux administrateurs
     * 
     * @param fne La FNE qui vient d'être soumise
     * @param submitter L'utilisateur qui a soumis la FNE
     */
    public void createFneNotification(FNE fne, User submitter) {
        try {
            // Recherche de l'admin par email (puisque nous connaissons son email)
            Optional<User> adminOptional = userRepository.findByEmail("oumaimabenhamou781@gmail.com");
            
            if (adminOptional.isPresent()) {
                User admin = adminOptional.get();
                createNotificationForUser(fne, submitter, admin);
                logger.info("Notification créée pour l'admin: " + admin.getEmail());
            } else {
                // Essayer de trouver des admins par rôle
                List<User> admins = userRepository.findByRole("admin");
                
                if (admins == null || admins.isEmpty()) {
                    logger.warning("Aucun administrateur trouvé pour envoyer la notification de la FNE #" + fne.getFne_id());
                    return;
                }
                
                // Pour chaque admin, créer une notification et envoyer un email
                for (User admin : admins) {
                    createNotificationForUser(fne, submitter, admin);
                    logger.info("Notification créée pour l'admin: " + admin.getEmail());
                }
            }
        } catch (Exception e) {
            logger.severe("Erreur lors de la création des notifications: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Crée une notification pour un utilisateur spécifique
     */
    private void createNotificationForUser(FNE fne, User submitter, User recipient) {
        try {
            // Créer la notification
            Notification notification = new Notification();
            notification.setDate_envoi(LocalDateTime.now());
            notification.setMoyen("email");
            notification.setUrgence("moyenne");// dapres le types d'evenement (on a 4 types)
            notification.setUtilisateur(recipient); // Le destinataire de la notification
            notification.setFne(fne);
            
            // Construire le contenu de la notification
            String contenu = "L'utilisateur " + submitter.getPrenom() + " " + submitter.getNom() + 
                             " (ID: " + submitter.getId() + ") a soumis une nouvelle FNE #" + 
                             fne.getFne_id() + " de type " + fne.getType_evt();
            
            notification.setContenu(contenu);
            
            // Sauvegarder la notification dans la base de données
            Notification savedNotification = notificationRepository.save(notification);
            logger.info("Notification enregistrée avec ID: " + savedNotification.getNotification_id());
            
            // Envoyer un email au destinataire si son email est disponible
            if (recipient.getEmail() != null && !recipient.getEmail().isEmpty()) {
                try {
                    emailService.sendFneNotification(fne, submitter, recipient.getEmail());
                    logger.info("Email envoyé à: " + recipient.getEmail());
                } catch (Exception e) {
                    logger.warning("Erreur lors de l'envoi de l'email à " + recipient.getEmail() + ": " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                logger.warning("Impossible d'envoyer un email: l'adresse email du destinataire est vide");
            }
        } catch (Exception e) {
            logger.severe("Erreur lors de la création de la notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Récupère toutes les notifications pour un utilisateur donné
     * 
     * @param userId ID de l'utilisateur
     * @return Liste des notifications
     */
    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUtilisateurId(userId);
    }
}