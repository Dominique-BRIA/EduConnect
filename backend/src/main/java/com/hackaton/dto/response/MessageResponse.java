package com.hackaton.dto.response;

import com.hackaton.enums.MessageType;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageResponse {
    private Long id;
    private String texte;
    private String urlImage;
    private String urlVoice;
    private boolean lu;
    private LocalDateTime dateEnvoi;
    private MessageType type;
    private EtudiantResponse expediteur;
    private EtudiantResponse destinataire;
}
