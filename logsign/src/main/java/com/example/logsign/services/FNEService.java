package com.example.logsign.services;

import com.example.logsign.models.FNE;
import com.example.logsign.models.Historique;
import com.example.logsign.models.Modification;
import com.example.logsign.models.User;

import com.example.logsign.repositories.FNERepository;
import com.example.logsign.repositories.HistoriqueRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
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

// Méthode pour comparer et enregistrer les changements
private void compareAndRecordChanges(FNE existingFne, FNE updatedFne, List<Modification> modifications) {
    // Type d'événement
    if (!Objects.equals(existingFne.getType_evt(), updatedFne.getType_evt())) {
        Modification mod = new Modification();
        mod.setChamp("type_evt");
        mod.setAncienne_valeur(existingFne.getType_evt());
        mod.setNouvelle_valeur(updatedFne.getType_evt());
        modifications.add(mod);
    }
    
    // Référence GNE
    if (!Objects.equals(existingFne.getRef_gne(), updatedFne.getRef_gne())) {
        Modification mod = new Modification();
        mod.setChamp("ref_gne");
        mod.setAncienne_valeur(existingFne.getRef_gne());
        mod.setNouvelle_valeur(updatedFne.getRef_gne());
        modifications.add(mod);
    }
    
    // Description
    if (!Objects.equals(existingFne.getDescription_evt(), updatedFne.getDescription_evt())) {
        Modification mod = new Modification();
        mod.setChamp("description_evt");
        mod.setAncienne_valeur(existingFne.getDescription_evt());
        mod.setNouvelle_valeur(updatedFne.getDescription_evt());
        modifications.add(mod);
    }
    
    // Lieu
    if (!Objects.equals(existingFne.getLieu_EVT(), updatedFne.getLieu_EVT())) {
        Modification mod = new Modification();
        mod.setChamp("lieu_EVT");
        mod.setAncienne_valeur(existingFne.getLieu_EVT());
        mod.setNouvelle_valeur(updatedFne.getLieu_EVT());
        modifications.add(mod);
    }
    
    // Date
    if (!Objects.equals(existingFne.getDate(), updatedFne.getDate())) {
        Modification mod = new Modification();
        mod.setChamp("Date");
        mod.setAncienne_valeur(existingFne.getDate() != null ? existingFne.getDate().toString() : null);
        mod.setNouvelle_valeur(updatedFne.getDate() != null ? updatedFne.getDate().toString() : null);
        modifications.add(mod);
    }
    
    // Heure UTC
    if (!Objects.equals(existingFne.getHeure_UTC(), updatedFne.getHeure_UTC())) {
        Modification mod = new Modification();
        mod.setChamp("heure_UTC");
        mod.setAncienne_valeur(existingFne.getHeure_UTC() != null ? existingFne.getHeure_UTC().toString() : null);
        mod.setNouvelle_valeur(updatedFne.getHeure_UTC() != null ? updatedFne.getHeure_UTC().toString() : null);
        modifications.add(mod);
    }
    
    // Organisme concerné
    if (!Objects.equals(existingFne.getOrganisme_concerné(), updatedFne.getOrganisme_concerné())) {
        Modification mod = new Modification();
        mod.setChamp("Organisme_concerné");
        mod.setAncienne_valeur(existingFne.getOrganisme_concerné());
        mod.setNouvelle_valeur(updatedFne.getOrganisme_concerné());
        modifications.add(mod);
    }
    
    // Moyen de détection
    if (!Objects.equals(existingFne.getMoyen_detection(), updatedFne.getMoyen_detection())) {
        Modification mod = new Modification();
        mod.setChamp("moyen_detection");
        mod.setAncienne_valeur(existingFne.getMoyen_detection());
        mod.setNouvelle_valeur(updatedFne.getMoyen_detection());
        modifications.add(mod);
    }
    
    // Impacts opérationnels
    if (!Objects.equals(existingFne.getImpacts_operationnels(), updatedFne.getImpacts_operationnels())) {
        Modification mod = new Modification();
        mod.setChamp("impacts_operationnels");
        mod.setAncienne_valeur(existingFne.getImpacts_operationnels());
        mod.setNouvelle_valeur(updatedFne.getImpacts_operationnels());
        modifications.add(mod);
    }
    
    // Ajouter d'autres comparaisons pour tous les champs pertinents...
    // Indicatif/Immatriculation
    if (!Objects.equals(existingFne.getIndicatif_immatricultion(), updatedFne.getIndicatif_immatricultion())) {
        Modification mod = new Modification();
        mod.setChamp("indicatif_immatricultion");
        mod.setAncienne_valeur(existingFne.getIndicatif_immatricultion());
        mod.setNouvelle_valeur(updatedFne.getIndicatif_immatricultion());
        modifications.add(mod);
    }
    
    // Code SSR
    if (!Objects.equals(existingFne.getCode_ssr(), updatedFne.getCode_ssr())) {
        Modification mod = new Modification();
        mod.setChamp("code_ssr");
        mod.setAncienne_valeur(existingFne.getCode_ssr());
        mod.setNouvelle_valeur(updatedFne.getCode_ssr());
        modifications.add(mod);
    }
    
    // Type appareil
    if (!Objects.equals(existingFne.getType_appareil(), updatedFne.getType_appareil())) {
        Modification mod = new Modification();
        mod.setChamp("type_appareil");
        mod.setAncienne_valeur(existingFne.getType_appareil());
        mod.setNouvelle_valeur(updatedFne.getType_appareil());
        modifications.add(mod);
    }
    
    // Règles de vol
    if (!Objects.equals(existingFne.getRegles_vol(), updatedFne.getRegles_vol())) {
        Modification mod = new Modification();
        mod.setChamp("regles_vol");
        mod.setAncienne_valeur(existingFne.getRegles_vol());
        mod.setNouvelle_valeur(updatedFne.getRegles_vol());
        modifications.add(mod);
    }
    
    // Terrain départ
    if (!Objects.equals(existingFne.getTerrain_depart(), updatedFne.getTerrain_depart())) {
        Modification mod = new Modification();
        mod.setChamp("terrain_depart");
        mod.setAncienne_valeur(existingFne.getTerrain_depart());
        mod.setNouvelle_valeur(updatedFne.getTerrain_depart());
        modifications.add(mod);
    }
    
    // Terrain arrivée
    if (!Objects.equals(existingFne.getTerrain_arrivée(), updatedFne.getTerrain_arrivée())) {
        Modification mod = new Modification();
        mod.setChamp("terrain_arrivée");
        mod.setAncienne_valeur(existingFne.getTerrain_arrivée());
        mod.setNouvelle_valeur(updatedFne.getTerrain_arrivée());
        modifications.add(mod);
    }
    
    // Cap
    if (!Objects.equals(existingFne.getCap(), updatedFne.getCap())) {
        Modification mod = new Modification();
        mod.setChamp("cap");
        mod.setAncienne_valeur(existingFne.getCap());
        mod.setNouvelle_valeur(updatedFne.getCap());
        modifications.add(mod);
    }
    
    // Altitude réelle
    if (!Objects.equals(existingFne.getAltitude_reel(), updatedFne.getAltitude_reel())) {
        Modification mod = new Modification();
        mod.setChamp("altitude_reel");
        mod.setAncienne_valeur(existingFne.getAltitude_reel());
        mod.setNouvelle_valeur(updatedFne.getAltitude_reel());
        modifications.add(mod);
    }
    
    // Altitude autorisée
    if (!Objects.equals(existingFne.getAltitude_autorise(), updatedFne.getAltitude_autorise())) {
        Modification mod = new Modification();
        mod.setChamp("altitude_autorise");
        mod.setAncienne_valeur(existingFne.getAltitude_autorise());
        mod.setNouvelle_valeur(updatedFne.getAltitude_autorise());
        modifications.add(mod);
    }
    
    // Vitesse
    if (!Objects.equals(existingFne.getVitesse(), updatedFne.getVitesse())) {
        Modification mod = new Modification();
        mod.setChamp("vitesse");
        mod.setAncienne_valeur(existingFne.getVitesse());
        mod.setNouvelle_valeur(updatedFne.getVitesse());
        modifications.add(mod);
    }
    // Section 2: Aéronef B
if (!Objects.equals(existingFne.getIndicatif_immatricultion_b(), updatedFne.getIndicatif_immatricultion_b())) {
    Modification mod = new Modification();
    mod.setChamp("indicatif_immatricultion_b");
    mod.setAncienne_valeur(existingFne.getIndicatif_immatricultion_b());
    mod.setNouvelle_valeur(updatedFne.getIndicatif_immatricultion_b());
    modifications.add(mod);
}

if (!Objects.equals(existingFne.getCode_ssr_b(), updatedFne.getCode_ssr_b())) {
    Modification mod = new Modification();
    mod.setChamp("code_ssr_b");
    mod.setAncienne_valeur(existingFne.getCode_ssr_b());
    mod.setNouvelle_valeur(updatedFne.getCode_ssr_b());
    modifications.add(mod);
}

if (!Objects.equals(existingFne.getType_appareil_b(), updatedFne.getType_appareil_b())) {
    Modification mod = new Modification();
    mod.setChamp("type_appareil_b");
    mod.setAncienne_valeur(existingFne.getType_appareil_b());
    mod.setNouvelle_valeur(updatedFne.getType_appareil_b());
    modifications.add(mod);
}

if (!Objects.equals(existingFne.getRegles_vol_b(), updatedFne.getRegles_vol_b())) {
    Modification mod = new Modification();
    mod.setChamp("regles_vol_b");
    mod.setAncienne_valeur(existingFne.getRegles_vol_b());
    mod.setNouvelle_valeur(updatedFne.getRegles_vol_b());
    modifications.add(mod);
}

if (!Objects.equals(existingFne.getTerrain_depart_b(), updatedFne.getTerrain_depart_b())) {
    Modification mod = new Modification();
    mod.setChamp("terrain_depart_b");
    mod.setAncienne_valeur(existingFne.getTerrain_depart_b());
    mod.setNouvelle_valeur(updatedFne.getTerrain_depart_b());
    modifications.add(mod);
}

if (!Objects.equals(existingFne.getTerrain_arrivée_b(), updatedFne.getTerrain_arrivée_b())) {
    Modification mod = new Modification();
    mod.setChamp("terrain_arrivée_b");
    mod.setAncienne_valeur(existingFne.getTerrain_arrivée_b());
    mod.setNouvelle_valeur(updatedFne.getTerrain_arrivée_b());
    modifications.add(mod);
}

if (!Objects.equals(existingFne.getCap_b(), updatedFne.getCap_b())) {
    Modification mod = new Modification();
    mod.setChamp("cap_b");
    mod.setAncienne_valeur(existingFne.getCap_b());
    mod.setNouvelle_valeur(updatedFne.getCap_b());
    modifications.add(mod);
}

if (!Objects.equals(existingFne.getAltitude_reel_b(), updatedFne.getAltitude_reel_b())) {
    Modification mod = new Modification();
    mod.setChamp("altitude_reel_b");
    mod.setAncienne_valeur(existingFne.getAltitude_reel_b());
    mod.setNouvelle_valeur(updatedFne.getAltitude_reel_b());
    modifications.add(mod);
}

if (!Objects.equals(existingFne.getAltitude_autorise_b(), updatedFne.getAltitude_autorise_b())) {
    Modification mod = new Modification();
    mod.setChamp("altitude_autorise_b");
    mod.setAncienne_valeur(existingFne.getAltitude_autorise_b());
    mod.setNouvelle_valeur(updatedFne.getAltitude_autorise_b());
    modifications.add(mod);
}

if (!Objects.equals(existingFne.getVitesse_b(), updatedFne.getVitesse_b())) {
    Modification mod = new Modification();
    mod.setChamp("vitesse_b");
    mod.setAncienne_valeur(existingFne.getVitesse_b());
    mod.setNouvelle_valeur(updatedFne.getVitesse_b());
    modifications.add(mod);
}
    // Passagers
    if (!Objects.equals(existingFne.getPassagers(), updatedFne.getPassagers())) {
        Modification mod = new Modification();
        mod.setChamp("passagers");
        mod.setAncienne_valeur(existingFne.getPassagers() != null ? existingFne.getPassagers().toString() : "0");
        mod.setNouvelle_valeur(updatedFne.getPassagers() != null ? updatedFne.getPassagers().toString() : "0");
        modifications.add(mod);
    }
    
    // Personnel
    if (!Objects.equals(existingFne.getPersonnel(), updatedFne.getPersonnel())) {
        Modification mod = new Modification();
        mod.setChamp("personnel");
        mod.setAncienne_valeur(existingFne.getPersonnel() != null ? existingFne.getPersonnel().toString() : "0");
        mod.setNouvelle_valeur(updatedFne.getPersonnel() != null ? updatedFne.getPersonnel().toString() : "0");
        modifications.add(mod);
    }
    
    // Equipage
    if (!Objects.equals(existingFne.getEquipage(), updatedFne.getEquipage())) {
        Modification mod = new Modification();
        mod.setChamp("equipage");
        mod.setAncienne_valeur(existingFne.getEquipage() != null ? existingFne.getEquipage().toString() : "0");
        mod.setNouvelle_valeur(updatedFne.getEquipage() != null ? updatedFne.getEquipage().toString() : "0");
        modifications.add(mod);
    }
    
    // Autre
    if (!Objects.equals(existingFne.getAutre(), updatedFne.getAutre())) {
        Modification mod = new Modification();
        mod.setChamp("autre");
        mod.setAncienne_valeur(existingFne.getAutre() != null ? existingFne.getAutre().toString() : "0");
        mod.setNouvelle_valeur(updatedFne.getAutre() != null ? updatedFne.getAutre().toString() : "0");
        modifications.add(mod);
    }
    
    // Direction du vent
    if (!Objects.equals(existingFne.getVent_direction(), updatedFne.getVent_direction())) {
        Modification mod = new Modification();
        mod.setChamp("vent_direction");
        mod.setAncienne_valeur(existingFne.getVent_direction());
        mod.setNouvelle_valeur(updatedFne.getVent_direction());
        modifications.add(mod);
    }
    
    // Vitesse du vent
    if (!Objects.equals(existingFne.getVent_vitesse(), updatedFne.getVent_vitesse())) {
        Modification mod = new Modification();
        mod.setChamp("vent_vitesse");
        mod.setAncienne_valeur(existingFne.getVent_vitesse());
        mod.setNouvelle_valeur(updatedFne.getVent_vitesse());
        modifications.add(mod);
    }
    
    // Visibilité
    if (!Objects.equals(existingFne.getVisibilite(), updatedFne.getVisibilite())) {
        Modification mod = new Modification();
        mod.setChamp("visibilite");
        mod.setAncienne_valeur(existingFne.getVisibilite() != null ? existingFne.getVisibilite().toString() : "0");
        mod.setNouvelle_valeur(updatedFne.getVisibilite() != null ? updatedFne.getVisibilite().toString() : "0");
        modifications.add(mod);
    }
    
    // Nébulosité
    if (!Objects.equals(existingFne.getNebulosite(), updatedFne.getNebulosite())) {
        Modification mod = new Modification();
        mod.setChamp("nebulosite");
        mod.setAncienne_valeur(existingFne.getNebulosite());
        mod.setNouvelle_valeur(updatedFne.getNebulosite());
        modifications.add(mod);
    }
    
    // Précipitation
    if (!Objects.equals(existingFne.getPrecipitation(), updatedFne.getPrecipitation())) {
        Modification mod = new Modification();
        mod.setChamp("precipitation");
        mod.setAncienne_valeur(existingFne.getPrecipitation());
        mod.setNouvelle_valeur(updatedFne.getPrecipitation());
        modifications.add(mod);
    }
    
    // Autres phénomènes
    if (!Objects.equals(existingFne.getAutres_phenomenes(), updatedFne.getAutres_phenomenes())) {
        Modification mod = new Modification();
        mod.setChamp("autres_phenomenes");
        mod.setAncienne_valeur(existingFne.getAutres_phenomenes());
        mod.setNouvelle_valeur(updatedFne.getAutres_phenomenes());
        modifications.add(mod);
    }
    
    // Événement implique installation/équipement
    if (!Objects.equals(existingFne.getEvt_implique_installation_équipement(), updatedFne.getEvt_implique_installation_équipement())) {
        Modification mod = new Modification();
        mod.setChamp("evt_implique_installation_équipement");
        mod.setAncienne_valeur(existingFne.getEvt_implique_installation_équipement() != null ? existingFne.getEvt_implique_installation_équipement().toString() : "false");
        mod.setNouvelle_valeur(updatedFne.getEvt_implique_installation_équipement() != null ? updatedFne.getEvt_implique_installation_équipement().toString() : "false");
        modifications.add(mod);
    }
    
    // Type installation/équipement
    if (!Objects.equals(existingFne.getType_installation_équipement(), updatedFne.getType_installation_équipement())) {
        Modification mod = new Modification();
        mod.setChamp("type_installation_équipement");
        mod.setAncienne_valeur(existingFne.getType_installation_équipement());
        mod.setNouvelle_valeur(updatedFne.getType_installation_équipement());
        modifications.add(mod);
    }
    
    // Nom compagnie assistance/organisme exploitant véhicule
    if (!Objects.equals(existingFne.getNom_compagnie_assistance_organisme_exploitant_véhicule(), updatedFne.getNom_compagnie_assistance_organisme_exploitant_véhicule())) {
        Modification mod = new Modification();
        mod.setChamp("nom_compagnie_assistance_organisme_exploitant_véhicule");
        mod.setAncienne_valeur(existingFne.getNom_compagnie_assistance_organisme_exploitant_véhicule());
        mod.setNouvelle_valeur(updatedFne.getNom_compagnie_assistance_organisme_exploitant_véhicule());
        modifications.add(mod);
    }
    
    // Événement implique véhicule/matériel assistance sol
    if (!Objects.equals(existingFne.getEvt_implique_véhicule_materiel_assistance_sol(), updatedFne.getEvt_implique_véhicule_materiel_assistance_sol())) {
        Modification mod = new Modification();
        mod.setChamp("evt_implique_véhicule_materiel_assistance_sol");
        mod.setAncienne_valeur(existingFne.getEvt_implique_véhicule_materiel_assistance_sol() != null ? existingFne.getEvt_implique_véhicule_materiel_assistance_sol().toString() : "false");
        mod.setNouvelle_valeur(updatedFne.getEvt_implique_véhicule_materiel_assistance_sol() != null ? updatedFne.getEvt_implique_véhicule_materiel_assistance_sol().toString() : "false");
        modifications.add(mod);
    }
    
    // Type matériel/véhicule
    if (!Objects.equals(existingFne.getType_materiel_véhicule(), updatedFne.getType_materiel_véhicule())) {
        Modification mod = new Modification();
        mod.setChamp("type_materiel_véhicule");
        mod.setAncienne_valeur(existingFne.getType_materiel_véhicule());
        mod.setNouvelle_valeur(updatedFne.getType_materiel_véhicule());
        modifications.add(mod);
    }
}

