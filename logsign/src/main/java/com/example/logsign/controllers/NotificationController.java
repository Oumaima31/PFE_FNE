package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
    
    @GetMapping("/notificationSML")
    public String notificationSML(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }
        return "notificationSML"; // Ensure this matches the template name
    }

    @GetMapping("/notificationsAdmin")
    public String notificationsAdmin(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }
        return "notificationsAdmin"; // Ensure this matches the template name
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
    @GetMapping("/api/notifications/{id}")
@ResponseBody
public ResponseEntity<Notification> getNotificationDetails(@PathVariable Long id, HttpSession session) {
    User user = (User) session.getAttribute("user");
    if (user == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    
    Notification notification = notificationService.getNotificationById(id);
    if (notification == null) {
        return ResponseEntity.notFound().build();
    }
    
    return ResponseEntity.ok(notification);
}
}