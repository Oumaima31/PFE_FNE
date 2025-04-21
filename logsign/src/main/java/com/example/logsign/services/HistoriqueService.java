package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.logsign.models.Historique;
import com.example.logsign.repositories.HistoriqueRepository;

import java.util.List;
import java.util.Optional;
@Service
@Transactional
public class HistoriqueService {

    @Autowired
    private HistoriqueRepository historiqueRepository;
    
    // Récupérer tout l'historique
    public List<Historique> getAllHistorique() {
        return historiqueRepository.findAllOrderByDateDesc();
    }
    
    // Récupérer un historique par son ID
    public Historique getHistoriqueById(Long id) {
        Optional<Historique> historiqueOptional = historiqueRepository.findById(id);
        return historiqueOptional.orElse(null);
    }
    
    // Récupérer l'historique par utilisateur
    public List<Historique> getHistoriqueByUserId(Long userId) {
        return historiqueRepository.findByUtilisateurId(userId);
    }
    
    // Récupérer l'historique par FNE
    public List<Historique> getHistoriqueByFneId(Long fneId) {
        return historiqueRepository.findByFneId(fneId);
    }
    
    // Récupérer l'historique par action
    public List<Historique> getHistoriqueByAction(String action) {
        return historiqueRepository.findByActionOrderByDateActionDesc(action);  // Correction ici
    }
    
    // Enregistrer un historique
    public Historique saveHistorique(Historique historique) {
        return historiqueRepository.save(historique);
    }
    // Dans HistoriqueService.java

// Ajoutez cette méthode
public void deleteByFneId(Long fneId) {
    historiqueRepository.deleteByFneId(fneId);
}
}