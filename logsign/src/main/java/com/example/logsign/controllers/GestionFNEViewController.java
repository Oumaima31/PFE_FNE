package com.example.logsign.controllers;

import com.example.logsign.models.User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.http.HttpSession;
import java.util.logging.Logger;

@Controller
@RequestMapping("/auth")
public class GestionFNEViewController {
    private static final Logger logger = Logger.getLogger(GestionFNEViewController.class.getName());

    @GetMapping("/gestionFNE")
    public String gestionFNEView(HttpSession session, Model model) {
        logger.info("Accès à la page de gestion des FNE");
        
        // Vérifier si l'utilisateur est connecté
        User user = (User) session.getAttribute("user");
        if (user == null) {
            logger.warning("Tentative d'accès à la page de gestion des FNE sans être connecté");
            return "redirect:/auth/login";
        }
        
        // Ajouter des attributs au modèle si nécessaire
        model.addAttribute("userRole", user.getRole());
        model.addAttribute("userId", user.getId());
        model.addAttribute("userName", user.getPrenom() + " " + user.getNom());
        
        logger.info("Affichage de la page de gestion des FNE pour l'utilisateur: " + user.getEmail() + " (Rôle: " + user.getRole() + ")");
        
        // Retourner le nom de la vue Thymeleaf (sans l'extension .html)
        return "gestionFNE";
    }
}
