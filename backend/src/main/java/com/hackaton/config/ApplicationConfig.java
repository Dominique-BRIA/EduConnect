package com.hackaton.config;

import com.hackaton.repository.EtudiantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final EtudiantRepository etudiantRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> etudiantRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Étudiant non trouvé: " + username));
    }
}
