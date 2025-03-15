package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.FNE;
import com.example.logsign.models.User;
import com.example.logsign.services.FNEService;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Controller
@RequestMapping("/auth")
public class FNEController {

    @Autowired
    private FNEService fneService;
    
    // Méthodes pour afficher les vues
    @GetMapping("/fneAdmin")
    public String fneAdmin(@RequestParam(required = false) Long id, Model model) {
        if (id != null) {
            // Si un ID est fourni, récupérer la FNE pour l'édition
            FNE fne = fneService.getFNEById(id);
            if (fne != null) {
                model.addAttribute("fne", fne);
            }
        }
        return "fneAdmin";
    }
    
    @GetMapping("/fneSML")
    public String fneSML() {
        return "fneSML";
    }
    
    @GetMapping("/fneEnAttente")
    public String fneEnAttente() {
        return "fneEnAttente";
    }
    
    // API pour récupérer toutes les FNE
    @GetMapping("/api/fne")
    @ResponseBody
    public List<FNE> getAllFNE() {
        return fneService.getAllFNE();
    }
    
    // API pour récupérer toutes les FNE en attente
    @GetMapping("/api/fne/en-attente")
    @ResponseBody
    public List<FNE> getFNEEnAttente() {
        return fneService.getFNEByStatut("En attente");
    }
    
    // API pour récupérer une FNE par son ID
    @GetMapping("/api/fne/{id}")
    @ResponseBody
    public ResponseEntity<FNE> getFNEById(@PathVariable Long id) {
        FNE fne = fneService.getFNEById(id);
        if (fne != null) {
            return ResponseEntity.ok(fne);
        }
        return ResponseEntity.notFound().build();
    }
    
    // API pour valider une FNE
    @PostMapping("/api/fne/{id}/valider")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> validerFNE(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Utilisateur non connecté");
            return ResponseEntity.badRequest().body(response);
        }
        
        try {
            FNE fne = fneService.validerFNE(id, user);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("fne", fne);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // API pour refuser une FNE
    @PostMapping("/api/fne/{id}/refuser")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> refuserFNE(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Utilisateur non connecté");
            return ResponseEntity.badRequest().body(response);
        }
        
        try {
            FNE fne = fneService.refuserFNE(id, user);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("fne", fne);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // Méthode pour soumettre une FNE par un utilisateur SML
    @PostMapping("/submitFNE")
    public String submitFNE(@ModelAttribute FNE fne, HttpSession session, Model model) {
        User user = (User) session.getAttribute("user");

        if (user != null) {
            try {
                // Vérifier que les champs importants sont remplis
                if (fne.getType_evt() == null || fne.getType_evt().isEmpty()) {
                    model.addAttribute("error", "Le type d'événement est obligatoire.");
                    return "fneSML";
                }
        
                if (fne.getREF_GNE() == null || fne.getREF_GNE().isEmpty()) {
                    model.addAttribute("error", "La référence GNE est obligatoire.");
                    return "fneSML";
                }
        
                // Afficher les valeurs pour le débogage
                System.out.println("Type d'événement: " + fne.getType_evt());
                System.out.println("REF GNE: " + fne.getREF_GNE());
        
                // Soumettre la FNE
                fneService.submitFNE(fne, user);
            
                // Ajouter le message directement au modèle
                model.addAttribute("message", "FNE soumise avec succès !");
            
                // Retourner directement à la vue sans redirection
                return "fneSML";

            } catch (Exception e) {
                model.addAttribute("error", "Erreur lors de la soumission de la FNE : " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            model.addAttribute("error", "Utilisateur non connecté.");
        }

        return "fneSML";
    }

    // Méthode pour soumettre une FNE par un administrateur
    @PostMapping("/submitFNEAdmin")
    public String submitFNEAdmin(@ModelAttribute FNE fne, HttpSession session, Model model) {
        User user = (User) session.getAttribute("user");

        if (user != null) {
            try {
                // Vérifier que les champs importants sont remplis
                if (fne.getType_evt() == null || fne.getType_evt().isEmpty()) {
                    model.addAttribute("error", "Le type d'événement est obligatoire.");
                    return "fneAdmin";
                }
        
                if (fne.getREF_GNE() == null || fne.getREF_GNE().isEmpty()) {
                    model.addAttribute("error", "La référence GNE est obligatoire.");
                    return "fneAdmin";
                }
        
                
                // Soumettre la FNE
                fneService.submitFNE(fne, user);
                System.out.println("FNE soumise avec succès ! ");

                // Ajouter le message directement au modèle
                model.addAttribute("message", "FNE soumise avec succès !");
            
                // Retourner directement à la vue sans redirection
                return "fneAdmin";

            } catch (Exception e) {
                model.addAttribute("error", "Erreur lors de la soumission de la FNE : " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            model.addAttribute("error", "Utilisateur non connecté.");
        }

        return "fneAdmin";
    }
}

