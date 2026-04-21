package com.hackaton.entity;

import com.hackaton.enums.Visibilite;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "publications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String texte;

    private String urlImage;

    @Builder.Default
    private int likes = 0;

    @Builder.Default
    private boolean resolu = false;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime datePublication = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Visibilite visibilite = Visibilite.PUBLIC;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Etudiant auteur;

    @OneToMany(mappedBy = "publication", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Commentaire> commentaires = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "publication_likes",
            joinColumns = @JoinColumn(name = "publication_id"),
            inverseJoinColumns = @JoinColumn(name = "etudiant_id"))
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Etudiant> likedBy = new ArrayList<>();
}
