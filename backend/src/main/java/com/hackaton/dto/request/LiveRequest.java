package com.hackaton.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LiveRequest {
    @NotBlank private String titre;
    private Long publicationId;
}
