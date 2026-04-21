package com.hackaton.service;

import com.hackaton.dto.response.NotificationResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.entity.Notification;
import com.hackaton.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifier(Etudiant destinataire, String type, String contenu, Long refId, String refType) {
        // Ne pas notifier soi-même
        Notification n = Notification.builder()
                .destinataire(destinataire)
                .type(type)
                .contenu(contenu)
                .refId(refId)
                .refType(refType)
                .build();
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMesNotifications(Long etudiantId) {
        return notificationRepository.findByDestinataireIdOrderByDateDesc(etudiantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void marquerLue(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setLue(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void marquerToutesLues(Long etudiantId) {
        notificationRepository.findByDestinataireIdOrderByDateDesc(etudiantId)
                .stream().filter(n -> !n.isLue()).forEach(n -> {
                    n.setLue(true);
                    notificationRepository.save(n);
                });
    }

    @Transactional(readOnly = true)
    public long countNonLues(Long etudiantId) {
        return notificationRepository.countByDestinataireIdAndLueFalse(etudiantId);
    }

    public NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .contenu(n.getContenu())
                .lue(n.isLue())
                .date(n.getDate())
                .refId(n.getRefId())
                .refType(n.getRefType())
                .build();
    }
}
