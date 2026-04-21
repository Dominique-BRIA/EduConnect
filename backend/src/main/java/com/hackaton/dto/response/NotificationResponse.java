package com.hackaton.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String type;
    private String contenu;
    private boolean lue;
    private LocalDateTime date;
    private Long refId;
    private String refType;
}
