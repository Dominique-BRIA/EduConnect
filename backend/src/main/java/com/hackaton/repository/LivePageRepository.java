package com.hackaton.repository;

import com.hackaton.entity.LivePage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LivePageRepository extends JpaRepository<LivePage, Long> {
    List<LivePage> findByLiveIdOrderByNumeroAsc(Long liveId);
    Optional<LivePage> findByLiveIdAndNumero(Long liveId, int numero);
    int countByLiveId(Long liveId);
}
