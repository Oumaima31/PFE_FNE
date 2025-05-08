package com.example.logsign.controllers;

import com.example.logsign.models.FNE;
import com.example.logsign.models.User;
import com.example.logsign.services.FNEService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.logging.Logger;


@RestController
@RequestMapping("/auth/api")
public class GestionFNEController {
    private static final Logger logger = Logger.getLogger(GestionFNEController.class.getName());

    @Autowired
    private FNEService fneService;

    // Modifier l'URL pour éviter le conflit avec FNEApiController
    @GetMapping("/userFNEs")
    public List<FNE> getFNEByUser(HttpSession session) {
        User user = (User) session.getAttribute("user");
        logger.info("Récupération des FNE pour l'utilisateur: " + (user != null ? user.getEmail() : "non connecté"));
        
        if (user == null) {
            logger.warning("Utilisateur non connecté, retour d'une liste vide");
            return List.of();
        }
        
        String role = user.getRole();
        Long userId = user.getId();
        
        logger.info("Rôle de l'utilisateur: " + role + ", ID: " + userId);
        
        if ("admin".equals(role)) {
            logger.info("Récupération de toutes les FNE pour l'admin");
            return fneService.getAllFNE();
        } else {
            logger.info("Récupération des FNE pour l'utilisateur SML avec ID: " + userId);
            return fneService.getFNEByUserId(userId);
        }
    }
}
