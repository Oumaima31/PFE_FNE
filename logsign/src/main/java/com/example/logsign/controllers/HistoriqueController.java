package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.Historique;
import com.example.logsign.models.User;
import com.example.logsign.services.HistoriqueService;

import jakarta.servlet.http.HttpSession;
import java.util.List;


@Controller
@RequestMapping("/auth")
public class HistoriqueController {

    @Autowired
    private HistoriqueService historiqueService;

    @GetMapping("/historique")
    public String historique(HttpSession session, Model model) {
        // Vérifier si l'utilisateur est connecté et est un admin
        User user = (User) session.getAttribute("user");
        if (user == null || !"admin".equals(user.getRole())) {
            return "redirect:/auth/login";
        }
        return "historique";
    }
    
    @GetMapping("/historiqueSML")
    public String historiqueSML(HttpSession session, Model model) {
        // Vérifier si l'utilisateur est connecté et est un SML
        User user = (User) session.getAttribute("user");
        if (user == null || !"SML".equals(user.getRole())) {
            return "redirect:/auth/login";
        }
        return "historiqueSML";
    }
    
    // API pour récupérer tout l'historique (réservé aux admins)
    @GetMapping("/api/historique")
    @ResponseBody
    public ResponseEntity<List<Historique>> getAllHistorique(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || !"admin".equals(user.getRole())) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        return ResponseEntity.ok(historiqueService.getAllHistorique());
    }
    
    // API pour récupérer l'historique de l'utilisateur connecté
    @GetMapping("/api/historique/my-history")
    @ResponseBody
    public ResponseEntity<List<Historique>> getMyHistorique(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }
        
        List<Historique> historique = historiqueService.getHistoriqueByUserId(user.getId());
        return ResponseEntity.ok(historique);
    }
    
    // API pour récupérer l'historique d'un utilisateur spécifique
    @GetMapping("/api/historique/user/{userId}")
    @ResponseBody
    public ResponseEntity<List<Historique>> getHistoriqueByUser(@PathVariable Long userId, HttpSession session) {
        User currentUser = (User) session.getAttribute("user");
        
        // Vérifier si l'utilisateur est admin ou s'il demande son propre historique
        if (currentUser == null || 
            (!"admin".equals(currentUser.getRole()) && !currentUser.getId().equals(userId))) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        return ResponseEntity.ok(historiqueService.getHistoriqueByUserId(userId));
    }
    
    // API pour récupérer l'historique d'une FNE
    @GetMapping("/api/historique/fne/{fneId}")
    @ResponseBody
    public ResponseEntity<List<Historique>> getHistoriqueByFNE(@PathVariable Long fneId, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }
        
        // Si l'utilisateur est un SML, vérifier qu'il est l'auteur de la FNE
        // Cette vérification nécessiterait un service supplémentaire pour vérifier la propriété de la FNE
        
        return ResponseEntity.ok(historiqueService.getHistoriqueByFneId(fneId));
    }
    
    // API pour récupérer un historique par son ID
    @GetMapping("/api/historique/{id}")
    @ResponseBody
    public ResponseEntity<Historique> getHistoriqueById(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }
        
        Historique historique = historiqueService.getHistoriqueById(id);
        if (historique == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Si l'utilisateur est un SML, vérifier qu'il est l'auteur de l'historique
        if ("SML".equals(user.getRole()) && 
            !user.getId().equals(historique.getUtilisateur().getId())) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        return ResponseEntity.ok(historique);
    }
    
    // API pour récupérer l'historique par action
    @GetMapping("/api/historique/action/{action}")
    @ResponseBody
    public ResponseEntity<List<Historique>> getHistoriqueByAction(@PathVariable String action, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }
        
        // Si l'utilisateur est un admin, retourner tous les historiques avec cette action
        if ("admin".equals(user.getRole())) {
            return ResponseEntity.ok(historiqueService.getHistoriqueByAction(action));
        }
        
        // Sinon, filtrer pour ne retourner que les historiques de l'utilisateur
        List<Historique> allHistorique = historiqueService.getHistoriqueByAction(action);
        List<Historique> userHistorique = allHistorique.stream()
            .filter(h -> user.getId().equals(h.getUtilisateur().getId()))
            .toList();
        
        return ResponseEntity.ok(userHistorique);
    }
}

