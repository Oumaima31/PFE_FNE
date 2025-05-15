package com.example.logsign.services;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.json.*;

import java.io.InputStream;
import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;

@Service
public class PdfService {

    @Autowired
    private EncodingService encodingService;

    // Modèle plus puissant pour de meilleures réponses
    private static final String HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-xxl";
    private static final String API_KEY = "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";
    
    // Structures de données pour stocker les informations du guide GNE
    private Map<String, EventInfo> eventsByReference = new HashMap<>();
    private Map<String, Set<String>> keywordsToReferences = new HashMap<>();
    private Map<String, Set<String>> synonymsMap = new HashMap<>();
    
    // Cache pour les réponses fréquentes
    private Map<String, String> responseCache = new HashMap<>();

    public String getAnswerFromPdf(String question) {
        try {
            if (eventsByReference.isEmpty()) {
                loadAndStructurePdf();
                initializeSynonyms();
            }
            
            // Normaliser la question
            String normalizedQuestion = normalizeQuestion(question);
            
            // Vérifier le cache pour les questions fréquentes
            if (responseCache.containsKey(normalizedQuestion)) {
            return fixEncoding(responseCache.get(normalizedQuestion));
        }
        
        // Recherche directe par référence (ex: EVT/01, ING/08)
        String referenceAnswer = findByDirectReference(question);
        if (referenceAnswer != null) {
            String fixedAnswer = fixEncoding(referenceAnswer);
            cacheResponse(normalizedQuestion, fixedAnswer);
            return fixedAnswer;
        }
        
        // Recherche par mots-clés et synonymes
        String keywordAnswer = findByKeywords(question);
        if (keywordAnswer != null) {
            String fixedAnswer = fixEncoding(keywordAnswer);
            cacheResponse(normalizedQuestion, fixedAnswer);
            return fixedAnswer;
        }
        
        // Si aucune correspondance directe, utiliser l'IA pour générer une réponse
        String context = findRelevantContext(question);
        String aiAnswer = askAI(question, context);
        
        String fixedAnswer = fixEncoding(aiAnswer);
        cacheResponse(normalizedQuestion, fixedAnswer);
        return fixedAnswer;
            
        } catch (Exception e) {
            e.printStackTrace();
            return "Désolé, je n'ai pas pu traiter votre demande. Erreur: " + e.getMessage();
        }
    }

    private void loadAndStructurePdf() throws Exception {
        try (InputStream input = getClass().getResourceAsStream("/chatbot/guideGNE.pdf");
             PDDocument document = PDDocument.load(input)) {
             
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            stripper.setLineSeparator("\n");
            String fullText = stripper.getText(document);
            
            // Nettoyer le texte des caractères mal encodés
            fullText = encodingService.fixEncoding(fullText);
            
            // Extraire les sections d'événements avec leurs références
            Pattern eventPattern = Pattern.compile("((?:ACCID|ING|INC|EVT)/\\d+)\\s*\\n([^\\n]+)\\n");
            Matcher eventMatcher = eventPattern.matcher(fullText);
            
            while (eventMatcher.find()) {
                String reference = eventMatcher.group(1);
                String description = eventMatcher.group(2).trim();
                
                // Extraire le texte complet de la section
                int startPos = eventMatcher.start();
                int endPos = fullText.indexOf("\nPage ", startPos);
                if (endPos == -1) {
                    endPos = fullText.indexOf("\n\n\n", startPos);
                }
                if (endPos == -1) {
                    endPos = startPos + 1000; // Limiter à 1000 caractères si on ne trouve pas la fin
                }
                
                String fullSection = fullText.substring(startPos, Math.min(endPos, fullText.length())).trim();
                
                // Créer un objet EventInfo pour stocker les informations de l'événement
                EventInfo eventInfo = new EventInfo(reference, description, fullSection);
                eventsByReference.put(reference, eventInfo);
                
                // Indexer les mots-clés pour la recherche
                indexKeywords(reference, description);
            }
            
            System.out.println("Chargement du guide GNE terminé. " + eventsByReference.size() + " événements indexés.");
        }
    }
    
