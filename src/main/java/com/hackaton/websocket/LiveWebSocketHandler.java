package com.hackaton.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hackaton.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler pour les lives.
 * Messages JSON supportés (champ "type") :
 *   AUTH              - {token, liveId}
 *   DRAW              - {liveId, page, stroke} → diffusé à tous
 *   CLEAR_PAGE        - {liveId, page} → diffusé à tous
 *   NEW_PAGE          - {liveId, pageNum} → diffusé à tous
 *   CHANGE_PAGE       - {liveId, pageNum} → diffusé à tous
 *   CANVAS_STATE      - {liveId, page, dataUrl} → réponse à un rejoignant
 *   REQUEST_STATE     - {liveId, page} → demande l'état courant
 *   GIVE_HAND         - {liveId, targetId} → créateur donne la main
 *   REMOVE_HAND       - {liveId, targetId} → créateur retire la main
 *   WEBRTC_OFFER      - {liveId, targetId, sdp}
 *   WEBRTC_ANSWER     - {liveId, targetId, sdp}
 *   WEBRTC_ICE        - {liveId, targetId, candidate}
 *   PARTICIPANT_LIST  - diffusé automatiquement
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LiveWebSocketHandler extends TextWebSocketHandler {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    // liveId -> Set<session>
    private final Map<Long, Set<WebSocketSession>> liveRooms = new ConcurrentHashMap<>();
    // sessionId -> {liveId, etudiantId, email}
    private final Map<String, SessionInfo> sessionInfos = new ConcurrentHashMap<>();
    // liveId -> Set<intervenantId>
    private final Map<Long, Set<Long>> intervenants = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WS Live connection: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode node = objectMapper.readTree(message.getPayload());
        String type = node.get("type").asText();

        switch (type) {
            case "AUTH" -> handleAuth(session, node);
            case "DRAW" -> handleDraw(session, node);
            case "CLEAR_PAGE" -> handleClearPage(session, node);
            case "NEW_PAGE" -> handleNewPage(session, node);
            case "CHANGE_PAGE" -> handleChangePage(session, node);
            case "CANVAS_STATE" -> handleCanvasState(session, node);
            case "REQUEST_STATE" -> handleRequestState(session, node);
            case "GIVE_HAND" -> handleGiveHand(session, node);
            case "REMOVE_HAND" -> handleRemoveHand(session, node);
            case "WEBRTC_OFFER", "WEBRTC_ANSWER", "WEBRTC_ICE" -> handleWebRTC(session, node, type);
            default -> log.warn("Type WS inconnu: {}", type);
        }
    }

    private void handleAuth(WebSocketSession session, JsonNode node) throws IOException {
        String token = node.get("token").asText();
        Long liveId = node.get("liveId").asLong();
        try {
            String email = jwtService.extractUsername(token);
            // Pour simplifier, on extrait l'ID depuis le token (à adapter si besoin)
            Long etudiantId = node.has("etudiantId") ? node.get("etudiantId").asLong() : null;

            sessionInfos.put(session.getId(), new SessionInfo(liveId, etudiantId, email, session));
            liveRooms.computeIfAbsent(liveId, k -> ConcurrentHashMap.newKeySet()).add(session);
            intervenants.computeIfAbsent(liveId, k -> ConcurrentHashMap.newKeySet());

            // Confirmer l'auth
            ObjectNode resp = objectMapper.createObjectNode();
            resp.put("type", "AUTH_OK");
            resp.put("email", email);
            resp.put("etudiantId", etudiantId != null ? etudiantId : 0);
            sendTo(session, resp);

            // Diffuser la liste des participants
            broadcastParticipantList(liveId);

        } catch (Exception e) {
            ObjectNode err = objectMapper.createObjectNode();
            err.put("type", "AUTH_ERROR");
            err.put("message", "Token invalide");
            sendTo(session, err);
            session.close();
        }
    }

    private void handleDraw(WebSocketSession session, JsonNode node) throws IOException {
        SessionInfo info = sessionInfos.get(session.getId());
        if (info == null) return;
        if (!isIntervenant(info.liveId(), info.etudiantId())) return;
        // Broadcast le trait à tous les participants sauf l'émetteur
        broadcastExcept(info.liveId(), session, node);
    }

    private void handleClearPage(WebSocketSession session, JsonNode node) throws IOException {
        SessionInfo info = sessionInfos.get(session.getId());
        if (info == null || !isIntervenant(info.liveId(), info.etudiantId())) return;
        broadcastExcept(info.liveId(), session, node);
    }

    private void handleNewPage(WebSocketSession session, JsonNode node) throws IOException {
        SessionInfo info = sessionInfos.get(session.getId());
        if (info == null || !isIntervenant(info.liveId(), info.etudiantId())) return;
        broadcastAll(info.liveId(), node);
    }

    private void handleChangePage(WebSocketSession session, JsonNode node) throws IOException {
        SessionInfo info = sessionInfos.get(session.getId());
        if (info == null || !isIntervenant(info.liveId(), info.etudiantId())) return;
        broadcastAll(info.liveId(), node);
    }

    private void handleCanvasState(WebSocketSession session, JsonNode node) throws IOException {
        // Un intervenant envoie l'état du canvas à un rejoignant spécifique
        SessionInfo info = sessionInfos.get(session.getId());
        if (info == null) return;
        String targetEmail = node.has("targetEmail") ? node.get("targetEmail").asText() : null;
        if (targetEmail != null) {
            sendToEmail(info.liveId(), targetEmail, node);
        }
    }

    private void handleRequestState(WebSocketSession session, JsonNode node) throws IOException {
        // Demander à un intervenant l'état courant du canvas
        SessionInfo info = sessionInfos.get(session.getId());
        if (info == null) return;
        // Envoyer la demande au premier intervenant connecté
        Set<Long> intervenantIds = intervenants.get(info.liveId());
        if (intervenantIds == null) return;
        ObjectNode req = objectMapper.createObjectNode();
        req.put("type", "REQUEST_STATE");
        req.put("page", node.get("page").asInt());
        req.put("targetEmail", info.email());
        sendToFirstIntervenant(info.liveId(), intervenantIds, req);
    }

    private void handleGiveHand(WebSocketSession session, JsonNode node) throws IOException {
        SessionInfo info = sessionInfos.get(session.getId());
        if (info == null) return;
        Long targetId = node.get("targetId").asLong();
        intervenants.computeIfAbsent(info.liveId(), k -> ConcurrentHashMap.newKeySet()).add(targetId);
        ObjectNode notif = objectMapper.createObjectNode();
        notif.put("type", "HAND_GIVEN");
        notif.put("targetId", targetId);
        broadcastAll(info.liveId(), notif);
    }

    private void handleRemoveHand(WebSocketSession session, JsonNode node) throws IOException {
        SessionInfo info = sessionInfos.get(session.getId());
        if (info == null) return;
        Long targetId = node.get("targetId").asLong();
        Set<Long> set = intervenants.get(info.liveId());
        if (set != null) set.remove(targetId);
        ObjectNode notif = objectMapper.createObjectNode();
        notif.put("type", "HAND_REMOVED");
        notif.put("targetId", targetId);
        broadcastAll(info.liveId(), notif);
    }

    private void handleWebRTC(WebSocketSession session, JsonNode node, String type) throws IOException {
        // Signaling P2P : relayer à la cible
        SessionInfo info = sessionInfos.get(session.getId());
        if (info == null) return;
        Long targetId = node.get("targetId").asLong();
        sendToEtudiant(info.liveId(), targetId, node);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        SessionInfo info = sessionInfos.remove(session.getId());
        if (info != null) {
            Set<WebSocketSession> room = liveRooms.get(info.liveId());
            if (room != null) {
                room.remove(session);
                broadcastParticipantListSafe(info.liveId());
            }
        }
        log.info("WS Live closed: {}", session.getId());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private boolean isIntervenant(Long liveId, Long etudiantId) {
        if (etudiantId == null) return false;
        Set<Long> set = intervenants.get(liveId);
        return set != null && set.contains(etudiantId);
    }

    private void broadcastAll(Long liveId, JsonNode node) {
        Set<WebSocketSession> room = liveRooms.get(liveId);
        if (room == null) return;
        room.forEach(s -> { try { sendTo(s, node); } catch (IOException e) { log.error("Broadcast error", e); } });
    }

    private void broadcastExcept(Long liveId, WebSocketSession except, JsonNode node) {
        Set<WebSocketSession> room = liveRooms.get(liveId);
        if (room == null) return;
        room.stream().filter(s -> !s.getId().equals(except.getId()))
                .forEach(s -> { try { sendTo(s, node); } catch (IOException e) { log.error("Broadcast error", e); } });
    }

    private void broadcastParticipantList(Long liveId) {
        Set<WebSocketSession> room = liveRooms.get(liveId);
        if (room == null) return;
        ObjectNode msg = objectMapper.createObjectNode();
        msg.put("type", "PARTICIPANT_LIST");
        msg.put("count", room.size());
        var arr = msg.putArray("participants");
        sessionInfos.values().stream()
                .filter(si -> si.liveId().equals(liveId))
                .forEach(si -> {
                    var p = arr.addObject();
                    p.put("email", si.email());
                    p.put("etudiantId", si.etudiantId() != null ? si.etudiantId() : 0);
                    p.put("isIntervenant", isIntervenant(liveId, si.etudiantId()));
                });
        broadcastAll(liveId, msg);
    }

    private void broadcastParticipantListSafe(Long liveId) {
        try { broadcastParticipantList(liveId); } catch (Exception e) { log.error("Error broadcasting participants", e); }
    }

    private void sendTo(WebSocketSession session, JsonNode node) throws IOException {
        if (session.isOpen())
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(node)));
    }

    private void sendToEmail(Long liveId, String email, JsonNode node) {
        sessionInfos.values().stream()
                .filter(si -> si.liveId().equals(liveId) && email.equals(si.email()))
                .forEach(si -> { try { sendTo(si.session(), node); } catch (IOException e) { log.error("Send error", e); } });
    }

    private void sendToEtudiant(Long liveId, Long etudiantId, JsonNode node) {
        sessionInfos.values().stream()
                .filter(si -> si.liveId().equals(liveId) && etudiantId.equals(si.etudiantId()))
                .forEach(si -> { try { sendTo(si.session(), node); } catch (IOException e) { log.error("Send error", e); } });
    }

    private void sendToFirstIntervenant(Long liveId, Set<Long> intervenantIds, JsonNode node) {
        sessionInfos.values().stream()
                .filter(si -> si.liveId().equals(liveId) && intervenantIds.contains(si.etudiantId()))
                .findFirst()
                .ifPresent(si -> { try { sendTo(si.session(), node); } catch (IOException e) { log.error("Send error", e); } });
    }

    public record SessionInfo(Long liveId, Long etudiantId, String email, WebSocketSession session) {}
}
