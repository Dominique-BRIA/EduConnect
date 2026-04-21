package com.hackaton.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LivePageResponse {
    private Long id;
    private int numero;
    private String contenuJson;
    private LocalDateTime dateCreation;
    private LocalDateTime dateDerniereSave;
}
