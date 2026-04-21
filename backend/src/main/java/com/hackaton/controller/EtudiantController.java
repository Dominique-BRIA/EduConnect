package com.hackaton.controller;

import com.hackaton.dto.response.EtudiantResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.service.EtudiantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/etudiants")
@RequiredArgsConstructor
public class EtudiantController {

    private final EtudiantService etudiantService;

    @GetMapping("/me")
    public ResponseEntity<EtudiantResponse> getMe(@AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(etudiantService.getProfil(etudiant.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EtudiantResponse> getProfil(@PathVariable Long id) {
        return ResponseEntity.ok(etudiantService.getProfil(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<EtudiantResponse>> rechercher(@RequestParam String q) {
        return ResponseEntity.ok(etudiantService.rechercher(q));
    }

    @PostMapping("/{id}/suivre")
    public ResponseEntity<EtudiantResponse> suivre(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(etudiantService.suivre(id, etudiant.getId()));
    }

    @DeleteMapping("/{id}/suivre")
    public ResponseEntity<EtudiantResponse> seDesabonner(
            @PathVariable Long id,
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(etudiantService.seDesabonner(id, etudiant.getId()));
    }

    @GetMapping("/me/abonnements")
    public ResponseEntity<List<EtudiantResponse>> getAbonnements(@AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(etudiantService.getAbonnements(etudiant.getId()));
    }
}
