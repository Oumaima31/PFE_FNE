package com.example.logsign.controllers;

import com.example.logsign.models.FNE;
import com.example.logsign.models.User;
import com.example.logsign.services.FNEService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@RestController //Cette classe est un contrôleur web REST.
// Toutes ses méthodes vont gérer des requêtes HTTP et renvoyer des données (JSON, texte, etc.), pas des pages HTML.

@RequestMapping("/auth/api") //Toutes les méthodes de ce contrôleur auront comme chemin de base /auth/api (Pour organiser les routes de ton API.)
public class FNEApiController {
    private static final Logger logger = Logger.getLogger(FNEApiController.class.getName());

    @Autowired
    private FNEService fneService;

    // cette méthode pour filtrer les FNE selon le rôle de l'utilisateur
    @GetMapping("/gestionFNE")
    public List<FNE> getAllFNE(HttpSession session) {
        logger.info("Récupération des FNE selon le rôle via FNEApiController.getAllFNE");
        
        User user = (User) session.getAttribute("user");
        if (user == null) {
            logger.warning("Tentative d'accès aux FNE sans être connecté");
            return List.of(); // Retourner une liste vide si l'utilisateur n'est pas connecté
        }
        
        List<FNE> allFNE = fneService.getAllFNE();
        
        // Si l'utilisateur est admin, retourner toutes les FNE
        if ("admin".equals(user.getRole())) {
            logger.info("Utilisateur admin: retourne toutes les FNE");
            return allFNE;
        }
        
        // Si l'utilisateur est SML, ne retourner que ses propres FNE
        logger.info("Utilisateur SML: retourne uniquement ses propres FNE");
        return allFNE.stream()
            .filter(fne -> fne.getUtilisateur() != null && fne.getUtilisateur().getId().equals(user.getId()))
            .collect(Collectors.toList());
    }

