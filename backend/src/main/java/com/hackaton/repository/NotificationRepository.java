package com.hackaton.repository;

import com.hackaton.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDestinataireIdOrderByDateDesc(Long destinataireId);
    long countByDestinataireIdAndLueFalse(Long destinataireId);
}