    private void indexKeywords(String reference, String description) {
        // Extraire les mots-clés de la description (mots de plus de 3 lettres)
        String[] words = description.toLowerCase().split("\\s+");
        for (String word : words) {
            if (word.length() > 3) {
                // Nettoyer le mot
                word = word.replaceAll("[.,;:!?()]", "").trim();
                if (word.length() > 3) {
                    // Ajouter le mot-clé à l'index
                    Set<String> references = keywordsToReferences.getOrDefault(word, new HashSet<>());
                    references.add(reference);
                    keywordsToReferences.put(word, references);
                }
            }
        }
    }
    
    private void initializeSynonyms() {
        // Dictionnaire de synonymes pour améliorer la recherche
        addSynonyms("accident", "crash", "collision", "catastrophe", "écrasement");
        addSynonyms("incident", "événement", "occurrence", "fait", "situation");
        addSynonyms("grave", "sérieux", "important", "majeur", "significatif");
        addSynonyms("aéronef", "avion", "appareil", "aéroplane", "engin volant", "aérostat");
        addSynonyms("météo", "météorologie", "conditions météorologiques", "climat", "temps");
        addSynonyms("piste", "runway", "voie", "bande d'atterrissage");
        addSynonyms("pilote", "commandant", "aviateur", "conducteur");
        addSynonyms("contrôleur", "aiguilleur du ciel", "opérateur", "régulateur");
        addSynonyms("vol", "trajet aérien", "voyage", "déplacement");
        addSynonyms("atterrissage", "touchdown", "arrivée", "descente");
        addSynonyms("décollage", "envol", "départ", "montée");
        addSynonyms("équipage", "personnel navigant", "crew", "équipe de bord");
        addSynonyms("passager", "voyageur", "client", "usager");
        addSynonyms("défaillance", "panne", "dysfonctionnement", "problème", "mauvais fonctionnement");
        addSynonyms("communication", "transmission", "radio", "message", "contact");
        addSynonyms("surveillance", "radar", "contrôle", "suivi");
        addSynonyms("navigation", "guidage", "orientation", "direction");
        addSynonyms("foudre", "éclair", "foudroiement", "orage");
        addSynonyms("givre", "glace", "gel", "givrage");
        addSynonyms("hydrocarbure", "carburant", "essence", "kérosène", "fuel");
        addSynonyms("incendie", "feu", "combustion", "embrasement");
        addSynonyms("retard", "délai", "attente", "report");
        addSynonyms("déroutement", "diversion", "détournement", "changement de destination");
        addSynonyms("retour", "revenir", "faire demi-tour");
        addSynonyms("laser", "rayon", "faisceau lumineux");
        addSynonyms("oiseau", "volatile", "animal", "faune");
        addSynonyms("remise de gaz", "approche interrompue", "go-around");
        addSynonyms("technique", "mécanique", "équipement", "système");
        addSynonyms("impact", "collision", "choc", "heurt");
    }
    
    private void addSynonyms(String word, String... synonyms) {
        Set<String> synonymSet = new HashSet<>(Arrays.asList(synonyms));
        synonymsMap.put(word.toLowerCase(), synonymSet);
        
        // Ajouter également les relations inverses pour une recherche bidirectionnelle
        for (String synonym : synonyms) {
            Set<String> inverseSet = synonymsMap.getOrDefault(synonym.toLowerCase(), new HashSet<>());
            inverseSet.add(word.toLowerCase());
            synonymsMap.put(synonym.toLowerCase(), inverseSet);
        }
    }
    
