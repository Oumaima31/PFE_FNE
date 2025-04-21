package com.example.logsign.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.logsign.models.Aircraft;
import com.example.logsign.repositories.AircraftRepository;
import java.util.List;

@Service
@Transactional
public class AircraftService {

    @Autowired
    private AircraftRepository aircraftRepository;

    // Sauvegarder un aéronef
    public Aircraft saveAircraft(Aircraft aircraft) {
        return aircraftRepository.save(aircraft);
    }

    // Récupérer tous les aéronefs d'une FNE
    public List<Aircraft> getAircraftsByFneId(Long fneId) {
        return aircraftRepository.findByFneId(fneId);
    }

    // Récupérer un aéronef spécifique d'une FNE
    public Aircraft getAircraftByFneIdAndDesignation(Long fneId, String designation) {
        return aircraftRepository.findByFneIdAndDesignation(fneId, designation);
    }

    // Supprimer tous les aéronefs d'une FNE
    public void deleteAircraftsByFneId(Long fneId) {
        aircraftRepository.deleteByFneId(fneId);
    }

    // Sauvegarder une liste d'aéronefs
    public List<Aircraft> saveAllAircrafts(List<Aircraft> aircrafts) {
        return aircraftRepository.saveAll(aircrafts);
    }
}