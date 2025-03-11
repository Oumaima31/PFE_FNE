package com.example.logsign.models;


import jakarta.persistence.*;

@Entity  // Indique que cette classe est une entité JPA, elle sera mappée à une table de la base de données
public class User {
    @Id // Définit cette colonne comme la clé primaire de la table
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // La stratégie IDENTITY permet à la base de données de
                                                     // générer automatiquement la valeur de l'ID (auto-incrémentation)

    private Long utilisateur_id;
    private String nom;
    private String prenom;
    private String email;
    private String role;
    private String matricule;
    private String motDePasse;
    private String aeroport;

    // Getters et Setters
    public Long getId() {
        return utilisateur_id;
    }

    public void setId(Long id) {
        this.utilisateur_id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public String getMotDePasse() {
        return motDePasse;
    }

    public void setMotDePasse(String motDePasse) {
        this.motDePasse = motDePasse;
    }

    public String getAeroport() {
        return aeroport;
    }

    public void setAeroport(String aeroport) {
        this.aeroport = aeroport;
    }
}
