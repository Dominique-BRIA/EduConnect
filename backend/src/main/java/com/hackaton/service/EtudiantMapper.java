package com.hackaton.service;

import com.hackaton.dto.response.EtudiantResponse;
import com.hackaton.entity.Etudiant;
import org.springframework.stereotype.Component;

@Component
public class EtudiantMapper {
    public EtudiantResponse toResponse(Etudiant e) {
        if (e == null) return null;
        return EtudiantResponse.builder()
                .id(e.getId())
                .nom(e.getNom())
                .prenom(e.getPrenom())
                .email(e.getEmail())
                .etablissement(e.getEtablissement())
                .dateNaissance(e.getDateNaissance())
                .pays(e.getPays())
                .hobby(e.getHobby())
                .role(e.getRole())
                .nbAbonnements(e.getAbonnements().size())
                .build();
    }
}
