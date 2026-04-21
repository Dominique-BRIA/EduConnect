package com.hackaton.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterRequest {
    @NotBlank private String nom;
    @NotBlank private String prenom;
    @Email @NotBlank private String email;
    @NotBlank @Size(min = 6) private String motDePasse;
    private String etablissement;
    private LocalDate dateNaissance;
    private String pays;
    private String hobby;
}
