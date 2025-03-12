package com.example.logsign.repositories;

import com.example.logsign.models.Destinataire;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DestinataireRepository extends JpaRepository<Destinataire, Long> {
}