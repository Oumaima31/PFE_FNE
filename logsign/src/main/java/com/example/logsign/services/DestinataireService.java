package com.example.logsign.services;

import com.example.logsign.models.Destinataire;
import com.example.logsign.repositories.DestinataireRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DestinataireService {

    @Autowired
    private DestinataireRepository destinataireRepository;

    public Destinataire getDestinataireById(Long id) {
        return destinataireRepository.findById(id).orElse(null);
    }

    public Destinataire saveDestinataire(Destinataire destinataire) {
        return destinataireRepository.save(destinataire);
    }
}