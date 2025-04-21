package com.example.logsign.repositories;

import com.example.logsign.models.Aircraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AircraftRepository extends JpaRepository<Aircraft, Long> {
    
    // Trouver tous les aéronefs d'une FNE spécifique
    @Query("SELECT a FROM Aircraft a WHERE a.fne.fne_id = :fneId ORDER BY a.designation")
    List<Aircraft> findByFneId(@Param("fneId") Long fneId);
    
    // Trouver un aéronef spécifique d'une FNE
    @Query("SELECT a FROM Aircraft a WHERE a.fne.fne_id = :fneId AND a.designation = :designation")
    Aircraft findByFneIdAndDesignation(@Param("fneId") Long fneId, @Param("designation") String designation);
    
    // Supprimer tous les aéronefs d'une FNE
    @Query("DELETE FROM Aircraft a WHERE a.fne.fne_id = :fneId")
    void deleteByFneId(@Param("fneId") Long fneId);
}