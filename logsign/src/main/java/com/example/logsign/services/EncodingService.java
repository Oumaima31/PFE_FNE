package com.example.logsign.services;

import org.springframework.stereotype.Service;

@Service
public class EncodingService {

    /**
     * Corrige les caractères mal encodés dans une chaîne de texte
     * @param text Le texte à corriger
     * @return Le texte avec les caractères corrigés
     */
    public String fixEncoding(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }
        
        // Table de correspondance pour les caractères mal encodés
        return text
            .replace("RÚfÚrence", "Référence")
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
            .replace("Æ", "'")
            .replace("Ê", "ê")
            .replace("Ë", "ë")
            .replace("Ï", "ï")
            .replace("Ô", "ô")
            .replace("Û", "û")
            .replace("Ü", "ü")
            .replace("Ÿ", "ÿ");
    }
}
