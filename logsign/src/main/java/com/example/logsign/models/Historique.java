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
    @Column(name = "date_action")
    private LocalDateTime dateAction;

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

    public LocalDateTime getdateAction() {
        return dateAction;
    }

    public void setdateAction(LocalDateTime date_action) {
        this.dateAction = date_action;
    }

    public User getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(User utilisateur) {
        this.utilisateur = utilisateur;
    }
}