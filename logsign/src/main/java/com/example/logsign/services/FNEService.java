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
import jakarta.persistence.Query;

@Service
@Transactional
public class FNEService {

    @Autowired
    private FNERepository fneRepository;

    @Autowired
    private HistoriqueRepository historiqueRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
private NotificationService notificationService;
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

    // Modifiez la méthode submitFNE comme suit:
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
    
    // Créer une notification pour les administrateurs
    notificationService.createFneNotification(savedFNE, user);

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
 
// Supprimer une FNE et réorganiser les IDs
@Transactional
public boolean deleteFNE(Long id, User user) {
    Optional<FNE> fneOptional = fneRepository.findById(id);
    if (!fneOptional.isPresent()) {
        return false;
    }
    
    FNE fne = fneOptional.get();
    
    try {
        // Supprimer d'abord les entrées d'historique associées à cette FNE
        historiqueRepository.deleteByFneId(id);
        
        // Supprimer la FNE
        fneRepository.delete(fne);
        
        // Réorganiser les IDs des FNE supérieures à l'ID supprimé
        // Cette opération doit être effectuée directement avec SQL natif
        Query query = entityManager.createNativeQuery(
            "UPDATE fne SET fne_id = fne_id - 1 WHERE fne_id > :deletedId"
        );
        query.setParameter("deletedId", id);
        query.executeUpdate();
        
        // Mettre à jour également les références dans la table historique
        Query historyQuery = entityManager.createNativeQuery(
            "UPDATE historique SET fne_id = fne_id - 1 WHERE fne_id > :deletedId"
        );
        historyQuery.setParameter("deletedId", id);
        historyQuery.executeUpdate();
        
        // Réinitialiser la séquence d'auto-incrémentation
        // Correction de la syntaxe pour MySQL
        Long maxId = (Long) entityManager.createNativeQuery(
            "SELECT COALESCE(MAX(fne_id), 0) FROM fne"
        ).getSingleResult();
        
        // Incrémenter de 1 pour la prochaine insertion
        maxId = maxId + 1;
        
        Query resetSequenceQuery = entityManager.createNativeQuery(
            "ALTER TABLE fne AUTO_INCREMENT = :newId"
        );
        resetSequenceQuery.setParameter("newId", maxId);
        resetSequenceQuery.executeUpdate();
        
        return true;
    } catch (Exception e) {
        // Log l'erreur pour le débogage
        e.printStackTrace();
        throw e;
    }
}
}

