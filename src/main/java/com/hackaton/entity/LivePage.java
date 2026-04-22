package com.hackaton.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "live_pages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LivePage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int numero;

    // Contenu canvas sérialisé en JSON (strokes/paths)
    @Column(columnDefinition = "LONGTEXT")
    @Builder.Default
    private String contenuJson = "[]";

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateDerniereSave;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "live_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Live live;
}
