package com.example.logsign.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Historique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historique_id;

    @ManyToOne
    @JoinColumn(name = "fne_id", nullable = false)
    private FNE fne;

    private String action; // Par exemple : "Soumission", "Modification", "Validation"
    private LocalDateTime date_action;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private User utilisateur;

    // Getters et Setters
    public Long getHistorique_id() {
        return historique_id;
    }

    public void setHistorique_id(Long historique_id) {
        this.historique_id = historique_id;
    }

    public FNE getFne() {
        return fne;
    }

    public void setFne(FNE fne) {
        this.fne = fne;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public LocalDateTime getDate_action() {
        return date_action;
    }

    public void setDate_action(LocalDateTime date_action) {
        this.date_action = date_action;
    }

    public User getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(User utilisateur) {
        this.utilisateur = utilisateur;
    }
}