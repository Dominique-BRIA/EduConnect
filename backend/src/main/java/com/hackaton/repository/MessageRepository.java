package com.hackaton.repository;

import com.hackaton.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE " +
           "(m.expediteur.id = :a AND m.destinataire.id = :b) OR " +
           "(m.expediteur.id = :b AND m.destinataire.id = :a) " +
           "ORDER BY m.dateEnvoi ASC")
    List<Message> findConversation(@Param("a") Long aId, @Param("b") Long bId);

    // Dernière conversation de chaque contact distinct
    @Query("SELECT DISTINCT CASE WHEN m.expediteur.id = :id THEN m.destinataire.id ELSE m.expediteur.id END " +
           "FROM Message m WHERE m.expediteur.id = :id OR m.destinataire.id = :id")
    List<Long> findContactIds(@Param("id") Long etudiantId);

    long countByDestinataireIdAndLuFalse(Long destinataireId);
}
