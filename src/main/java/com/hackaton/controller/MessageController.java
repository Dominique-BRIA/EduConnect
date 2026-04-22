package com.hackaton.controller;

import com.hackaton.dto.request.MessageRequest;
import com.hackaton.dto.response.MessageResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageResponse> envoyer(
            @RequestBody MessageRequest request,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(messageService.envoyer(request, etudiant.getId()));
    }

    @GetMapping("/conversation/{contactId}")
    public ResponseEntity<List<MessageResponse>> getConversation(
            @PathVariable Long contactId,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(messageService.getConversation(etudiant.getId(), contactId));
    }

    @PatchMapping("/conversation/{contactId}/lu")
    public ResponseEntity<Void> marquerLus(
            @PathVariable Long contactId,
            @AuthenticationPrincipal Etudiant etudiant) {
        messageService.marquerLus(contactId, etudiant.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<Long>> getContacts(@AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(messageService.getContactIds(etudiant.getId()));
    }
}
