package com.example.logsign.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class FNE {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fne_id;

    private String type_evt;
    
    private String ref_gne;

    private String Organisme_concerné;
    private LocalDate Date;
    private LocalTime heure_UTC;
    private String lieu_EVT;
    private String moyen_detection;
    private String impacts_operationnels;
    
    // Initialize numeric fields with default values to avoid null constraint violations
    private Integer passagers = 0;
    private Integer personnel = 0;
    private Integer equipage = 0;
    private Integer autre = 0;
    
    private String vent_direction;
    private String vent_vitesse;
    
    // Set a default value for visibilite to avoid null constraint violation
    private Integer visibilite = 0;
    
    private String nebulosite;
    private String precipitation;
    private String autres_phenomenes;
    private Boolean evt_implique_installation_équipement = false;
    private String type_installation_équipement;
    private String nom_compagnie_assistance_organisme_exploitant_véhicule;
    private Boolean evt_implique_véhicule_materiel_assistance_sol = false;
    private String type_materiel_véhicule;
    private String description_evt;
    private String statut = "En attente";

    
    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private User utilisateur;
    
    @OneToMany(mappedBy = "fne", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Aircraft> aircrafts = new ArrayList<>();
    
    // Méthode utilitaire pour ajouter un aéronef
    public void addAircraft(Aircraft aircraft) {
        aircrafts.add(aircraft);
        aircraft.setFne(this);
    }

    // ... autres getters et setters
    
    public List<Aircraft> getAircrafts() {
        return aircrafts;
    }

    public void setAircrafts(List<Aircraft> aircrafts) {
        this.aircrafts = aircrafts;
    }
    // Getters and Setters
    public Long getFne_id() {
        return fne_id;
    }

    public void setFne_id(Long fne_id) {
        this.fne_id = fne_id;
    }

    public String getType_evt() {
        return type_evt;
    }

    public void setType_evt(String type_evt) {
        this.type_evt = type_evt;
    }

    public String getRef_gne() {
        return ref_gne;
    }

    public void setRef_gne(String rEF_GNE) {
        ref_gne = rEF_GNE;
    }

    public String getOrganisme_concerné() {
        return Organisme_concerné;
    }

    public void setOrganisme_concerné(String organisme_concerné) {
        Organisme_concerné = organisme_concerné;
    }

    public LocalDate getDate() {
        return Date;
    }

    public void setDate(LocalDate date) {
        Date = date;
    }

    public LocalTime getHeure_UTC() {
        return heure_UTC;
    }

    public void setHeure_UTC(LocalTime heure_UTC) {
        this.heure_UTC = heure_UTC;
    }

    public String getLieu_EVT() {
        return lieu_EVT;
    }

    public void setLieu_EVT(String lieu_EVT) {
        this.lieu_EVT = lieu_EVT;
    }

    public String getMoyen_detection() {
        return moyen_detection;
    }

    public void setMoyen_detection(String moyen_detection) {
        this.moyen_detection = moyen_detection;
    }

    public String getImpacts_operationnels() {
        return impacts_operationnels;
    }

    public void setImpacts_operationnels(String impacts_operationnels) {
        this.impacts_operationnels = impacts_operationnels;
    }

    public Integer getPassagers() {
        return passagers;
    }

    public void setPassagers(Integer passagers) {
        this.passagers = passagers != null ? passagers : 0;
    }

    public Integer getPersonnel() {
        return personnel;
    }

    public void setPersonnel(Integer personnel) {
        this.personnel = personnel != null ? personnel : 0;
    }

    public Integer getEquipage() {
        return equipage;
    }

    public void setEquipage(Integer equipage) {
        this.equipage = equipage != null ? equipage : 0;
    }

    public Integer getAutre() {
        return autre;
    }

    public void setAutre(Integer autre) {
        this.autre = autre != null ? autre : 0;
    }

    public String getVent_direction() {
        return vent_direction;
    }

    public void setVent_direction(String vent_direction) {
        this.vent_direction = vent_direction;
    }

    public String getVent_vitesse() {
        return vent_vitesse;
    }

    public void setVent_vitesse(String vent_vitesse) {
        this.vent_vitesse = vent_vitesse;
    }

    public Integer getVisibilite() {
        return visibilite;
    }

    public void setVisibilite(Integer visibilite) {
        this.visibilite = visibilite != null ? visibilite : 0;
    }

    public String getNebulosite() {
        return nebulosite;
    }

    public void setNebulosite(String nebulosite) {
        this.nebulosite = nebulosite;
    }

    public String getPrecipitation() {
        return precipitation;
    }

    public void setPrecipitation(String precipitation) {
        this.precipitation = precipitation;
    }

    public String getAutres_phenomenes() {
        return autres_phenomenes;
    }

    public void setAutres_phenomenes(String autres_phenomenes) {
        this.autres_phenomenes = autres_phenomenes;
    }

    public Boolean getEvt_implique_installation_équipement() {
        return evt_implique_installation_équipement;
    }

    public void setEvt_implique_installation_équipement(Boolean evt_implique_installation_équipement) {
        this.evt_implique_installation_équipement = evt_implique_installation_équipement != null ? evt_implique_installation_équipement : false;
    }

    public String getType_installation_équipement() {
        return type_installation_équipement;
    }

    public void setType_installation_équipement(String type_installation_équipement) {
        this.type_installation_équipement = type_installation_équipement;
    }

    public String getNom_compagnie_assistance_organisme_exploitant_véhicule() {
        return nom_compagnie_assistance_organisme_exploitant_véhicule;
    }

    public void setNom_compagnie_assistance_organisme_exploitant_véhicule(
            String nom_compagnie_assistance_organisme_exploitant_véhicule) {
        this.nom_compagnie_assistance_organisme_exploitant_véhicule = nom_compagnie_assistance_organisme_exploitant_véhicule;
    }

    public Boolean getEvt_implique_véhicule_materiel_assistance_sol() {
        return evt_implique_véhicule_materiel_assistance_sol;
    }

    public void setEvt_implique_véhicule_materiel_assistance_sol(Boolean evt_implique_véhicule_materiel_assistance_sol) {
        this.evt_implique_véhicule_materiel_assistance_sol = evt_implique_véhicule_materiel_assistance_sol != null ? evt_implique_véhicule_materiel_assistance_sol : false;
    }

    public String getType_materiel_véhicule() {
        return type_materiel_véhicule;
    }

    public void setType_materiel_véhicule(String type_materiel_véhicule) {
        this.type_materiel_véhicule = type_materiel_véhicule;
    }

    public String getDescription_evt() {
        return description_evt;
    }

    public void setDescription_evt(String description_evt) {
        this.description_evt = description_evt;
    }

    

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    

    public User getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(User utilisateur) {
        this.utilisateur = utilisateur;
    }
}

