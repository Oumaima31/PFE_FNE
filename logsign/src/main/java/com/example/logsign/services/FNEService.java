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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FNEService {

    @Autowired
    private FNERepository fneRepository;

    @Autowired
    private HistoriqueRepository historiqueRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // Récupérer toutes les FNE
    public List<FNE> getAllFNE() {
        return fneRepository.findAllOrderByDateDesc();
    }
    
    // Récupérer une FNE par son ID
    public FNE getFNEById(Long id) {
        Optional<FNE> fneOptional = fneRepository.findById(id);
        return fneOptional.orElse(null);
    }
    
    // Récupérer les FNE par statut
    public List<FNE> getFNEByStatut(String statut) {
        return fneRepository.findByStatut(statut);
    }
    
    // Récupérer les FNE par utilisateur
    public List<FNE> getFNEByUserId(Long userId) {
        return fneRepository.findByUtilisateurId(userId);
    }
    
    // Récupérer les FNE par type d'événement
    public List<FNE> getFNEByType(String typeEvt) {
        return fneRepository.findByTypeEvt(typeEvt);
    }

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
        historique.setdateAction(LocalDateTime.now());
        historique.setUtilisateur(user);
        historiqueRepository.save(historique);

        return savedFNE;
    }
    
    // Valider une FNE
    public FNE validerFNE(Long id, User user) {
        Optional<FNE> fneOptional = fneRepository.findById(id);
        if (!fneOptional.isPresent()) {
            throw new RuntimeException("FNE non trouvée");
        }
        
        FNE fne = fneOptional.get();
        
        // Vérifier que la FNE est en attente
        if (!"En attente".equals(fne.getStatut())) {
            throw new RuntimeException("Cette FNE n'est pas en attente de validation");
        }
        
        // Mettre à jour le statut
        fne.setStatut("Validé");
        
        // Créer une entrée dans l'historique
        Historique historique = new Historique();
        historique.setFne(fne);
        historique.setUtilisateur(user);
        historique.setAction("Validation");
        historique.setdateAction(LocalDateTime.now());
        
        // Enregistrer l'historique
        historiqueRepository.save(historique);
        
        // Enregistrer la FNE mise à jour
        return fneRepository.save(fne);
    }
    
    // Refuser une FNE
    public FNE refuserFNE(Long id, User user) {
        Optional<FNE> fneOptional = fneRepository.findById(id);
        if (!fneOptional.isPresent()) {
            throw new RuntimeException("FNE non trouvée");
        }
        
        FNE fne = fneOptional.get();
        
        // Vérifier que la FNE est en attente
        if (!"En attente".equals(fne.getStatut())) {
            throw new RuntimeException("Cette FNE n'est pas en attente de validation");
        }
        
        // Mettre à jour le statut
        fne.setStatut("Refusé");
        
        // Créer une entrée dans l'historique
        Historique historique = new Historique();
        historique.setFne(fne);
        historique.setUtilisateur(user);
        historique.setAction("Refus");
        historique.setdateAction(LocalDateTime.now());
        
        // Enregistrer l'historique
        historiqueRepository.save(historique);
        
        // Enregistrer la FNE mise à jour
        return fneRepository.save(fne);
    }
}

