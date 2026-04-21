package com.hackaton.controller;

import com.hackaton.dto.request.LiveRequest;
import com.hackaton.dto.response.LivePageResponse;
import com.hackaton.dto.response.LiveResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.service.LiveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lives")
@RequiredArgsConstructor
public class LiveController {

    private final LiveService liveService;

    @GetMapping
    public ResponseEntity<List<LiveResponse>> getLivesActifs() {
        return ResponseEntity.ok(liveService.getLivesActifs());
    }

    @PostMapping
    public ResponseEntity<LiveResponse> creer(
            @Valid @RequestBody LiveRequest request,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.creer(request, etudiant.getId()));
    }

    @PostMapping("/{id}/demarrer")
    public ResponseEntity<LiveResponse> demarrer(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.demarrer(id, etudiant.getId()));
    }

    @PostMapping("/{id}/arreter")
    public ResponseEntity<LiveResponse> arreter(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.arreter(id, etudiant.getId()));
    }

    @PostMapping("/{id}/rejoindre")
    public ResponseEntity<LiveResponse> rejoindre(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.rejoindre(id, etudiant.getId()));
    }

    @PostMapping("/{id}/quitter")
    public ResponseEntity<LiveResponse> quitter(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.quitter(id, etudiant.getId()));
    }

    @PostMapping("/{id}/main/{intervenantId}")
    public ResponseEntity<LiveResponse> donnerMain(
            @PathVariable Long id,
            @PathVariable Long intervenantId,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.donnerMain(id, intervenantId, etudiant.getId()));
    }

    @DeleteMapping("/{id}/main/{intervenantId}")
    public ResponseEntity<LiveResponse> retirerMain(
            @PathVariable Long id,
            @PathVariable Long intervenantId,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.retirerMain(id, intervenantId, etudiant.getId()));
    }

    @GetMapping("/{id}/pages")
    public ResponseEntity<List<LivePageResponse>> getPages(@PathVariable Long id) {
        return ResponseEntity.ok(liveService.getPages(id));
    }

    @PostMapping("/{id}/pages")
    public ResponseEntity<LivePageResponse> ajouterPage(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.ajouterPage(id, etudiant.getId()));
    }

    @PutMapping("/{id}/pages/{pageNum}")
    public ResponseEntity<LivePageResponse> sauvegarderPage(
            @PathVariable Long id,
            @PathVariable int pageNum,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.sauvegarderPage(id, pageNum, body.get("contenuJson"), etudiant.getId()));
    }

    @PatchMapping("/{id}/pages/{pageNum}/active")
    public ResponseEntity<LiveResponse> changerPage(
            @PathVariable Long id,
            @PathVariable int pageNum,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(liveService.changerPage(id, pageNum, etudiant.getId()));
    }
}
