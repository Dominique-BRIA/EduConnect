package com.hackaton.dto.response;

import com.hackaton.enums.Visibilite;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PublicationResponse {
    private Long id;
    private String texte;
    private String urlImage;
    private int likes;
    private boolean resolu;
    private LocalDateTime datePublication;
    private Visibilite visibilite;
    private EtudiantResponse auteur;
    private int nbCommentaires;
    private boolean likedByMe;
}
