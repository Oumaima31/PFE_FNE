package com.example.logsign.controllers;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/auth")  // Ajout de cette ligne pour correspondre au chemin /auth/statistiques
public class StatistiquesController {

    @GetMapping("/statistiques")
    public String afficherStatistiques() {
        return "statistiques";  // Correction du nom du template (sans 's')
    }
}
