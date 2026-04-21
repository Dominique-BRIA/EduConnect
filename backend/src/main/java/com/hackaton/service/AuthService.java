package com.hackaton.service;

import com.hackaton.dto.request.LoginRequest;
import com.hackaton.dto.request.RefreshTokenRequest;
import com.hackaton.dto.request.RegisterRequest;
import com.hackaton.dto.response.AuthResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.entity.RefreshToken;
import com.hackaton.exception.BadRequestException;
import com.hackaton.exception.TokenExpiredException;
import com.hackaton.repository.EtudiantRepository;
import com.hackaton.repository.RefreshTokenRepository;
import com.hackaton.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EtudiantRepository etudiantRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final EtudiantMapper etudiantMapper;

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpiration;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (etudiantRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email déjà utilisé");
        }
        Etudiant etudiant = Etudiant.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .etablissement(request.getEtablissement())
                .dateNaissance(request.getDateNaissance())
                .pays(request.getPays())
                .hobby(request.getHobby())
                .build();
        etudiantRepository.save(etudiant);
        return buildAuthResponse(etudiant);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
        );
        Etudiant etudiant = etudiantRepository.findByEmail(request.getEmail()).orElseThrow();
        // Révoquer les anciens tokens
        refreshTokenRepository.deleteByEtudiant(etudiant);
        return buildAuthResponse(etudiant);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new TokenExpiredException("Refresh token invalide"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new TokenExpiredException("Refresh token expiré, veuillez vous reconnecter");
        }

        Etudiant etudiant = refreshToken.getEtudiant();
        String newAccessToken = jwtService.generateToken(etudiant);

        // Rotation du refresh token
        refreshTokenRepository.delete(refreshToken);
        RefreshToken newRefreshToken = createRefreshToken(etudiant);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .etudiant(etudiantMapper.toResponse(etudiant))
                .build();
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        refreshTokenRepository.findByToken(refreshTokenStr)
                .ifPresent(refreshTokenRepository::delete);
    }

    private AuthResponse buildAuthResponse(Etudiant etudiant) {
        String accessToken = jwtService.generateToken(etudiant);
        RefreshToken refreshToken = createRefreshToken(etudiant);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .etudiant(etudiantMapper.toResponse(etudiant))
                .build();
    }

    private RefreshToken createRefreshToken(Etudiant etudiant) {
        RefreshToken token = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .etudiant(etudiant)
                .expiryDate(Instant.now().plusMillis(refreshExpiration))
                .build();
        return refreshTokenRepository.save(token);
    }
}
