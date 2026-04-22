package com.hackaton.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "commentaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Commentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idParent;

    @Column(columnDefinition = "TEXT")
    private String texte;

    private String urlImage;
    private String urlVoice;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publication_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Publication publication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Etudiant auteur;
}
