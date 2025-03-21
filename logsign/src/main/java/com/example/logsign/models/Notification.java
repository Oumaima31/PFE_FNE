package com.example.logsign.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notification_id;
    
    private LocalDateTime date_envoi;
    
    private String moyen; // "email", "sms", etc.
    
    private String urgence; // "haute", "moyenne", "basse"
    
    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private User utilisateur; // Destinataire de la notification
    
    @ManyToOne
    @JoinColumn(name = "fne_id")
    private FNE fne;
    
    private String contenu;
    
    
    
    // Getters et Setters
    public Long getNotification_id() {
        return notification_id;
    }

    public void setNotification_id(Long notification_id) {
        this.notification_id = notification_id;
    }

    public LocalDateTime getDate_envoi() {
        return date_envoi;
    }

    public void setDate_envoi(LocalDateTime date_envoi) {
        this.date_envoi = date_envoi;
    }

    public String getMoyen() {
        return moyen;
    }

    public void setMoyen(String moyen) {
        this.moyen = moyen;
    }

    public String getUrgence() {
        return urgence;
    }

    public void setUrgence(String urgence) {
        this.urgence = urgence;
    }

    public User getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(User utilisateur) {
        this.utilisateur = utilisateur;
    }

    public FNE getFne() {
        return fne;
    }

    public void setFne(FNE fne) {
        this.fne = fne;
    }

    public String getContenu() {
        return contenu;
    }

    public void setContenu(String contenu) {
        this.contenu = contenu;
    }

}

