package com.example.logsign.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.logsign.models.Notification;
import com.example.logsign.models.User;
import com.example.logsign.models.FNE;
import com.example.logsign.services.NotificationService;
import com.example.logsign.services.FNEService;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;


@Controller
@RequestMapping("/auth")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private FNEService fneService;
    
    @GetMapping("/notificationSML")
    public String notificationSML(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }
        return "notificationSML";
    }

    @GetMapping("/notificationsAdmin")
    public String notificationsAdmin(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }
        return "notificationsAdmin";
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
     * API pour récupérer les notifications liées aux FNE de l'utilisateur connecté
     */
    @GetMapping("/api/notifications")
    @ResponseBody
    public ResponseEntity<List<Notification>> getUserNotifications(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // Si l'utilisateur est un admin, retourner toutes les notifications
        if (user.getRole() != null && user.getRole().equals("admin")) {
            List<Notification> notifications = notificationService.getAllNotifications();
            return ResponseEntity.ok(notifications);
        }
        
        // Pour les utilisateurs SML, récupérer les notifications liées à leurs FNE
        List<FNE> userFNEs = fneService.getFNEByUserId(user.getId());
        
        if (userFNEs == null || userFNEs.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }
        
        // Récupérer les IDs des FNE
        List<Long> fneIds = userFNEs.stream()
                                    .map(FNE::getFne_id)
                                    .collect(Collectors.toList());
        
        // Récupérer les notifications liées à ces FNE
        List<Notification> notifications = notificationService.getNotificationsByFneIds(fneIds);
        
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
        
        // Si l'utilisateur est un admin, il peut voir toutes les notifications
        if (user.getRole() != null && user.getRole().equals("admin")) {
            return ResponseEntity.ok(notification);
        }
        
        // Pour les utilisateurs SML, vérifier si la notification est liée à une de leurs FNE
        if (notification.getFne() != null) {
            List<FNE> userFNEs = fneService.getFNEByUserId(user.getId());
            boolean isUserFNE = userFNEs.stream()
                                        .anyMatch(fne -> fne.getFne_id().equals(notification.getFne().getFne_id()));
            
            if (isUserFNE) {
                return ResponseEntity.ok(notification);
            }
        }
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
}