package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.logsign.models.FNE;
import com.example.logsign.models.User;

import java.util.logging.Logger;

@Service
public class EmailService {
    
    private static final Logger logger = Logger.getLogger(EmailService.class.getName());
    
    @Autowired
    private JavaMailSender emailSender;
    
    /**
     * Envoie un email de notification pour une nouvelle FNE
     * 
     * @param fne La FNE qui vient d'être soumise
     * @param user L'utilisateur qui a soumis la FNE
     * @param adminEmail L'adresse email de l'administrateur destinataire
     */
    public void sendFneNotification(FNE fne, User user, String adminEmail) {
        try {
            logger.info("Préparation de l'envoi d'email à: " + adminEmail);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(adminEmail);
            message.setSubject("Nouvelle FNE soumise - #" + fne.getFne_id());
            
            StringBuilder body = new StringBuilder();
            body.append("Bonjour,\n\n");
            body.append("Une nouvelle Fiche de Notification d'Evénement (FNE) a été soumise dans le système.\n\n");
            body.append("Détails de la FNE :\n");
            body.append("- Numéro : ").append(fne.getFne_id()).append("\n");
            body.append("- Type d'événement : ").append(fne.getType_evt()).append("\n");
            body.append("- Date : ").append(fne.getDate()).append("\n");
            body.append("- Lieu : ").append(fne.getLieu_EVT() != null ? fne.getLieu_EVT() : "Non spécifié").append("\n\n");
            
            body.append("Soumise par : ").append(user.getPrenom()).append(" ").append(user.getNom());
            body.append(" (ID: ").append(user.getId()).append(")\n\n");
            
            body.append("Veuillez vous connecter au système pour examiner cette FNE.\n\n");
            body.append("Cordialement,\n");
            body.append("Système de gestion des FNE");
            
            message.setText(body.toString());
            
            logger.info("Envoi de l'email à: " + adminEmail);
            emailSender.send(message);
            logger.info("Email envoyé avec succès à: " + adminEmail);
        } catch (Exception e) {
            logger.severe("Erreur lors de l'envoi de l'email: " + e.getMessage());
            e.printStackTrace();
        }
    }
}