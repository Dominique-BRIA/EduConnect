package com.hackaton.service;

import com.hackaton.dto.request.LiveRequest;
import com.hackaton.dto.response.LivePageResponse;
import com.hackaton.dto.response.LiveResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.entity.Live;
import com.hackaton.entity.LivePage;
import com.hackaton.entity.Publication;
import com.hackaton.enums.LiveStatut;
import com.hackaton.exception.BadRequestException;
import com.hackaton.exception.ResourceNotFoundException;
import com.hackaton.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LiveService {

    private final LiveRepository liveRepository;
    private final LivePageRepository livePageRepository;
    private final EtudiantRepository etudiantRepository;
    private final PublicationRepository publicationRepository;
    private final EtudiantMapper etudiantMapper;
    private final NotificationService notificationService;

    @Transactional
    public LiveResponse creer(LiveRequest req, Long createurId) {
        Etudiant createur = etudiantRepository.findById(createurId).orElseThrow();
        Publication pub = null;
        if (req.getPublicationId() != null) {
            pub = publicationRepository.findById(req.getPublicationId()).orElse(null);
        }
        Live live = Live.builder()
                .titre(req.getTitre())
                .createur(createur)
                .publication(pub)
                .build();
        live.getParticipants().add(createur);
        live.getIntervenants().add(createur);
        Live saved = liveRepository.save(live);

        // Créer la première page
        LivePage page0 = LivePage.builder()
                .numero(0)
                .live(saved)
                .build();
        livePageRepository.save(page0);
        saved.getPages().add(page0);

        return toResponse(saved);
    }

    @Transactional
    public LiveResponse demarrer(Long liveId, Long createurId) {
        Live live = getOrThrow(liveId);
        checkCreateur(live, createurId);
        live.setStatut(LiveStatut.ACTIF);
        // Notifier les abonnés du créateur
        live.getCreateur().getAbonnements().forEach(abonne ->
            notificationService.notifier(abonne, "LIVE_DEBUT",
                live.getCreateur().getPrenom() + " a démarré un live : " + live.getTitre(),
                liveId, "LIVE"));
        return toResponse(liveRepository.save(live));
    }

    @Transactional
    public LiveResponse arreter(Long liveId, Long createurId) {
        Live live = getOrThrow(liveId);
        checkCreateur(live, createurId);
        live.setStatut(LiveStatut.TERMINE);
        live.setDateFin(LocalDateTime.now());
        return toResponse(liveRepository.save(live));
    }

    @Transactional
    public LiveResponse rejoindre(Long liveId, Long etudiantId) {
        Live live = getOrThrow(liveId);
        if (live.getStatut() != LiveStatut.ACTIF)
            throw new BadRequestException("Le live n'est pas actif");
        Etudiant e = etudiantRepository.findById(etudiantId).orElseThrow();
        live.getParticipants().add(e);
        return toResponse(liveRepository.save(live));
    }

    @Transactional
    public LiveResponse quitter(Long liveId, Long etudiantId) {
        Live live = getOrThrow(liveId);
        live.getParticipants().removeIf(p -> p.getId().equals(etudiantId));
        live.getIntervenants().removeIf(p -> p.getId().equals(etudiantId));
        return toResponse(liveRepository.save(live));
    }

    @Transactional
    public LiveResponse donnerMain(Long liveId, Long intervenantId, Long createurId) {
        Live live = getOrThrow(liveId);
        checkCreateur(live, createurId);
        Etudiant intervenant = etudiantRepository.findById(intervenantId).orElseThrow();
        if (!live.getParticipants().contains(intervenant))
            throw new BadRequestException("L'étudiant n'est pas participant");
        live.getIntervenants().add(intervenant);
        return toResponse(liveRepository.save(live));
    }

    @Transactional
    public LiveResponse retirerMain(Long liveId, Long intervenantId, Long createurId) {
        Live live = getOrThrow(liveId);
        checkCreateur(live, createurId);
        live.getIntervenants().removeIf(p -> p.getId().equals(intervenantId));
        return toResponse(liveRepository.save(live));
    }

    @Transactional
    public LivePageResponse ajouterPage(Long liveId, Long intervenantId) {
        Live live = getOrThrow(liveId);
        checkIntervenant(live, intervenantId);
        int numero = livePageRepository.countByLiveId(liveId);
        LivePage page = LivePage.builder()
                .numero(numero)
                .live(live)
                .build();
        live.setNombrePages(numero + 1);
        live.setPageActuelle(numero);
        liveRepository.save(live);
        return toPageResponse(livePageRepository.save(page));
    }

    @Transactional
    public LivePageResponse sauvegarderPage(Long liveId, int pageNum, String contenuJson, Long intervenantId) {
        Live live = getOrThrow(liveId);
        checkIntervenant(live, intervenantId);
        LivePage page = livePageRepository.findByLiveIdAndNumero(liveId, pageNum)
                .orElseThrow(() -> new ResourceNotFoundException("Page introuvable"));
        page.setContenuJson(contenuJson);
        page.setDateDerniereSave(LocalDateTime.now());
        return toPageResponse(livePageRepository.save(page));
    }

    @Transactional
    public LiveResponse changerPage(Long liveId, int pageNum, Long intervenantId) {
        Live live = getOrThrow(liveId);
        checkIntervenant(live, intervenantId);
        if (pageNum < 0 || pageNum >= live.getNombrePages())
            throw new BadRequestException("Numéro de page invalide");
        live.setPageActuelle(pageNum);
        return toResponse(liveRepository.save(live));
    }

    @Transactional(readOnly = true)
    public List<LivePageResponse> getPages(Long liveId) {
        return livePageRepository.findByLiveIdOrderByNumeroAsc(liveId)
                .stream().map(this::toPageResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<LiveResponse> getLivesActifs() {
        return liveRepository.findByStatutOrderByDateDebutDesc(LiveStatut.ACTIF)
                .stream().map(this::toResponse).toList();
    }

    private Live getOrThrow(Long id) {
        return liveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Live introuvable"));
    }

    private void checkCreateur(Live live, Long userId) {
        if (!live.getCreateur().getId().equals(userId))
            throw new AccessDeniedException("Seul le créateur peut effectuer cette action");
    }

    private void checkIntervenant(Live live, Long userId) {
        boolean isIntervenant = live.getIntervenants().stream().anyMatch(i -> i.getId().equals(userId));
        if (!isIntervenant)
            throw new AccessDeniedException("Vous n'avez pas la main");
    }

    public LiveResponse toResponse(Live l) {
        return LiveResponse.builder()
                .id(l.getId())
                .titre(l.getTitre())
                .urlFlux(l.getUrlFlux())
                .statut(l.getStatut())
                .dateDebut(l.getDateDebut())
                .dateFin(l.getDateFin())
                .pageActuelle(l.getPageActuelle())
                .nombrePages(l.getNombrePages())
                .createur(etudiantMapper.toResponse(l.getCreateur()))
                .participants(l.getParticipants().stream().map(etudiantMapper::toResponse).toList())
                .intervenants(l.getIntervenants().stream().map(etudiantMapper::toResponse).toList())
                .publicationId(l.getPublication() != null ? l.getPublication().getId() : null)
                .build();
    }

    public LivePageResponse toPageResponse(LivePage p) {
        return LivePageResponse.builder()
                .id(p.getId())
                .numero(p.getNumero())
                .contenuJson(p.getContenuJson())
                .dateCreation(p.getDateCreation())
                .dateDerniereSave(p.getDateDerniereSave())
                .build();
    }
}
