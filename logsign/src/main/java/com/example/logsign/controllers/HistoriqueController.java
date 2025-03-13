package com.example.logsign.controllers;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;



@Controller
@RequestMapping("/auth")
public class HistoriqueController {

    @GetMapping("/historique")
    public String historique() {
        return "historique";
    }
    
    @GetMapping("/historiqueSML")
    public String historiqueSML() {
        return "historiqueSML";
    }
    
    // Vous pouvez ajouter ici des méthodes pour récupérer l'historique des FNE
    // Par exemple:
    /*
    @GetMapping("/api/historique")
    @ResponseBody
    public List<FNE> getHistorique() {
        return fneService.getAllFNE();
    }
    
    @GetMapping("/api/historique/user/{userId}")
    @ResponseBody
    public List<FNE> getHistoriqueByUser(@PathVariable Long userId) {
        return fneService.getFNEByUserId(userId);
    }
    */
}

