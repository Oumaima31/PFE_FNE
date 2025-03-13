package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.FNE;
import com.example.logsign.models.User;
import com.example.logsign.services.FNEService;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/auth")
public class FNEController {

    @Autowired
    private FNEService fneService;
    
    // Méthodes pour afficher les vues
    @GetMapping("/fneAdmin")
    public String fneAdmin() {
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
        
                // Afficher les valeurs pour le débogage
                System.out.println("Type d'événement: " + fne.getType_evt());
                System.out.println("REF GNE: " + fne.getREF_GNE());
                System.out.println("Statut: " + fne.getStatut());
        
                // Soumettre la FNE
                fneService.submitFNE(fne, user);
            
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

