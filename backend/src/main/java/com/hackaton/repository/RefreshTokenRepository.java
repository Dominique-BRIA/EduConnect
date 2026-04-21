package com.hackaton.repository;

import com.hackaton.entity.RefreshToken;
import com.hackaton.entity.Etudiant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.etudiant = :etudiant")
    void deleteByEtudiant(Etudiant etudiant);
}
