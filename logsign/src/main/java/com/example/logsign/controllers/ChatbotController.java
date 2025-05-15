package com.example.logsign.controllers;

import com.example.logsign.services.PdfService;
import com.example.logsign.services.EncodingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @Autowired
    private PdfService pdfService;
    
    @Autowired
    private EncodingService encodingService;
    
    //application/json : Indique que la réponse sera au format JSON.
    //charset=UTF-8 : Garantit que les caractères spéciaux (é, è, à, etc.) sont encodés en UTF-8.
    @PostMapping(produces = "application/json;charset=UTF-8")
    public ResponseEntity<Map<String, String>> askQuestion(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        
        // Log pour déboguer
        System.out.println("Question reçue: " + question);
        
        // Obtenir la réponse
        String answer = pdfService.getAnswerFromPdf(question);
        
        // Log pour déboguer
        System.out.println("Réponse avant correction: " + answer);
        
        // Nettoyer les caractères mal encodés dans la réponse - correction plus complète
        answer = answer.replace("Æ", "'")
                  .replace("Ú", "é")
                  .replace("È", "è")
                  .replace("À", "à")
                  .replace("Ç", "ç")
                  .replace("Þ", "è")
                  .replace("RÚfÚrence", "Référence")
                  .replace("ÚvÚnement", "événement")
                  .replace("dÆoiseau", "d'oiseau")
                  .replace("dÚfaut", "défaut")
                  .replace("systÞme", "système")
                  .replace("rÚglementaire", "réglementaire")
                  .replace("provoquÚ", "provoqué");
        
        // Log pour déboguer
        System.out.println("Réponse après correction: " + answer);
        
        // Retourner la réponse
        Map<String, String> response = new HashMap<>();
        response.put("answer", answer);
        
        // Ajouter des en-têtes pour forcer l'encodage UTF-8
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(HttpHeaders.CONTENT_ENCODING, "UTF-8");
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");
        
        return new ResponseEntity<>(response, headers, HttpStatus.OK);
    }
}
