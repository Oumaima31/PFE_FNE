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
    
    // API pour récupérer tout l'historique
    @GetMapping("/api/historique")
    @ResponseBody
    public List<Historique> getAllHistorique() {
        return historiqueService.getAllHistorique();
    }
    
    // API pour récupérer l'historique d'un utilisateur
    @GetMapping("/api/historique/user/{userId}")
    @ResponseBody
    public List<Historique> getHistoriqueByUser(@PathVariable Long userId) {
        return historiqueService.getHistoriqueByUserId(userId);
    }
    
    // API pour récupérer l'historique d'une FNE
    @GetMapping("/api/historique/fne/{fneId}")
    @ResponseBody
    public List<Historique> getHistoriqueByFNE(@PathVariable Long fneId) {
        return historiqueService.getHistoriqueByFneId(fneId);
    }
    
    // API pour récupérer un historique par son ID
    @GetMapping("/api/historique/{id}")
    @ResponseBody
    public ResponseEntity<Historique> getHistoriqueById(@PathVariable Long id) {
        Historique historique = historiqueService.getHistoriqueById(id);
        if (historique != null) {
            return ResponseEntity.ok(historique);
        }
        return ResponseEntity.notFound().build();
    }
    
    // API pour récupérer l'historique par action
    @GetMapping("/api/historique/action/{action}")
    @ResponseBody
    public List<Historique> getHistoriqueByAction(@PathVariable String action) {
        return historiqueService.getHistoriqueByAction(action);
    }
}

