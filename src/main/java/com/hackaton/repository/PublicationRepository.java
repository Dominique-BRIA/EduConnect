package com.hackaton.repository;

import com.hackaton.entity.Publication;
import com.hackaton.enums.Visibilite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PublicationRepository extends JpaRepository<Publication, Long> {

    // Fil d'actualité : publications de l'étudiant + ceux qu'il suit
    @Query("SELECT p FROM Publication p WHERE p.auteur.id = :id OR p.auteur.id IN " +
           "(SELECT a.id FROM Etudiant e JOIN e.abonnements a WHERE e.id = :id) " +
           "ORDER BY p.datePublication DESC")
    Page<Publication> findFilActualite(@Param("id") Long etudiantId, Pageable pageable);

    Page<Publication> findByAuteurIdOrderByDatePublicationDesc(Long auteurId, Pageable pageable);
    Page<Publication> findByVisibiliteOrderByDatePublicationDesc(Visibilite v, Pageable pageable);
}
