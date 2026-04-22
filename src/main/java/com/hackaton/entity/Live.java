package com.hackaton.entity;

import com.hackaton.enums.LiveStatut;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "lives")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Live {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String urlFlux;
    private Integer duree;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private LiveStatut statut = LiveStatut.EN_ATTENTE;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime dateDebut = LocalDateTime.now();

    private LocalDateTime dateFin;

    // Page courante du tableau blanc
    @Builder.Default
    private int pageActuelle = 0;

    // Nombre total de pages créées
    @Builder.Default
    private int nombrePages = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createur_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Etudiant createur;

    @ManyToMany
    @JoinTable(name = "live_participants",
            joinColumns = @JoinColumn(name = "live_id"),
            inverseJoinColumns = @JoinColumn(name = "etudiant_id"))
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Etudiant> participants = new HashSet<>();

    // Intervenants ayant la main (peuvent écrire et parler)
    @ManyToMany
    @JoinTable(name = "live_intervenants",
            joinColumns = @JoinColumn(name = "live_id"),
            inverseJoinColumns = @JoinColumn(name = "etudiant_id"))
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Etudiant> intervenants = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publication_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Publication publication;

    // Pages du tableau blanc (stockées comme JSON/TEXT)
    @OneToMany(mappedBy = "live", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<LivePage> pages = new ArrayList<>();
}
