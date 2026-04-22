package com.hackaton.repository;

import com.hackaton.entity.Live;
import com.hackaton.enums.LiveStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LiveRepository extends JpaRepository<Live, Long> {
    List<Live> findByStatutOrderByDateDebutDesc(LiveStatut statut);
    List<Live> findByCreateurIdOrderByDateDebutDesc(Long createurId);
}