// Méthode pour mettre à jour les champs de la FNE existante
private void updateFneFields(FNE existingFne, FNE updatedFne) {
    // Informations générales
    existingFne.setType_evt(updatedFne.getType_evt());
    existingFne.setRef_gne(updatedFne.getRef_gne());
    existingFne.setOrganisme_concerné(updatedFne.getOrganisme_concerné());
    existingFne.setDate(updatedFne.getDate());
    existingFne.setHeure_UTC(updatedFne.getHeure_UTC());
    existingFne.setLieu_EVT(updatedFne.getLieu_EVT());
    existingFne.setMoyen_detection(updatedFne.getMoyen_detection());
    existingFne.setImpacts_operationnels(updatedFne.getImpacts_operationnels());
    
    // Aéronef
    existingFne.setIndicatif_immatricultion(updatedFne.getIndicatif_immatricultion());
    existingFne.setCode_ssr(updatedFne.getCode_ssr());
    existingFne.setType_appareil(updatedFne.getType_appareil());
    existingFne.setRegles_vol(updatedFne.getRegles_vol());
    existingFne.setTerrain_depart(updatedFne.getTerrain_depart());
    existingFne.setTerrain_arrivée(updatedFne.getTerrain_arrivée());
    existingFne.setCap(updatedFne.getCap());
    existingFne.setAltitude_reel(updatedFne.getAltitude_reel());
    existingFne.setAltitude_autorise(updatedFne.getAltitude_autorise());
    existingFne.setVitesse(updatedFne.getVitesse());
    // Aéronef B
existingFne.setIndicatif_immatricultion_b(updatedFne.getIndicatif_immatricultion_b());
existingFne.setCode_ssr_b(updatedFne.getCode_ssr_b());
existingFne.setType_appareil_b(updatedFne.getType_appareil_b());
existingFne.setRegles_vol_b(updatedFne.getRegles_vol_b());
existingFne.setTerrain_depart_b(updatedFne.getTerrain_depart_b());
existingFne.setTerrain_arrivée_b(updatedFne.getTerrain_arrivée_b());
existingFne.setCap_b(updatedFne.getCap_b());
existingFne.setAltitude_reel_b(updatedFne.getAltitude_reel_b());
existingFne.setAltitude_autorise_b(updatedFne.getAltitude_autorise_b());
existingFne.setVitesse_b(updatedFne.getVitesse_b());

    
    // Victimes
    existingFne.setPassagers(updatedFne.getPassagers());
    existingFne.setPersonnel(updatedFne.getPersonnel());
    existingFne.setEquipage(updatedFne.getEquipage());
    existingFne.setAutre(updatedFne.getAutre());
    
    // Météo
    existingFne.setVent_direction(updatedFne.getVent_direction());
    existingFne.setVent_vitesse(updatedFne.getVent_vitesse());
    existingFne.setVisibilite(updatedFne.getVisibilite());
    existingFne.setNebulosite(updatedFne.getNebulosite());
    existingFne.setPrecipitation(updatedFne.getPrecipitation());
    existingFne.setAutres_phenomenes(updatedFne.getAutres_phenomenes());
    
    // Matériel et équipement
    existingFne.setEvt_implique_installation_équipement(updatedFne.getEvt_implique_installation_équipement());
    existingFne.setType_installation_équipement(updatedFne.getType_installation_équipement());
    existingFne.setNom_compagnie_assistance_organisme_exploitant_véhicule(updatedFne.getNom_compagnie_assistance_organisme_exploitant_véhicule());
    existingFne.setEvt_implique_véhicule_materiel_assistance_sol(updatedFne.getEvt_implique_véhicule_materiel_assistance_sol());
    existingFne.setType_materiel_véhicule(updatedFne.getType_materiel_véhicule());
    
    // Description
    existingFne.setDescription_evt(updatedFne.getDescription_evt());
}
// Modification de la méthode updateFNE dans FNEService.java