    private String normalizeQuestion(String question) {
        // Normaliser la question pour le cache (minuscules, sans ponctuation)
        return question.toLowerCase()
                .replaceAll("[.,;:!?]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }
    
    private String findByDirectReference(String question) {
        // Rechercher une référence directe dans la question (ex: EVT/01, ING/08)
        Pattern refPattern = Pattern.compile("((?:ACCID|ING|INC|EVT)/\\d+)");
        Matcher matcher = refPattern.matcher(question);
        
        if (matcher.find()) {
            String reference = matcher.group(1);
            EventInfo eventInfo = eventsByReference.get(reference);
            
            if (eventInfo != null) {
                return formatEventResponse(eventInfo);
            }
        }
        
        return null;
    }
    
    private String findByKeywords(String question) {
        // Enrichir la question avec des synonymes
        Set<String> searchTerms = new HashSet<>();
        String[] words = question.toLowerCase().split("\\s+");
        
        for (String word : words) {
            // Nettoyer le mot
            word = word.replaceAll("[.,;:!?()]", "").trim();
            if (word.length() > 3) {
                searchTerms.add(word);
                
                // Ajouter les synonymes
                Set<String> synonyms = synonymsMap.getOrDefault(word, Collections.emptySet());
                searchTerms.addAll(synonyms);
            }
        }
        
        // Calculer les scores pour chaque référence
        Map<String, Integer> referenceScores = new HashMap<>();
        
        for (String term : searchTerms) {
            Set<String> references = keywordsToReferences.getOrDefault(term, Collections.emptySet());
            for (String reference : references) {
                int currentScore = referenceScores.getOrDefault(reference, 0);
                referenceScores.put(reference, currentScore + 1);
            }
        }
        
        // Trouver la référence avec le score le plus élevé
        if (!referenceScores.isEmpty()) {
            String bestReference = referenceScores.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
            
            if (bestReference != null) {
                EventInfo eventInfo = eventsByReference.get(bestReference);
                if (eventInfo != null) {
                    return formatEventResponse(eventInfo);
                }
            }
        }
        
        return null;
    }
    
    private String findRelevantContext(String question) {
        // Enrichir la question avec des synonymes
        Set<String> searchTerms = new HashSet<>();
        String[] words = question.toLowerCase().split("\\s+");
        
        for (String word : words) {
            // Nettoyer le mot
            word = word.replaceAll("[.,;:!?()]", "").trim();
            if (word.length() > 3) {
                searchTerms.add(word);
                
                // Ajouter les synonymes
                Set<String> synonyms = synonymsMap.getOrDefault(word, Collections.emptySet());
                searchTerms.addAll(synonyms);
            }
        }
        
        // Calculer les scores pour chaque référence
        Map<String, Integer> referenceScores = new HashMap<>();
        
        for (String term : searchTerms) {
            Set<String> references = keywordsToReferences.getOrDefault(term, Collections.emptySet());
            for (String reference : references) {
                int currentScore = referenceScores.getOrDefault(reference, 0);
                referenceScores.put(reference, currentScore + 1);
            }
        }
        
        // Récupérer les 3 meilleures références
        List<String> bestReferences = referenceScores.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        // Construire le contexte à partir des meilleures références
        StringBuilder contextBuilder = new StringBuilder();
        for (String reference : bestReferences) {
            EventInfo eventInfo = eventsByReference.get(reference);
            if (eventInfo != null) {
                contextBuilder.append(reference).append(": ").append(eventInfo.getDescription()).append("\n\n");
            }
        }
        
        // Si aucun contexte n'a été trouvé, utiliser quelques événements aléatoires
        if (contextBuilder.length() == 0) {
            List<EventInfo> randomEvents = eventsByReference.values().stream()
                    .limit(3)
                    .collect(Collectors.toList());
            
            for (EventInfo eventInfo : randomEvents) {
                contextBuilder.append(eventInfo.getReference()).append(": ").append(eventInfo.getDescription()).append("\n\n");
            }
        }
        
        return contextBuilder.toString();
    }
    
    // Modifier la méthode formatEventResponse pour ajouter une correction d'encodage supplémentaire
private String formatEventResponse(EventInfo eventInfo) {
    StringBuilder response = new StringBuilder();
    response.append("Référence: ").append(eventInfo.getReference()).append("\n\n");
    response.append("Description: ").append(eventInfo.getDescription()).append("\n\n");
    
    // Ajouter des informations supplémentaires si disponibles
    String fullSection = eventInfo.getFullSection();
    if (fullSection != null && !fullSection.isEmpty()) {
        // Extraire des informations supplémentaires pertinentes
        Pattern refPattern = Pattern.compile("Référence réglementaire[^\\n]+");
        Matcher refMatcher = refPattern.matcher(fullSection);
        if (refMatcher.find()) {
            response.append("Référence réglementaire: ").append(refMatcher.group().replace("Référence réglementaire :", "").trim()).append("\n\n");
        }
        
        // Ajouter des informations sur la notification
        if (fullSection.contains("Notification par FNE")) {
            response.append("Cet événement nécessite une notification par Fiche de Notification d'Événement (FNE).\n\n");
        }
    }
    
    // Corriger les caractères mal encodés dans la réponse finale
    String result = response.toString();
    result = result.replace("RÚfÚrence", "Référence")
                  .replace("ÚvÚnement", "événement")
                  .replace("Ú", "é")
                  .replace("È", "è")
                  .replace("À", "à")
                  .replace("Ç", "ç")
                  .replace("dÆoiseau", "d'oiseau")
                  .replace("dÚfaut", "défaut")
                  .replace("systÞme", "système")
                  .replace("rÚglementaire", "réglementaire")
                  .replace("provoquÚ", "provoqué")
                  .replace("Þ", "è")
                  .replace("Æ", "'");
    
    return result;
}
    
    private String askAI(String question, String context) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + API_KEY);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Construire un prompt plus sophistiqué
            String enhancedPrompt = buildEnhancedPrompt(question, context);
            
            JSONObject request = new JSONObject();
            request.put("inputs", enhancedPrompt);
            request.put("parameters", new JSONObject()
                    .put("max_length", 300)
                    .put("temperature", 0.7));
            
            HttpEntity<String> entity = new HttpEntity<>(request.toString(), headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                HF_API_URL, HttpMethod.POST, entity, String.class);
            
            JSONArray jsonResponse = new JSONArray(response.getBody());
            String generatedText = jsonResponse.getJSONObject(0).getString("generated_text");
            
            // Post-traitement de la réponse
            return postProcessResponse(generatedText);
            
        } catch (Exception e) {
            System.err.println("Erreur API: " + e.getMessage());
            return "Désolé, je n'ai pas trouvé d'information spécifique sur votre question dans le guide GNE. Essayez de reformuler votre question ou de préciser une référence (ex: EVT/01, ING/08).";
        }
    }
    
    private String buildEnhancedPrompt(String question, String context) {
        return "Tu es un assistant spécialisé dans le Guide de Notification d'Événements (GNE) pour l'aviation. " +
               "Réponds de manière précise et professionnelle à la question suivante en te basant sur le contexte fourni. " +
               "Si tu ne connais pas la réponse exacte, indique-le clairement.\n\n" +
               "Question: " + question + "\n\n" +
               "Contexte du Guide GNE: " + context + "\n\n" +
               "Réponse:";
    }
    
    // Modifier la méthode postProcessResponse pour corriger l'encodage
