package com.hackaton.service;

import com.hackaton.dto.request.MessageRequest;
import com.hackaton.dto.response.MessageResponse;
import com.hackaton.entity.Etudiant;
import com.hackaton.entity.Message;
import com.hackaton.exception.ResourceNotFoundException;
import com.hackaton.repository.EtudiantRepository;
import com.hackaton.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final EtudiantRepository etudiantRepository;
    private final EtudiantMapper etudiantMapper;

    @Transactional
    public MessageResponse envoyer(MessageRequest req, Long expediteurId) {
        Etudiant exp = etudiantRepository.findById(expediteurId).orElseThrow();
        Etudiant dest = etudiantRepository.findById(req.getDestinataireId())
                .orElseThrow(() -> new ResourceNotFoundException("Destinataire introuvable"));
        Message m = Message.builder()
                .texte(req.getTexte())
                .urlImage(req.getUrlImage())
                .urlVoice(req.getUrlVoice())
                .type(req.getType())
                .expediteur(exp)
                .destinataire(dest)
                .build();
        return toResponse(messageRepository.save(m));
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getConversation(Long aId, Long bId) {
        return messageRepository.findConversation(aId, bId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void marquerLus(Long expediteurId, Long destinataireId) {
        messageRepository.findConversation(expediteurId, destinataireId).stream()
                .filter(m -> m.getDestinataire().getId().equals(destinataireId) && !m.isLu())
                .forEach(m -> { m.setLu(true); messageRepository.save(m); });
    }

    @Transactional(readOnly = true)
    public List<Long> getContactIds(Long etudiantId) {
        return messageRepository.findContactIds(etudiantId);
    }

    public MessageResponse toResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .texte(m.getTexte())
                .urlImage(m.getUrlImage())
                .urlVoice(m.getUrlVoice())
                .lu(m.isLu())
                .dateEnvoi(m.getDateEnvoi())
                .type(m.getType())
                .expediteur(etudiantMapper.toResponse(m.getExpediteur()))
                .destinataire(etudiantMapper.toResponse(m.getDestinataire()))
                .build();
    }
}
