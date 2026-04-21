package com.hackaton.dto.request;

import com.hackaton.enums.Visibilite;
import lombok.Data;

@Data
public class PublicationRequest {
    private String texte;
    private String urlImage;
    private Visibilite visibilite = Visibilite.PUBLIC;
}
