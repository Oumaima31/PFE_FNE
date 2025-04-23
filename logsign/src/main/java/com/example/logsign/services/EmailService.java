package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.logsign.models.FNE;
import com.example.logsign.models.User;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    /**
     * Envoie une notification par email pour une FNE
     */
    public void sendFneNotification(FNE fne, User submitter, String toEmail) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        
        // Déterminer le type d'action (création ou modification)
        String action = fne.getFne_id() != null ? "modifié" : "soumis";
        
        // Construire l'objet de l'email
        String subject = "[FNE] ";
        if (fne.getType_evt() != null) {
            switch (fne.getType_evt()) {
                case "accident":
                    subject += "URGENT - Accident ";
                    break;
                case "incident_grave":
                    subject += "Important - Incident grave ";
                    break;
                case "incident":
                    subject += "Incident ";
                    break;
                case "evt_technique":
                    subject += "Événement technique ";
                    break;
                default:
                    subject += "Notification ";
            }
        } else {
            subject += "Notification ";
        }
        
        if (fne.getFne_id() != null) {
            subject += "#" + fne.getFne_id();
        }
        
        message.setSubject(subject);
        
        // Construire le corps de l'email
        StringBuilder body = new StringBuilder();
        body.append("Bonjour,\n\n");
        
        body.append("L'utilisateur ").append(submitter.getPrenom()).append(" ").append(submitter.getNom())
            .append(" (").append(submitter.getRole()).append(") a ").append(action).append(" une FNE");
        
        if (fne.getFne_id() != null) {
            body.append(" #").append(fne.getFne_id());
        }
        
        body.append(".\n\n");
        
        // Ajouter les détails de la FNE
        body.append("Détails de la FNE :\n");
        body.append("- Type d'événement : ").append(formatTypeEvt(fne.getType_evt())).append("\n");
        body.append("- Référence GNE : ").append(fne.getRef_gne() != null ? fne.getRef_gne() : "Non spécifié").append("\n");
        
        if (fne.getDate() != null) {
            body.append("- Date : ").append(fne.getDate()).append("\n");
        }
        
        if (fne.getLieu_EVT() != null && !fne.getLieu_EVT().isEmpty()) {
            body.append("- Lieu : ").append(fne.getLieu_EVT()).append("\n");
        }
        
        if (fne.getDescription_evt() != null && !fne.getDescription_evt().isEmpty()) {
            body.append("\nDescription :\n").append(fne.getDescription_evt()).append("\n");
        }
        
        body.append("\nVeuillez vous connecter à l'application pour consulter les détails complets.\n\n");
        body.append("Cordialement,\n");
        body.append("Système de gestion des FNE");
        
        message.setText(body.toString());
        
        // Envoyer l'email
        mailSender.send(message);
    }
    
    /**
     * Formate le type d'événement pour l'affichage
     */
    private String formatTypeEvt(String typeEvt) {
        if (typeEvt == null) {
            return "Non spécifié";
        }
        
        switch (typeEvt) {
            case "accident":
                return "Accident";
            case "incident_grave":
                return "Incident grave";
            case "incident":
                return "Incident";
            case "evt_technique":
                return "Événement technique";
            default:
                return typeEvt;
        }
    }
}