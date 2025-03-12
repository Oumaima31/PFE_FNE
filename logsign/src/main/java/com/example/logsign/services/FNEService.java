package com.example.logsign.services;

import com.example.logsign.models.FNE;
import com.example.logsign.models.Historique;
import com.example.logsign.models.User;

import com.example.logsign.repositories.FNERepository;
import com.example.logsign.repositories.HistoriqueRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class FNEService {

    @Autowired
    private FNERepository fneRepository;

    @Autowired
    private HistoriqueRepository historiqueRepository;

    
    @PersistenceContext
    private EntityManager entityManager;

    public FNE submitFNE(FNE fne, User user) {
        // Associer l'utilisateur connecté à la FNE
        fne.setUtilisateur(user);

        
        
        // Set default values for numeric fields if they are null
        if (fne.getAutre() == null) {
            fne.setAutre(0);
        }
        if (fne.getPassagers() == null) {
            fne.setPassagers(0);
        }
        if (fne.getPersonnel() == null) {
            fne.setPersonnel(0);
        }
        if (fne.getEquipage() == null) {
            fne.setEquipage(0);
        }
        if (fne.getVisibilite() == null) {
            fne.setVisibilite(0);
        }

        // Set default values for boolean fields if they are null
        if (fne.getEvt_implique_installation_équipement() == null) {
            fne.setEvt_implique_installation_équipement(false);
        }
        if (fne.getEvt_implique_véhicule_materiel_assistance_sol() == null) {
            fne.setEvt_implique_véhicule_materiel_assistance_sol(false);
        }

        // Set default status if null
        if (fne.getStatut() == null) {
            fne.setStatut("En attente");
        }

        // Enregistrer la FNE dans la base de données
        FNE savedFNE = fneRepository.save(fne);

        // Créer une entrée dans l'historique
        Historique historique = new Historique();
        historique.setFne(savedFNE);
        historique.setAction("Création");
        historique.setDate_action(LocalDateTime.now());
        historique.setUtilisateur(user);
        historiqueRepository.save(historique);

        return savedFNE;
    }
}