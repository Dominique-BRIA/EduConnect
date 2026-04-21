package com.hackaton.service;

import com.hackaton.dto.request.PublicationRequest;
import com.hackaton.dto.response.PageResponse;
import com.hackaton.dto.response.PublicationResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.entity.Publication;
import com.hackaton.exception.BadRequestException;
import com.hackaton.exception.ResourceNotFoundException;
import com.hackaton.repository.EtudiantRepository;
import com.hackaton.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final EtudiantRepository etudiantRepository;
    private final EtudiantMapper etudiantMapper;
    private final NotificationService notificationService;

    @Transactional
    public PublicationResponse creer(PublicationRequest req, Long auteurId) {
        Etudiant auteur = etudiantRepository.findById(auteurId)
                .orElseThrow(() -> new ResourceNotFoundException("Étudiant introuvable"));
        Publication p = Publication.builder()
                .texte(req.getTexte())
                .urlImage(req.getUrlImage())
                .visibilite(req.getVisibilite())
                .auteur(auteur)
                .build();
        return toResponse(publicationRepository.save(p), auteurId);
    }

    @Transactional
    public PublicationResponse modifier(Long id, PublicationRequest req, Long auteurId) {
        Publication p = getOrThrow(id);
        checkOwner(p, auteurId);
        p.setTexte(req.getTexte());
        p.setUrlImage(req.getUrlImage());
        p.setVisibilite(req.getVisibilite());
        return toResponse(publicationRepository.save(p), auteurId);
    }

    @Transactional
    public void supprimer(Long id, Long auteurId) {
        Publication p = getOrThrow(id);
        checkOwner(p, auteurId);
        publicationRepository.delete(p);
    }

    @Transactional
    public PublicationResponse marquerResolu(Long id, Long auteurId) {
        Publication p = getOrThrow(id);
        checkOwner(p, auteurId);
        p.setResolu(true);
        return toResponse(publicationRepository.save(p), auteurId);
    }

    @Transactional
    public PublicationResponse liker(Long id, Long etudiantId) {
        Publication p = getOrThrow(id);
        Etudiant e = etudiantRepository.findById(etudiantId).orElseThrow();
        boolean dejalie = p.getLikedBy().stream().anyMatch(x -> x.getId().equals(etudiantId));
        if (dejalie) {
            p.getLikedBy().removeIf(x -> x.getId().equals(etudiantId));
            p.setLikes(p.getLikes() - 1);
        } else {
            p.getLikedBy().add(e);
            p.setLikes(p.getLikes() + 1);
            notificationService.notifier(p.getAuteur(), "LIKE",
                    e.getPrenom() + " a aimé votre publication", id, "PUBLICATION");
        }
        return toResponse(publicationRepository.save(p), etudiantId);
    }

    @Transactional(readOnly = true)
    public PageResponse<PublicationResponse> getFilActualite(Long etudiantId, int page, int size) {
        Page<Publication> publications = publicationRepository.findFilActualite(
                etudiantId, PageRequest.of(page, size));
        return toPageResponse(publications, etudiantId);
    }

    @Transactional(readOnly = true)
    public PageResponse<PublicationResponse> getPublicationsEtudiant(Long auteurId, Long meId, int page, int size) {
        Page<Publication> publications = publicationRepository
                .findByAuteurIdOrderByDatePublicationDesc(auteurId, PageRequest.of(page, size));
        return toPageResponse(publications, meId);
    }

    private Publication getOrThrow(Long id) {
        return publicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publication introuvable"));
    }

    private void checkOwner(Publication p, Long auteurId) {
        if (!p.getAuteur().getId().equals(auteurId))
            throw new AccessDeniedException("Vous n'êtes pas l'auteur de cette publication");
    }

    public PublicationResponse toResponse(Publication p, Long meId) {
        boolean liked = meId != null && p.getLikedBy().stream().anyMatch(e -> e.getId().equals(meId));
        return PublicationResponse.builder()
                .id(p.getId())
                .texte(p.getTexte())
                .urlImage(p.getUrlImage())
                .likes(p.getLikes())
                .resolu(p.isResolu())
                .datePublication(p.getDatePublication())
                .visibilite(p.getVisibilite())
                .auteur(etudiantMapper.toResponse(p.getAuteur()))
                .nbCommentaires(p.getCommentaires().size())
                .likedByMe(liked)
                .build();
    }

    private PageResponse<PublicationResponse> toPageResponse(Page<Publication> page, Long meId) {
        return PageResponse.<PublicationResponse>builder()
                .content(page.getContent().stream().map(p -> toResponse(p, meId)).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