    // Récupérer une FNE par son ID
    @GetMapping("/fne/{id}")
    public ResponseEntity<?> getFNEById(@PathVariable Long id, HttpSession session) {
        try {
            logger.info("Récupération de la FNE avec ID: " + id);
        
            // Vérifier si l'utilisateur est connecté
            User user = (User) session.getAttribute("user");
            if (user == null) {
                logger.warning("Tentative d'accès à la FNE sans être connecté");
                Map<String, String> error = new HashMap<>();
                error.put("error", "Utilisateur non connecté");
                return ResponseEntity.status(401).body(error);
            }
        
            // Récupérer la FNE
            FNE fne = fneService.getFNEById(id);
            if (fne == null) {
                logger.warning("FNE non trouvée avec ID: " + id);
                Map<String, String> error = new HashMap<>();
                error.put("error", "FNE non trouvée");
                return ResponseEntity.status(404).body(error);
            }
        
            // Vérifier les autorisations
            // Les admins peuvent voir toutes les FNE
            // Les SML ne peuvent voir que leurs propres FNE
            if ("admin".equals(user.getRole()) || 
                (fne.getUtilisateur() != null && fne.getUtilisateur().getId().equals(user.getId()))) {
                return ResponseEntity.ok(fne);
            } else {
                logger.warning("Utilisateur " + user.getEmail() + " non autorisé à voir la FNE: " + id);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Vous n'êtes pas autorisé à voir cette FNE");
                return ResponseEntity.status(403).body(error);
            }
        } catch (Exception e) {
            logger.severe("Erreur lors de la récupération de la FNE: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la récupération de la FNE: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Ajouter l'endpoint pour récupérer les FNE en attente
    @GetMapping("/fne/en-attente")
    public List<FNE> getFNEEnAttente(HttpSession session) {
        logger.info("Récupération des FNE en attente via FNEApiController.getFNEEnAttente");
        
        User user = (User) session.getAttribute("user");
        if (user == null) {
            logger.warning("Tentative d'accès aux FNE en attente sans être connecté");
            return List.of(); // Retourner une liste vide si l'utilisateur n'est pas connecté
        }
        
        List<FNE> allFNE = fneService.getAllFNE();
        
        // Filtrer les FNE en attente
        List<FNE> fneEnAttente = allFNE.stream()
            .filter(fne -> "En attente".equals(fne.getStatut()))
            .collect(Collectors.toList());
        
        // Si l'utilisateur est admin, retourner toutes les FNE en attente
        if ("admin".equals(user.getRole())) {
            logger.info("Utilisateur admin: retourne toutes les FNE en attente");
            return fneEnAttente;
        }
        
        // Si l'utilisateur est SML, ne retourner que ses propres FNE en attente
        logger.info("Utilisateur SML: retourne uniquement ses propres FNE en attente");
        return fneEnAttente.stream()
            .filter(fne -> fne.getUtilisateur() != null && fne.getUtilisateur().getId().equals(user.getId()))
            .collect(Collectors.toList());
    }

    // Supprimer une FNE
    @DeleteMapping("/gestionFNE/{id}")
    public ResponseEntity<Map<String, Object>> deleteFNE(@PathVariable Long id, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                logger.warning("Tentative de suppression sans être connecté");
                response.put("success", false);
                response.put("message", "Utilisateur non connecté");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Vérifier si l'utilisateur est un admin
            if (!"admin".equals(user.getRole())) {
                logger.warning("Tentative de suppression par un utilisateur non admin: " + user.getEmail());
                response.put("success", false);
                response.put("message", "Vous n'êtes pas autorisé à supprimer des FNE");
                return ResponseEntity.badRequest().body(response);
            }
            
            logger.info("Suppression de la FNE avec ID: " + id + " par l'admin: " + user.getEmail());
            boolean deleted = fneService.deleteFNE(id, user);
            
            if (deleted) {
                logger.info("FNE supprimée avec succès: " + id);
                response.put("success", true);
                response.put("message", "FNE supprimée avec succès");
                return ResponseEntity.ok(response);
            } else {
                logger.warning("FNE non trouvée pour suppression: " + id);
                response.put("success", false);
                response.put("message", "FNE non trouvée");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.severe("Erreur lors de la suppression de la FNE: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Erreur lors de la suppression: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // Endpoint pour valider une FNE
@PostMapping("/fne/{id}/valider")
public ResponseEntity<Map<String, Object>> validerFNE(@PathVariable Long id, HttpSession session) {
    Map<String, Object> response = new HashMap<>();
    
    try {
        User user = (User) session.getAttribute("user");
        logger.info("Tentative de validation de la FNE " + id + " par l'utilisateur " + (user != null ? user.getEmail() : "non connecté"));
        
        if (user == null) {
            logger.warning("Tentative de validation sans être connecté");
            response.put("success", false);
            response.put("message", "Utilisateur non connecté");
            return ResponseEntity.status(401).body(response);
        }
        
        // Vérifier si l'utilisateur est un admin
        if (!"admin".equals(user.getRole())) {
            logger.warning("Tentative de validation par un utilisateur non admin: " + user.getEmail());
            response.put("success", false);
            response.put("message", "Vous n'êtes pas autorisé à valider des FNE");
            return ResponseEntity.status(403).body(response);
        }
        
        // Utiliser la méthode spécifique validerFNE au lieu de updateFNE
        FNE validatedFNE = fneService.validerFNE(id, user);
        
        if (validatedFNE != null) {
            logger.info("FNE validée avec succès: " + id);
            response.put("success", true);
            response.put("message", "FNE validée avec succès");
            return ResponseEntity.ok(response);
        } else {
            logger.warning("Échec de la validation de la FNE: " + id);
            response.put("success", false);
            response.put("message", "Échec de la validation");
            return ResponseEntity.status(500).body(response);
        }
    } catch (Exception e) {
        logger.severe("Erreur lors de la validation de la FNE: " + e.getMessage());
        e.printStackTrace();
        response.put("success", false);
        response.put("message", "Erreur lors de la validation: " + e.getMessage());
        return ResponseEntity.status(500).body(response);
    }
}

// Endpoint pour refuser une FNE
@PostMapping("/fne/{id}/refuser")
public ResponseEntity<Map<String, Object>> refuserFNE(@PathVariable Long id, HttpSession session) {
    Map<String, Object> response = new HashMap<>();
    
    try {
        User user = (User) session.getAttribute("user");
        logger.info("Tentative de refus de la FNE " + id + " par l'utilisateur " + (user != null ? user.getEmail() : "non connecté"));
        
        if (user == null) {
            logger.warning("Tentative de refus sans être connecté");
            response.put("success", false);
            response.put("message", "Utilisateur non connecté");
            return ResponseEntity.status(401).body(response);
        }
        
        // Vérifier si l'utilisateur est un admin
        if (!"admin".equals(user.getRole())) {
            logger.warning("Tentative de refus par un utilisateur non admin: " + user.getEmail());
            response.put("success", false);
            response.put("message", "Vous n'êtes pas autorisé à refuser des FNE");
            return ResponseEntity.status(403).body(response);
        }
        
        // Utiliser la méthode spécifique refuserFNE au lieu de updateFNE
        FNE refusedFNE = fneService.refuserFNE(id, user);
        
        if (refusedFNE != null) {
            logger.info("FNE refusée avec succès: " + id);
            response.put("success", true);
            response.put("message", "FNE refusée avec succès");
            return ResponseEntity.ok(response);
        } else {
            logger.warning("Échec du refus de la FNE: " + id);
            response.put("success", false);
            response.put("message", "Échec du refus");
            return ResponseEntity.status(500).body(response);
        }
    } catch (Exception e) {
        logger.severe("Erreur lors du refus de la FNE: " + e.getMessage());
        e.printStackTrace();
        response.put("success", false);
        response.put("message", "Erreur lors du refus: " + e.getMessage());
        return ResponseEntity.status(500).body(response);
    }
}
}
