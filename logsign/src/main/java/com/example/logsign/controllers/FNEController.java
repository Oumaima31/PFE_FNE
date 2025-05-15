package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.logsign.models.FNE;
import com.example.logsign.models.User;
import com.example.logsign.services.FNEService;
import com.example.logsign.services.HistoriqueService;
import com.example.logsign.services.NotificationService;

import jakarta.servlet.http.HttpSession;
import java.util.logging.Logger;


@Controller //utilisé quand tu veux afficher une page HTML avec Thymeleaf
@RequestMapping("/auth") //Toutes les méthodes de ce contrôleur auront comme chemin de base /auth
public class FNEController {
    private static final Logger logger = Logger.getLogger(FNEController.class.getName());

    @Autowired //@Autowired: pour dire :Injecte automatiquement cette classe/service ici
    private FNEService fneService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private HistoriqueService historiqueService;
    
    //@GetMapping:Cette méthode va répondre aux requêtes HTTP de type GET envoyées à l’URL
    // cette méthode pour afficher la vue unifiée ajoutFNE
    @GetMapping("/ajoutFNE") 
    public String ajoutFNE(@RequestParam(required = false) Long id, Model model, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/auth/login";
        }
        
        if (id != null) {
            // Si un ID est fourni, récupérer la FNE pour l'édition
            FNE fne = fneService.getFNEById(id);
            if (fne != null) {
                // Vérifier si l'utilisateur SML a le droit de modifier cette FNE
                if ("SML".equals(user.getRole())) {
                    if (!user.getId().equals(fne.getUtilisateur().getId()) || !"En attente".equals(fne.getStatut())) {
                        model.addAttribute("error", "Vous n'êtes pas autorisé à modifier cette FNE");
                        return "ajoutFNE";
                    }
                }
                model.addAttribute("fne", fne);
            }
        }
        
