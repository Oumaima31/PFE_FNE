package com.example.logsign.controllers;

import com.example.logsign.services.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @Autowired
    private PdfService pdfService;

    @PostMapping
    public String askQuestion(@RequestBody String question) {
        return pdfService.getAnswerFromPdf(question);
    }
}