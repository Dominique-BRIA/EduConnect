import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageApi, etudiantApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useMessageWebSocket } from '../hooks/useMessageWebSocket';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './MessagesPage.module.css';

export default function MessagesPage() {
  const { user } = useAuth();
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const selectedContact = contacts.find(c => c.id === parseInt(contactId));

  const { send } = useMessageWebSocket((msg) => {
    if (msg.type === 'MESSAGE' && msg.from) {
      setMessages(prev => [...prev, msg.data]);
    }
    if (msg.type === 'TYPING') setTyping(true);
  });

  // Charger contacts
  useEffect(() => {
    const load = async () => {
      try {
        const { data: ids } = await messageApi.getContacts();
        const profiles = await Promise.all(ids.map(id => etudiantApi.getProfil(id).then(r => r.data)));
        setContacts(profiles);
      } catch {}
    };
    load();
  }, []);

  // Charger conversation
  useEffect(() => {
    if (!contactId) return;
    messageApi.getConversation(contactId).then(r => setMessages(r.data)).catch(() => {});
    messageApi.marquerLus(contactId).catch(() => {});
  }, [contactId]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (typing) {
      const t = setTimeout(() => setTyping(false), 2000);
      return () => clearTimeout(t);
    }
  }, [typing]);

  const handleSearch = async (q) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await etudiantApi.search(q);
    setSearchResults(data.filter(e => e.id !== user?.id));
  };

  const handleSend = async () => {
    if (!texte.trim() || !contactId) return;
    try {
      const { data } = await messageApi.envoyer({ destinataireId: parseInt(contactId), texte });
      setMessages(prev => [...prev, data]);
      // Notifier via WS
      send({ type: 'MESSAGE', targetEmail: selectedContact?.email, data });
      setTexte('');
    } catch {}
  };

  const handleTyping = () => {
    if (selectedContact) send({ type: 'TYPING', targetEmail: selectedContact.email });
    clearTimeout(typingTimer.current);
  };

  const initials = (e) => e ? `${e.nom[0]}${e.prenom[0]}`.toUpperCase() : '?';

  return (
    <div className={styles.page}>
      {/* Liste contacts */}
      <div className={styles.contactList}>
        <div className={styles.contactHeader}>
          <h2 className={styles.title}>Messages</h2>
          <input className={`input ${styles.searchInput}`} placeholder="Chercher un étudiant..."
            value={search} onChange={e => handleSearch(e.target.value)} />
          {searchResults.length > 0 && (
            <div className={styles.searchDropdown}>
              {searchResults.map(e => (
                <div key={e.id} className={styles.searchItem}
                  onClick={() => { navigate(`/messages/${e.id}`); setSearch(''); setSearchResults([]); }}>
                  <div className="avatar avatar-sm">{initials(e)}</div>
                  <div>
                    <div className={styles.cName}>{e.prenom} {e.nom}</div>
                    <div className={styles.cSub}>{e.etablissement}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {contacts.map(c => (
          <div key={c.id}
            className={`${styles.contact} ${parseInt(contactId) === c.id ? styles.activeContact : ''}`}
            onClick={() => navigate(`/messages/${c.id}`)}>
            <div className="avatar avatar-sm">{initials(c)}</div>
            <div className={styles.contactInfo}>
              <span className={styles.cName}>{c.prenom} {c.nom}</span>
              <span className={styles.cSub}>{c.etablissement}</span>
            </div>
          </div>
        ))}

        {contacts.length === 0 && (
          <div className={styles.emptyContacts}>
            <span>💬</span>
            <p>Cherchez un étudiant pour démarrer une conversation</p>
          </div>
        )}
      </div>

      {/* Zone conversation */}
      {contactId ? (
        <div className={styles.conversation}>
          {/* Header */}
          <div className={styles.convHeader}>
            {selectedContact && (
              <>
                <div className="avatar avatar-sm">{initials(selectedContact)}</div>
                <div>
                  <div className={styles.convName}>{selectedContact.prenom} {selectedContact.nom}</div>
                  {typing && <div className={styles.typing}>est en train d'écrire...</div>}
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((m, i) => {
              const isMe = m.expediteur?.id === user?.id;
              return (
                <div key={m.id || i} className={`${styles.messageWrap} ${isMe ? styles.me : styles.them}`}>
                  {!isMe && <div className="avatar avatar-sm">{initials(m.expediteur)}</div>}
                  <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                    <p>{m.texte}</p>
                    <span className={styles.msgTime}>
                      {m.dateEnvoi ? formatDistanceToNow(new Date(m.dateEnvoi), { addSuffix: true, locale: fr }) : ''}
                      {isMe && (m.lu ? ' ✓✓' : ' ✓')}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <input className={`input ${styles.msgInput}`}
              placeholder="Écrire un message..."
              value={texte}
              onChange={e => { setTexte(e.target.value); handleTyping(); }}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
            <button className="btn btn-primary" onClick={handleSend} disabled={!texte.trim()}>
              ➤
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.noConv}>
          <span>💬</span>
          <p>Sélectionnez une conversation</p>
        </div>
      )}
    </div>
  );
}
