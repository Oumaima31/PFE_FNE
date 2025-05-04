package com.example.logsign.services;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.json.*;

import java.io.InputStream;
import java.util.*;
import java.util.regex.*;

@Service
public class PdfService {

    // Modèle plus léger mais performant
    private static final String HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-xxl";
    private static final String API_KEY = "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";
    
    private Map<String, String> pdfSections = new HashMap<>();

    public String getAnswerFromPdf(String question) {
        try {
            if (pdfSections.isEmpty()) {
                loadAndStructurePdf();
            }
            
            String context = findMostRelevantSection(question);
            return askAI(question, context);
            
        } catch (Exception e) {
            return fallbackSearch(question);
        }
    }

    private void loadAndStructurePdf() throws Exception {
        try (InputStream input = getClass().getResourceAsStream("/chatbot/guideGNE.pdf");
             PDDocument document = PDDocument.load(input)) {
             
            PDFTextStripper stripper = new PDFTextStripper();
            String fullText = stripper.getText(document);
            
            // Découpage plus intelligent
            String[] sections = fullText.split("(?=\\n[A-Z]+/[0-9]+\\s)");
            for (String section : sections) {
                if (section.length() > 50) { // Ignorer les sections trop courtes
                    String ref = section.substring(0, 20).trim(); // Extraire la référence
                    pdfSections.put(ref, section);
                }
            }
        }
    }

    private String findMostRelevantSection(String question) {
        // 1. Chercher par référence directe
        Matcher refMatcher = Pattern.compile("([A-Z]+/[0-9]+)").matcher(question);
        if (refMatcher.find()) {
            String ref = refMatcher.group(1);
            for (String key : pdfSections.keySet()) {
                if (key.contains(ref)) {
                    return pdfSections.get(key);
                }
            }
        }
        
        // 2. Chercher par mots-clés
        String[] keywords = question.toLowerCase().split("\\s+");
        String bestMatch = "";
        int highestScore = 0;
        
        for (Map.Entry<String, String> entry : pdfSections.entrySet()) {
            int score = 0;
            String lowerContent = entry.getValue().toLowerCase();
            
            for (String kw : keywords) {
                if (kw.length() > 3 && lowerContent.contains(kw)) {
                    score++;
                }
            }
            
            if (score > highestScore) {
                highestScore = score;
                bestMatch = entry.getValue();
            }
        }
        
        return bestMatch.isEmpty() ? pdfSections.values().iterator().next() : bestMatch;
    }

    private String askAI(String question, String context) {
        try {
            // Limiter la taille du contexte
            context = context.substring(0, Math.min(context.length(), 2000));
            
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + API_KEY);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Format adapté à flan-t5
            JSONObject request = new JSONObject();
            request.put("inputs", "question: " + question + " context: " + context);
            request.put("parameters", new JSONObject().put("max_length", 200));
            
            HttpEntity<String> entity = new HttpEntity<>(request.toString(), headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                HF_API_URL, HttpMethod.POST, entity, String.class);
            
            JSONArray jsonResponse = new JSONArray(response.getBody());
            return jsonResponse.getJSONObject(0).getString("generated_text");
            
        } catch (Exception e) {
            System.err.println("Erreur API: " + e.getMessage());
            return "Réponse d'après le guide: " + context.substring(0, 200) + "...";
        }
    }

    private String fallbackSearch(String question) {
        // Recherche locale sans IA
        for (String section : pdfSections.values()) {
            if (section.toLowerCase().contains(question.toLowerCase())) {
                return "Extrait pertinent du guide:\n" + 
                       section.substring(0, Math.min(section.length(), 300));
            }
        }
        return "Je n'ai pas trouvé de réponse dans le guide. Essayez avec une référence GNE (ex: EVT/01).";
    }
}