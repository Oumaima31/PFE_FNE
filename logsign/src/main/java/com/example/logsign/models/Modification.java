package com.example.logsign.models;

import jakarta.persistence.*;

@Entity
public class Modification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long modification_id;
    
    @ManyToOne
    @JoinColumn(name = "historique_id")
    private Historique historique;
    
    private String champ;
    
    @Column(columnDefinition = "TEXT")
    private String ancienne_valeur;
    
    @Column(columnDefinition = "TEXT")
    private String nouvelle_valeur;
    
    // Getters and Setters
    public Long getModification_id() {
        return modification_id;
    }

    public void setModification_id(Long modification_id) {
        this.modification_id = modification_id;
    }

    public Historique getHistorique() {
        return historique;
    }

    public void setHistorique(Historique historique) {
        this.historique = historique;
    }

    public String getChamp() {
        return champ;
    }

    public void setChamp(String champ) {
        this.champ = champ;
    }

    public String getAncienne_valeur() {
        return ancienne_valeur;
    }

    public void setAncienne_valeur(String ancienne_valeur) {
        this.ancienne_valeur = ancienne_valeur;
    }

    public String getNouvelle_valeur() {
        return nouvelle_valeur;
    }

    public void setNouvelle_valeur(String nouvelle_valeur) {
        this.nouvelle_valeur = nouvelle_valeur;
    }
}