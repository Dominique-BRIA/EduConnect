package com.hackaton.dto.response;

import com.hackaton.enums.LiveStatut;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LiveResponse {
    private Long id;
    private String titre;
    private String urlFlux;
    private LiveStatut statut;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private int pageActuelle;
    private int nombrePages;
    private EtudiantResponse createur;
    private List<EtudiantResponse> participants;
    private List<EtudiantResponse> intervenants;
    private Long publicationId;
}