@Transactional
public FNE updateFNE(FNE updatedFne, User user) {
    // Récupérer la FNE existante
    FNE existingFne = fneRepository.findById(updatedFne.getFne_id())
            .orElseThrow(() -> new RuntimeException("FNE non trouvée"));
    
    // Vérifier que l'utilisateur est autorisé à modifier cette FNE
    if (!"admin".equals(user.getRole()) && !existingFne.getUtilisateur().getId().equals(user.getId())) {
        throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette FNE");
    }
    
    // Vérifier que la FNE est en statut "En attente"
    if (!"En attente".equals(existingFne.getStatut())) {
        throw new RuntimeException("Seules les FNE en attente peuvent être modifiées");
    }
    
    // Créer un historique des modifications
    Historique historique = new Historique();
    historique.setFne(existingFne);
    historique.setUtilisateur(user);
    historique.setAction("Modification");
    historique.setdateAction(LocalDateTime.now());
    
    // Liste pour stocker les modifications
    List<Modification> modifications = new ArrayList<>();
    
    // Comparer les champs et enregistrer les modifications
    compareAndRecordChanges(existingFne, updatedFne, modifications);
    
    // Si des modifications ont été détectées, les enregistrer
    if (!modifications.isEmpty()) {
        historique.setModifications(modifications);
        historiqueRepository.save(historique);
        
        // Mettre à jour les champs de la FNE existante
        updateFneFields(existingFne, updatedFne);
        
        // Enregistrer la FNE mise à jour
        FNE savedFne = fneRepository.save(existingFne);
        
        // Créer une notification uniquement si l'utilisateur est un SML
        if ("SML".equals(user.getRole())) {
            notificationService.createFneNotification(savedFne, user);
        }
        
        return savedFne;
    } else {
        // Aucune modification détectée
        throw new RuntimeException("Aucune modification détectée");
    }
}
}

