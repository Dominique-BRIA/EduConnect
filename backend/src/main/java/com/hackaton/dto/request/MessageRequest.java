package com.hackaton.dto.request;

import com.hackaton.enums.MessageType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MessageRequest {
    @NotNull private Long destinataireId;
    private String texte;
    private String urlImage;
    private String urlVoice;
    private MessageType type = MessageType.TEXTE;
}
