package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.FNE;
import com.example.logsign.models.User;
import com.example.logsign.services.FNEService;
import com.example.logsign.services.NotificationService;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
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
    public String fneSML(@RequestParam(required = false) Long id, Model model) {
        if (id != null) {
            // Si un ID est fourni, récupérer la FNE pour l'affichage
            FNE fne = fneService.getFNEById(id);
            if (fne != null) {
                model.addAttribute("fne", fne);
            }
        }
        return "fneSML";
    }
    
    @GetMapping("/fneEnAttente")
    public String fneEnAttente() {
        return "fneEnAttente";
    }
    
    // API pour récupérer l'utilisateur connecté
    @GetMapping("/api/current-user")
    @ResponseBody
    public ResponseEntity<User> getCurrentUser(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }
    
    // API pour récupérer toutes les FNE
    @GetMapping("/api/fne")
    @ResponseBody
    public List<FNE> getAllFNE() {
        return fneService.getAllFNE();
    }
    
    // API pour récupérer les FNE d'un utilisateur
    @GetMapping("/api/fne/user")
    @ResponseBody
    public ResponseEntity<List<FNE>> getUserFNE(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        List<FNE> fnes = fneService.getFNEByUserId(user.getId());
        return ResponseEntity.ok(fnes);
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
        
                if (fne.getRef_gne() == null || fne.getRef_gne().isEmpty()) {
                    model.addAttribute("error", "La référence GNE est obligatoire.");
                    return "fneSML";
                }
        
                // Afficher les valeurs pour le débogage
                System.out.println("Type d'événement: " + fne.getType_evt());
                System.out.println("REF GNE: " + fne.getRef_gne());
        
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
        
                if (fne.getRef_gne() == null || fne.getRef_gne().isEmpty()) {
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
    // API pour supprimer une FNE
@DeleteMapping("/api/fne/{id}/delete")
@ResponseBody
public ResponseEntity<Map<String, Object>> deleteFNE(@PathVariable Long id, HttpSession session) {
    User user = (User) session.getAttribute("user");
    Map<String, Object> response = new HashMap<>();
    
    if (user == null || !"admin".equals(user.getRole())) {
        response.put("success", false);
        response.put("message", "Vous n'avez pas les droits pour effectuer cette action");
        return ResponseEntity.status(403).body(response);
    }
    
    try {
        // Appeler le service pour supprimer la FNE et réorganiser les IDs
        boolean deleted = fneService.deleteFNE(id, user);
        
        if (deleted) {
            response.put("success", true);
            response.put("message", "FNE supprimée avec succès");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "FNE non trouvée");
            return ResponseEntity.status(404).body(response);
        }
    } catch (Exception e) {
        response.put("success", false);
        response.put("message", e.getMessage());
        return ResponseEntity.status(500).body(response);
    }
}
// 
@Autowired
private NotificationService notificationService;
@GetMapping("/test-notification")
@ResponseBody
public ResponseEntity<String> testNotification(HttpSession session) {
    User user = (User) session.getAttribute("user");
    if (user == null) {
        return ResponseEntity.badRequest().body("Utilisateur non connecté");
    }
    
    try {
        // Créer une FNE de test
        FNE testFne = new FNE();
        testFne.setFne_id(999L); // ID fictif pour le test
        testFne.setType_evt("Test");
        testFne.setDate(LocalDate.now());
        testFne.setLieu_EVT("Test Location");
        
        // Tester la création de notification
        notificationService.createFneNotification(testFne, user);
        
        return ResponseEntity.ok("Test de notification envoyé avec succès. Vérifiez les logs pour plus de détails.");
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body("Erreur lors du test de notification: " + e.getMessage());
    }
}
// Add this method to your FNEController.java

@PostMapping("/updateFNE")
public String updateFNE(@ModelAttribute FNE fne, HttpSession session, Model model) {
    User user = (User) session.getAttribute("user");

    if (user != null) {
        try {
            // Vérifier que les champs importants sont remplis
            if (fne.getType_evt() == null || fne.getType_evt().isEmpty()) {
                model.addAttribute("error", "Le type d'événement est obligatoire.");
                return "fneSML";
            }
    
            if (fne.getRef_gne() == null || fne.getRef_gne().isEmpty()) {
                model.addAttribute("error", "La référence GNE est obligatoire.");
                return "fneSML";
            }
    
            // Mettre à jour la FNE
            FNE updatedFne = fneService.updateFNE(fne, user);
            
            // Ajouter le message directement au modèle
            model.addAttribute("message", "FNE mise à jour avec succès !");
            
            // Retourner directement à la vue sans redirection
            return "fneSML";

        } catch (Exception e) {
            model.addAttribute("error", "Erreur lors de la mise à jour de la FNE : " + e.getMessage());
            e.printStackTrace();
            // En cas d'erreur, on recharge la FNE pour l'édition
            if (fne.getFne_id() != null) {
                FNE originalFne = fneService.getFNEById(fne.getFne_id());
                if (originalFne != null) {
                    model.addAttribute("fne", originalFne);
                }
            }
        }
    } else {
        model.addAttribute("error", "Utilisateur non connecté.");
    }

    return "fneSML";
}
// Add this method to your FNEController.java

@PostMapping("/updateFNEAdmin")
public String updateFNEAdmin(@ModelAttribute FNE fne, HttpSession session, Model model) {
    User user = (User) session.getAttribute("user");

    if (user != null && "admin".equals(user.getRole())) {
        try {
            // Vérifier que les champs importants sont remplis
            if (fne.getType_evt() == null || fne.getType_evt().isEmpty()) {
                model.addAttribute("error", "Le type d'événement est obligatoire.");
                return "fneAdmin";
            }
    
            if (fne.getRef_gne() == null || fne.getRef_gne().isEmpty()) {
                model.addAttribute("error", "La référence GNE est obligatoire.");
                return "fneAdmin";
            }
    
            // Mettre à jour la FNE
            FNE updatedFne = fneService.updateFNE(fne, user);
            
            // Ajouter le message directement au modèle
            model.addAttribute("message", "FNE mise à jour avec succès !");
            
            // Retourner directement à la vue sans redirection
            return "fneAdmin";

        } catch (Exception e) {
            model.addAttribute("error", "Erreur lors de la mise à jour de la FNE : " + e.getMessage());
            e.printStackTrace();
            // En cas d'erreur, on recharge la FNE pour l'édition
            if (fne.getFne_id() != null) {
                FNE originalFne = fneService.getFNEById(fne.getFne_id());
                if (originalFne != null) {
                    model.addAttribute("fne", originalFne);
                }
            }
        }
    } else {
        model.addAttribute("error", "Vous n'avez pas les droits pour effectuer cette action.");
    }

    return "fneAdmin";
}
}

