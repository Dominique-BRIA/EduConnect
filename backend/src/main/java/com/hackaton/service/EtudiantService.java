package com.hackaton.service;

import com.hackaton.dto.response.EtudiantResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.exception.ResourceNotFoundException;
import com.hackaton.repository.EtudiantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EtudiantService {

    private final EtudiantRepository etudiantRepository;
    private final EtudiantMapper etudiantMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public EtudiantResponse getProfil(Long id) {
        return etudiantMapper.toResponse(getOrThrow(id));
    }

    @Transactional
    public EtudiantResponse suivre(Long suiviId, Long abonneId) {
        Etudiant suivi = getOrThrow(suiviId);
        Etudiant abonne = getOrThrow(abonneId);
        abonne.getAbonnements().add(suivi);
        etudiantRepository.save(abonne);
        notificationService.notifier(suivi, "ABONNEMENT",
                abonne.getPrenom() + " s'est abonné à vous", abonneId, "ETUDIANT");
        return etudiantMapper.toResponse(suivi);
    }

    @Transactional
    public EtudiantResponse seDesabonner(Long suiviId, Long abonneId) {
        Etudiant suivi = getOrThrow(suiviId);
        Etudiant abonne = getOrThrow(abonneId);
        abonne.getAbonnements().removeIf(e -> e.getId().equals(suiviId));
        etudiantRepository.save(abonne);
        return etudiantMapper.toResponse(suivi);
    }

    @Transactional(readOnly = true)
    public List<EtudiantResponse> rechercher(String query) {
        return etudiantRepository.search(query)
                .stream().map(etudiantMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<EtudiantResponse> getAbonnements(Long id) {
        return getOrThrow(id).getAbonnements()
                .stream().map(etudiantMapper::toResponse).toList();
    }

    private Etudiant getOrThrow(Long id) {
        return etudiantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Étudiant introuvable"));
    }
}
