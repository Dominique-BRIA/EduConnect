package com.hackaton.controller;

import com.hackaton.dto.request.CommentaireRequest;
import com.hackaton.dto.request.PublicationRequest;
import com.hackaton.dto.response.*;
import com.hackaton.entity.Etudiant;
import com.hackaton.service.CommentaireService;
import com.hackaton.service.PublicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publications")
@RequiredArgsConstructor
public class PublicationController {

    private final PublicationService publicationService;
    private final CommentaireService commentaireService;

    @GetMapping("/fil")
    public ResponseEntity<PageResponse<PublicationResponse>> getFilActualite(
            @AuthenticationPrincipal Etudiant etudiant,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(publicationService.getFilActualite(etudiant.getId(), page, size));
    }

    @GetMapping("/etudiant/{id}")
    public ResponseEntity<PageResponse<PublicationResponse>> getByEtudiant(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(publicationService.getPublicationsEtudiant(id, etudiant.getId(), page, size));
    }

    @PostMapping
    public ResponseEntity<PublicationResponse> creer(
            @RequestBody PublicationRequest request,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(publicationService.creer(request, etudiant.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PublicationResponse> modifier(
            @PathVariable Long id,
            @RequestBody PublicationRequest request,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(publicationService.modifier(id, request, etudiant.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        publicationService.supprimer(id, etudiant.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/resolu")
    public ResponseEntity<PublicationResponse> marquerResolu(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(publicationService.marquerResolu(id, etudiant.getId()));
    }

    @PostMapping("/{id}/liker")
    public ResponseEntity<PublicationResponse> liker(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(publicationService.liker(id, etudiant.getId()));
    }

    // Commentaires
    @GetMapping("/{id}/commentaires")
    public ResponseEntity<List<CommentaireResponse>> getCommentaires(@PathVariable Long id) {
        return ResponseEntity.ok(commentaireService.getByPublication(id));
    }

    @PostMapping("/{id}/commentaires")
    public ResponseEntity<CommentaireResponse> commenter(
            @PathVariable Long id,
            @RequestBody CommentaireRequest request,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(commentaireService.commenter(id, request, etudiant.getId()));
    }

    @DeleteMapping("/commentaires/{commentaireId}")
    public ResponseEntity<Void> supprimerCommentaire(
            @PathVariable Long commentaireId,
            @AuthenticationPrincipal Etudiant etudiant) {
        commentaireService.supprimer(commentaireId, etudiant.getId());
        return ResponseEntity.noContent().build();
    }
}
