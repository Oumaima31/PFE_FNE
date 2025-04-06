package com.example.logsign.repositories;

import com.example.logsign.models.Historique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
public interface HistoriqueRepository extends JpaRepository<Historique, Long> {
    // Récupérer l'historique par utilisateur
    @Query("SELECT h FROM Historique h WHERE h.utilisateur.id = :userId ORDER BY h.dateAction DESC")
    List<Historique> findByUtilisateurId(@Param("userId") Long userId);
    
    // Récupérer l'historique par FNE
    @Query("SELECT h FROM Historique h WHERE h.fne.fne_id = :fneId ORDER BY h.dateAction DESC")
    List<Historique> findByFneId(@Param("fneId") Long fneId);
    
    // Récupérer l'historique par action
    List<Historique> findByActionOrderByDateActionDesc(String action);  // Correction ici
    
    // Récupérer tout l'historique trié par date d'action (le plus récent en premier)
    @Query("SELECT h FROM Historique h ORDER BY h.dateAction DESC")
    List<Historique> findAllOrderByDateDesc();
    // Supprimer les historiques par FNE ID
@Modifying
@Query("DELETE FROM Historique h WHERE h.fne.fne_id = :fneId")
void deleteByFneId(@Param("fneId") Long fneId);
}
