package com.hackaton.dto.response;

import com.hackaton.enums.Role;
import lombok.*;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EtudiantResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String etablissement;
    private LocalDate dateNaissance;
    private String pays;
    private String hobby;
    private Role role;
    private int nbAbonnements;
    private int nbAbonnes;
}