private String postProcessResponse(String response) {
    // Améliorer la qualité de la réponse
    
    // 1. Supprimer les préfixes inutiles
    response = response.replaceAll("^(Réponse:|Voici ma réponse:|Je vais répondre à votre question:)", "").trim();
    
    // 2. Ajouter un préfixe personnalisé si nécessaire
    if (!response.startsWith("D'après le Guide GNE") && !response.startsWith("Selon le Guide GNE")) {
        response = "D'après le Guide GNE: " + response;
    }
    
    // 3. Corriger l'encodage
    return fixEncoding(response);
}
    
    private void cacheResponse(String question, String answer) {
        // Mettre en cache la réponse si elle est de bonne qualité (plus de 50 caractères)
        if (answer.length() > 50) {
            responseCache.put(question, answer);
        }
    }
    
    // Classe interne pour stocker les informations d'un événement
    private static class EventInfo {
        private final String reference;
        private final String description;
        private final String fullSection;
        
        public EventInfo(String reference, String description, String fullSection) {
            this.reference = reference;
            this.description = description;
            this.fullSection = fullSection;
        }
        
        public String getReference() {
            return reference;
        }
        
        public String getDescription() {
            return description;
        }
        
        public String getFullSection() {
            return fullSection;
        }
    }

    // Ajouter une méthode pour corriger l'encodage dans toutes les réponses
private String fixEncoding(String text) {
    if (text == null) return "";
    
    return text.replace("RÚfÚrence", "Référence")
              .replace("ÚvÚnement", "événement")
              .replace("Ú", "é")
              .replace("È", "è")
              .replace("À", "à")
              .replace("Ç", "ç")
              .replace("dÆoiseau", "d'oiseau")
              .replace("dÚfaut", "défaut")
              .replace("systÞme", "système")
              .replace("rÚglementaire", "réglementaire")
              .replace("provoquÚ", "provoqué")
              .replace("Þ", "è")
              .replace("Æ", "'");
}
}
