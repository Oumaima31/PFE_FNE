package com.example.logsign.models;

import jakarta.persistence.*;

@Entity
@Table(name = "aircrafts")
public class Aircraft {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long aircrafts_id;
    
    private String designation; // 'A', 'B', etc.
    
    private String indicatif;
    private String codeSsr;
    private String typeAppareil;
    private String reglesVol;
    private String terrainDepart;
    private String terrainArrivee;
    private String cap;
    private String altitudeReel;
    private String altitudeAutorise;
    private String vitesse;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fne_id", nullable = false)    
    private FNE fne;

    // Getters and Setters
    public Long getAircrafts_id() {
        return aircrafts_id;
    }

    public void setAircrafts_id(Long id) {
        this.aircrafts_id = id;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getIndicatif() {
        return indicatif;
    }

    public void setIndicatif(String indicatif) {
        this.indicatif = indicatif;
    }

    public String getCodeSsr() {
        return codeSsr;
    }

    public void setCodeSsr(String codeSsr) {
        this.codeSsr = codeSsr;
    }

    public String getTypeAppareil() {
        return typeAppareil;
    }

    public void setTypeAppareil(String typeAppareil) {
        this.typeAppareil = typeAppareil;
    }

    public String getReglesVol() {
        return reglesVol;
    }

    public void setReglesVol(String reglesVol) {
        this.reglesVol = reglesVol;
    }

    public String getTerrainDepart() {
        return terrainDepart;
    }

    public void setTerrainDepart(String terrainDepart) {
        this.terrainDepart = terrainDepart;
    }

    public String getTerrainArrivee() {
        return terrainArrivee;
    }

    public void setTerrainArrivee(String terrainArrivee) {
        this.terrainArrivee = terrainArrivee;
    }

    public String getCap() {
        return cap;
    }

    public void setCap(String cap) {
        this.cap = cap;
    }

    public String getAltitudeReel() {
        return altitudeReel;
    }

    public void setAltitudeReel(String altitudeReel) {
        this.altitudeReel = altitudeReel;
    }

    public String getAltitudeAutorise() {
        return altitudeAutorise;
    }

    public void setAltitudeAutorise(String altitudeAutorise) {
        this.altitudeAutorise = altitudeAutorise;
    }

    public String getVitesse() {
        return vitesse;
    }

    public void setVitesse(String vitesse) {
        this.vitesse = vitesse;
    }

    public FNE getFne() {
        return fne;
    }

    public void setFne(FNE fne) {
        this.fne = fne;
    }
}