package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.Notification;
import com.example.logsign.models.User;
import com.example.logsign.services.NotificationService;

import jakarta.servlet.http.HttpSession;
import java.util.List;

@Controller
@RequestMapping("/auth")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;
    
    /**
     * Affiche la page des notifications de l'utilisateur connecté
     */
     @GetMapping("/notificationsSML")
    public String showNotificationsSMLPage(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }
        return "notificationsSML";
    }
    @GetMapping("/notifications")
    public String showNotifications(HttpSession session, Model model) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }
        
        List<Notification> notifications = notificationService.getNotificationsForUser(user.getId());
        model.addAttribute("notifications", notifications);
        
        return "notifications";
    }
    
    /**
     * API pour récupérer les notifications de l'utilisateur connecté
     */
    @GetMapping("/api/notifications")
    @ResponseBody
    public ResponseEntity<List<Notification>> getUserNotifications(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        List<Notification> notifications = notificationService.getNotificationsForUser(user.getId());
        return ResponseEntity.ok(notifications);
    }
}