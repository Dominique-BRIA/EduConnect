package com.hackaton.repository;

import com.hackaton.entity.Commentaire;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {
    List<Commentaire> findByPublicationIdOrderByDateCreationAsc(Long publicationId);
}
