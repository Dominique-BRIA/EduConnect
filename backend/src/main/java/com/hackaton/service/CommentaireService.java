package com.hackaton.service;

import com.hackaton.dto.request.CommentaireRequest;
import com.hackaton.dto.response.CommentaireResponse;
import com.hackaton.entity.Commentaire;
import com.hackaton.entity.Etudiant;
import com.hackaton.entity.Publication;
import com.hackaton.exception.ResourceNotFoundException;
import com.hackaton.repository.CommentaireRepository;
import com.hackaton.repository.EtudiantRepository;
import com.hackaton.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final PublicationRepository publicationRepository;
    private final EtudiantRepository etudiantRepository;
    private final EtudiantMapper etudiantMapper;
    private final NotificationService notificationService;

    @Transactional
    public CommentaireResponse commenter(Long publicationId, CommentaireRequest req, Long auteurId) {
        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Publication introuvable"));
        Etudiant auteur = etudiantRepository.findById(auteurId).orElseThrow();

        Commentaire c = Commentaire.builder()
                .idParent(req.getIdParent())
                .texte(req.getTexte())
                .urlImage(req.getUrlImage())
                .urlVoice(req.getUrlVoice())
                .publication(publication)
                .auteur(auteur)
                .build();

        Commentaire saved = commentaireRepository.save(c);
        notificationService.notifier(publication.getAuteur(), "COMMENTAIRE",
                auteur.getPrenom() + " a commenté votre publication", publicationId, "PUBLICATION");

        return toResponse(saved);
    }

    @Transactional
    public void supprimer(Long id, Long auteurId) {
        Commentaire c = commentaireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire introuvable"));
        if (!c.getAuteur().getId().equals(auteurId))
            throw new AccessDeniedException("Non autorisé");
        commentaireRepository.delete(c);
    }

    @Transactional(readOnly = true)
    public List<CommentaireResponse> getByPublication(Long publicationId) {
        return commentaireRepository.findByPublicationIdOrderByDateCreationAsc(publicationId)
                .stream().map(this::toResponse).toList();
    }

    public CommentaireResponse toResponse(Commentaire c) {
        return CommentaireResponse.builder()
                .id(c.getId())
                .idParent(c.getIdParent())
                .texte(c.getTexte())
                .urlImage(c.getUrlImage())
                .urlVoice(c.getUrlVoice())
                .dateCreation(c.getDateCreation())
                .auteur(etudiantMapper.toResponse(c.getAuteur()))
                .build();
    }
}
