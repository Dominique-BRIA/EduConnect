package com.hackaton.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CommentaireResponse {
    private Long id;
    private Long idParent;
    private String texte;
    private String urlImage;
    private String urlVoice;
    private LocalDateTime dateCreation;
    private EtudiantResponse auteur;
}
