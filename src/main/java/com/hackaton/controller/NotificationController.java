package com.hackaton.controller;

import com.hackaton.dto.response.NotificationResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMesNotifications(
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(notificationService.getMesNotifications(etudiant.getId()));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> countNonLues(
            @AuthenticationPrincipal Etudiant etudiant) {
        return ResponseEntity.ok(Map.of("count", notificationService.countNonLues(etudiant.getId())));
    }

    @PatchMapping("/{id}/lue")
    public ResponseEntity<Void> marquerLue(@PathVariable Long id) {
        notificationService.marquerLue(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/toutes-lues")
    public ResponseEntity<Void> marquerToutesLues(@AuthenticationPrincipal Etudiant etudiant) {
        notificationService.marquerToutesLues(etudiant.getId());
        return ResponseEntity.noContent().build();
    }
}
