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
        return historiqueRepository.findAll();
    }
    
    // Récupérer un historique par son ID
    public Historique getHistoriqueById(Long id) {
        Optional<Historique> historiqueOptional = historiqueRepository.findById(id);
        return historiqueOptional.orElse(null);
    }
    
    
    // Enregistrer un historique
    public Historique saveHistorique(Historique historique) {
        return historiqueRepository.save(historique);
    }
}

