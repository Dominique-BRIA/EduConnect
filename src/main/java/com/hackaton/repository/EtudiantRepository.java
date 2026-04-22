package com.hackaton.repository;

import com.hackaton.entity.Etudiant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EtudiantRepository extends JpaRepository<Etudiant, Long> {
    Optional<Etudiant> findByEmail(String email);
    boolean existsByEmail(String email);
    @Query("SELECT e FROM Etudiant e WHERE e.nom LIKE %:q% OR e.prenom LIKE %:q% OR e.email LIKE %:q%")
    List<Etudiant> search(@Param("q") String query);
}
