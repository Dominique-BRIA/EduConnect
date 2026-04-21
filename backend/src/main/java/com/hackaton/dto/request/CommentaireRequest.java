package com.hackaton.dto.request;

import lombok.Data;

@Data
public class CommentaireRequest {
    private Long idParent;
    private String texte;
    private String urlImage;
    private String urlVoice;
}
