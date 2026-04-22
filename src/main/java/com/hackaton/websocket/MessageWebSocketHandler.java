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
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageWebSocketHandler extends TextWebSocketHandler {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    // email -> session
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode node = objectMapper.readTree(message.getPayload());
        String type = node.get("type").asText();

        switch (type) {
            case "AUTH" -> {
                String token = node.get("token").asText();
                try {
                    String email = jwtService.extractUsername(token);
                    userSessions.put(email, session);
                    session.getAttributes().put("email", email);
                    ObjectNode resp = objectMapper.createObjectNode();
                    resp.put("type", "AUTH_OK");
                    sendTo(session, resp);
                } catch (Exception e) {
                    session.close();
                }
            }
            case "MESSAGE" -> {
                String senderEmail = (String) session.getAttributes().get("email");
                String targetEmail = node.get("targetEmail").asText();
                WebSocketSession target = userSessions.get(targetEmail);
                // Relayer le message au destinataire s'il est connecté
                ObjectNode fwd = objectMapper.createObjectNode();
                fwd.put("type", "MESSAGE");
                fwd.put("from", senderEmail);
                fwd.set("data", node.get("data"));
                if (target != null && target.isOpen()) sendTo(target, fwd);
            }
            case "TYPING" -> {
                String senderEmail = (String) session.getAttributes().get("email");
                String targetEmail = node.get("targetEmail").asText();
                WebSocketSession target = userSessions.get(targetEmail);
                if (target != null && target.isOpen()) {
                    ObjectNode typing = objectMapper.createObjectNode();
                    typing.put("type", "TYPING");
                    typing.put("from", senderEmail);
                    sendTo(target, typing);
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String email = (String) session.getAttributes().get("email");
        if (email != null) userSessions.remove(email);
    }

    private void sendTo(WebSocketSession session, JsonNode node) throws IOException {
        if (session.isOpen())
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(node)));
    }
}