        return "ajoutFNE";
    }
    
    // Méthode unifiée pour soumettre une FNE
    @PostMapping("/submitFNE") //@PostMapping(): Si tu veux envoyer un fichier, tu utiliseras
    public String submitFNE(@ModelAttribute FNE fne, HttpSession session, RedirectAttributes redirectAttributes) {
        User user = (User) session.getAttribute("user");

        if (user != null) {
            try {
                // Vérifier que les champs importants sont remplis
                if (fne.getType_evt() == null || fne.getType_evt().isEmpty()) {
                    redirectAttributes.addFlashAttribute("error", "Le type d'événement est obligatoire.");
                    return "redirect:/auth/ajoutFNE";
                }
        
                if (fne.getRef_gne() == null || fne.getRef_gne().isEmpty()) {
                    redirectAttributes.addFlashAttribute("error", "La référence GNE est obligatoire.");
                    return "redirect:/auth/ajoutFNE";
                }
                
                // Si l'utilisateur est un SML, définir le statut à "En attente"
                if ("SML".equals(user.getRole())) {
                    fne.setStatut("En attente");
                }
                
                // Soumettre la FNE
                FNE newFNE = fneService.submitFNE(fne, user);
            
                // Rediriger vers la page de gestion FNE avec un message de succès
                redirectAttributes.addFlashAttribute("success", "FNE soumise avec succès !");
                return "redirect:/auth/gestionFNE";

            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("error", "Erreur lors de la soumission de la FNE : " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            redirectAttributes.addFlashAttribute("error", "Utilisateur non connecté.");
        }

        return "redirect:/auth/ajoutFNE";
    }
    
    // Méthode unifiée pour mettre à jour une FNE
    @PostMapping("/updateFNE")
    public String updateFNE(@ModelAttribute FNE fne, HttpSession session, RedirectAttributes redirectAttributes) {
        User user = (User) session.getAttribute("user");

        if (user != null) {
            try {
                // Vérifier que les champs importants sont remplis
                if (fne.getType_evt() == null || fne.getType_evt().isEmpty()) {
                    redirectAttributes.addFlashAttribute("error", "Le type d'événement est obligatoire.");
                    return "redirect:/auth/ajoutFNE?id=" + fne.getFne_id();
                }
        
                if (fne.getRef_gne() == null || fne.getRef_gne().isEmpty()) {
                    redirectAttributes.addFlashAttribute("error", "La référence GNE est obligatoire.");
                    return "redirect:/auth/ajoutFNE?id=" + fne.getFne_id();
                }
                
                // Vérifier si l'utilisateur a le droit de modifier cette FNE
                FNE existingFNE = fneService.getFNEById(fne.getFne_id());
                if (existingFNE == null) {
                    redirectAttributes.addFlashAttribute("error", "FNE non trouvée.");
                    return "redirect:/auth/ajoutFNE";
                }
                
                // Si l'utilisateur est un SML, vérifier qu'il est l'auteur de la FNE et que son statut est "En attente"
                if ("SML".equals(user.getRole())) {
                    if (!user.getId().equals(existingFNE.getUtilisateur().getId())) {
                        redirectAttributes.addFlashAttribute("error", "Vous n'êtes pas autorisé à modifier cette FNE.");
                        return "redirect:/auth/ajoutFNE?id=" + fne.getFne_id();
                    }
                    
                    if (!"En attente".equals(existingFNE.getStatut())) {
                        redirectAttributes.addFlashAttribute("error", "Vous ne pouvez modifier que les FNE en attente.");
                        return "redirect:/auth/ajoutFNE?id=" + fne.getFne_id();
                    }
                    
                    // Conserver le statut "En attente" pour les SML
                    fne.setStatut("En attente");
                }
        
                // Mettre à jour la FNE
                FNE updatedFNE = fneService.updateFNE(fne, user);
                
                // Rediriger vers la page de gestion FNE avec un message de succès
                redirectAttributes.addFlashAttribute("success", "FNE mise à jour avec succès !");
                return "redirect:/auth/gestionFNE";

            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("error", "Erreur lors de la mise à jour de la FNE : " + e.getMessage());
                e.printStackTrace();
                return "redirect:/auth/ajoutFNE?id=" + fne.getFne_id();
            }
        } else {
            redirectAttributes.addFlashAttribute("error", "Utilisateur non connecté.");
        }

        return "redirect:/auth/ajoutFNE";
    }
    
    // Ajouter les méthodes pour les administrateurs
    @PostMapping("/submitFNEAdmin")
    public String submitFNEAdmin(@ModelAttribute FNE fne, HttpSession session, RedirectAttributes redirectAttributes) {
        logger.info("Soumission d'une FNE par un administrateur");
        // Rediriger vers la méthode commune
        return submitFNE(fne, session, redirectAttributes);
    }
    
    @PostMapping("/updateFNEAdmin")
    public String updateFNEAdmin(@ModelAttribute FNE fne, HttpSession session, RedirectAttributes redirectAttributes) {
        logger.info("Mise à jour d'une FNE par un administrateur");
        // Rediriger vers la méthode commune
        return updateFNE(fne, session, redirectAttributes);
    }
    
    // Conserver les méthodes existantes pour la compatibilité
    @GetMapping("/fneAdmin")
    public String fneAdmin(@RequestParam(required = false) Long id, Model model) {
        // Rediriger vers la nouvelle interface unifiée
        return "redirect:/auth/ajoutFNE" + (id != null ? "?id=" + id : "");
    }
    
    @GetMapping("/fneSML")
    public String fneSML(@RequestParam(required = false) Long id, Model model) {
        // Rediriger vers la nouvelle interface unifiée
        return "redirect:/auth/ajoutFNE" + (id != null ? "?id=" + id : "");
    }
    
    @GetMapping("/fneEnAttente")
    public String fneEnAttente(HttpSession session) {       
        return "fneEnAttente";
    }
}
