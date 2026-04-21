import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { liveApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useLiveWebSocket } from '../hooks/useLiveWebSocket';
import { toast } from 'react-toastify';
import styles from './LiveRoomPage.module.css';

const COLORS = ['#1E293B','#4F46E5','#E11D48','#059669','#D97706','#7C3AED','#0EA5E9','#FFFFFF'];
const SIZES  = [2, 4, 8, 14];

export default function LiveRoomPage() {
  const { liveId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [live, setLive] = useState(null);
  const [pages, setPages] = useState([[]]);   // pages[i] = array of strokes
  const [currentPage, setCurrentPage] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [isIntervenant, setIsIntervenant] = useState(false);
  const [isCreateur, setIsCreateur] = useState(false);
  const [color, setColor] = useState('#1E293B');
  const [size, setSize] = useState(4);
  const [tool, setTool] = useState('pen');   // pen | eraser
  const [drawing, setDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [micOn, setMicOn] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const canvasRef = useRef(null);
  const ctxRef    = useRef(null);
  const streamRef = useRef(null);
  const peersRef  = useRef({});  // peerId -> RTCPeerConnection

  // ─── WebSocket ──────────────────────────────────────────────────────────
  const handleWsMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'AUTH_OK':
        break;
      case 'PARTICIPANT_LIST':
        setParticipants(msg.participants || []);
        const me = (msg.participants || []).find(p => p.etudiantId === user?.id);
        setIsIntervenant(me?.isIntervenant || false);
        break;
      case 'DRAW': {
        const { page, stroke } = msg;
        setPages(prev => {
          const updated = [...prev];
          if (!updated[page]) updated[page] = [];
          updated[page] = [...updated[page], stroke];
          return updated;
        });
        if (page === currentPage) drawStroke(stroke);
        break;
      }
      case 'CLEAR_PAGE':
        setPages(prev => { const u = [...prev]; u[msg.page] = []; return u; });
        if (msg.page === currentPage) clearCanvas();
        break;
      case 'NEW_PAGE':
        setPages(prev => [...prev, []]);
        goToPage(msg.pageNum);
        break;
      case 'CHANGE_PAGE':
        goToPage(msg.pageNum);
        break;
      case 'HAND_GIVEN':
        if (msg.targetId === user?.id) {
          setIsIntervenant(true);
          toast.info('Vous avez la main !');
        }
        break;
      case 'HAND_REMOVED':
        if (msg.targetId === user?.id) {
          setIsIntervenant(false);
          toast.info('Main retirée');
        }
        break;
      case 'WEBRTC_OFFER':   handleRTCOffer(msg);   break;
      case 'WEBRTC_ANSWER':  handleRTCAnswer(msg);  break;
      case 'WEBRTC_ICE':     handleRTCIce(msg);     break;
      default: break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage]);

  const { send } = useLiveWebSocket(liveId, user?.id, handleWsMessage);

  // ─── Load live ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data: l } = await liveApi.getPages(liveId);
        setPages(l.map(p => JSON.parse(p.contenuJson || '[]')));
        const livesActifs = await liveApi.getLivesActifs();
        const found = livesActifs.data.find(x => x.id === parseInt(liveId));
        if (found) {
          setLive(found);
          setCurrentPage(found.pageActuelle || 0);
          setIsCreateur(found.createur?.id === user?.id);
          setIsIntervenant(found.intervenants?.some(i => i.id === user?.id) || false);
        }
      } catch {}
    };
    load();
  }, [liveId, user]);

  // ─── Canvas init ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    redrawPage(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { redrawPage(currentPage); }, [currentPage, pages]);

  const redrawPage = (pageIdx) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const strokes = pages[pageIdx] || [];
    strokes.forEach(s => drawStroke(s));
  };

  const drawStroke = (stroke) => {
    const ctx = ctxRef.current;
    if (!ctx || !stroke?.points?.length) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over';
    ctx.beginPath();
    stroke.points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.restore();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  };

  // ─── Drawing events ─────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (!isIntervenant) return;
    setDrawing(true);
    const pt = getPos(e);
    setCurrentStroke([pt]);
    const ctx = ctxRef.current;
    ctx.save();
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const onPointerMove = (e) => {
    if (!drawing || !isIntervenant) return;
    const pt = getPos(e);
    setCurrentStroke(prev => [...prev, pt]);
    const ctx = ctxRef.current;
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const onPointerUp = () => {
    if (!drawing || !isIntervenant) return;
    ctxRef.current?.restore();
    setDrawing(false);
    if (currentStroke.length < 2) { setCurrentStroke([]); return; }
    const stroke = { points: currentStroke, color, size: tool === 'eraser' ? size * 4 : size, eraser: tool === 'eraser' };
    setPages(prev => {
      const u = [...prev];
      if (!u[currentPage]) u[currentPage] = [];
      u[currentPage] = [...u[currentPage], stroke];
      return u;
    });
    // Envoyer via WS
    send({ type: 'DRAW', liveId: parseInt(liveId), page: currentPage, stroke });
    setCurrentStroke([]);
  };

  // ─── Page management ────────────────────────────────────────────────────
  const goToPage = useCallback((idx) => {
    setCurrentPage(idx);
  }, []);

  const handleNewPage = async () => {
    try {
      await liveApi.ajouterPage(liveId);
      const newIdx = pages.length;
      setPages(prev => [...prev, []]);
      send({ type: 'NEW_PAGE', liveId: parseInt(liveId), pageNum: newIdx });
      setCurrentPage(newIdx);
    } catch {}
  };

  const handleChangePage = (idx) => {
    if (idx < 0 || idx >= pages.length) return;
    setCurrentPage(idx);
    if (isIntervenant) {
      send({ type: 'CHANGE_PAGE', liveId: parseInt(liveId), pageNum: idx });
      liveApi.changerPage(liveId, idx).catch(() => {});
    }
  };

  const handleClearPage = () => {
    if (!isIntervenant) return;
    setPages(prev => { const u = [...prev]; u[currentPage] = []; return u; });
    clearCanvas();
    send({ type: 'CLEAR_PAGE', liveId: parseInt(liveId), page: currentPage });
  };

  const handleSavePage = async () => {
    try {
      const contenuJson = JSON.stringify(pages[currentPage] || []);
      await liveApi.sauvegarderPage(liveId, currentPage, contenuJson);
      toast.success('Page sauvegardée');
    } catch {}
  };

  // ─── Micro (WebRTC) ─────────────────────────────────────────────────────
  const toggleMic = async () => {
    if (!isIntervenant) { toast.warning('Vous devez avoir la main pour parler'); return; }
    if (micOn) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      setMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        setMicOn(true);
        // Créer une connexion P2P avec chaque participant
        participants.filter(p => p.etudiantId !== user?.id).forEach(p => {
          createPeerConnection(p.etudiantId, stream, true);
        });
      } catch { toast.error('Microphone non disponible'); }
    }
  };

  const createPeerConnection = (targetId, stream, isInitiator) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peersRef.current[targetId] = pc;
    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = (e) => {
      const audio = document.createElement('audio');
      audio.srcObject = e.streams[0];
      audio.autoplay = true;
      document.body.appendChild(audio);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) send({ type: 'WEBRTC_ICE', liveId: parseInt(liveId), targetId, candidate: e.candidate });
    };
    if (isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        send({ type: 'WEBRTC_OFFER', liveId: parseInt(liveId), targetId, sdp: offer });
      });
    }
    return pc;
  };

  const handleRTCOffer = async ({ sdp, etudiantId }) => {
    const pc = createPeerConnection(etudiantId, streamRef.current, false);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    send({ type: 'WEBRTC_ANSWER', liveId: parseInt(liveId), targetId: etudiantId, sdp: answer });
  };

  const handleRTCAnswer = async ({ sdp, etudiantId }) => {
    const pc = peersRef.current[etudiantId];
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  };

  const handleRTCIce = async ({ candidate, etudiantId }) => {
    const pc = peersRef.current[etudiantId];
    if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  // ─── Give/remove hand ────────────────────────────────────────────────────
  const handleGiveHand = async (targetId) => {
    try {
      await liveApi.donnerMain(liveId, targetId);
      send({ type: 'GIVE_HAND', liveId: parseInt(liveId), targetId });
      toast.success('Main donnée');
    } catch {}
  };

  const handleRemoveHand = async (targetId) => {
    try {
      await liveApi.retirerMain(liveId, targetId);
      send({ type: 'REMOVE_HAND', liveId: parseInt(liveId), targetId });
    } catch {}
  };

  // ─── Leave ───────────────────────────────────────────────────────────────
  const handleLeave = async () => {
    await handleSavePage();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (isCreateur) {
      await liveApi.arreter(liveId).catch(() => {});
    } else {
      await liveApi.quitter(liveId).catch(() => {});
    }
    navigate('/lives');
  };

  return (
    <div className={styles.room}>
      {/* ── Toolbar top ── */}
      <div className={styles.toolbar}>
        <div className={styles.liveInfo}>
          <span className={styles.liveDot} />
          <span className={styles.liveTitle}>{live?.titre || 'Live'}</span>
        </div>

        {isIntervenant && (
          <>
            {/* Colors */}
            <div className={styles.colors}>
              {COLORS.map(c => (
                <button key={c} className={`${styles.colorBtn} ${color === c && tool === 'pen' ? styles.activeColor : ''}`}
                  style={{ background: c, border: c === '#FFFFFF' ? '2px solid #CBD5E1' : 'none' }}
                  onClick={() => { setColor(c); setTool('pen'); }} />
              ))}
            </div>

            {/* Sizes */}
            <div className={styles.sizes}>
              {SIZES.map(s => (
                <button key={s} className={`${styles.sizeBtn} ${size === s ? styles.activeSize : ''}`}
                  onClick={() => setSize(s)}>
                  <span style={{ width: s * 2, height: s * 2, borderRadius: '50%', background: 'currentColor', display: 'block' }} />
                </button>
              ))}
            </div>

            <button className={`btn btn-sm ${tool === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTool(t => t === 'eraser' ? 'pen' : 'eraser')}>
              ⬜ Gomme
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleClearPage}>🗑 Effacer</button>
            <button className="btn btn-secondary btn-sm" onClick={handleSavePage}>💾 Sauv.</button>
          </>
        )}

        <button className={`btn btn-sm ${micOn ? 'btn-primary' : 'btn-secondary'}`} onClick={toggleMic}>
          {micOn ? '🎙 Micro ON' : '🔇 Micro OFF'}
        </button>

        <button className={`btn btn-secondary btn-sm ${styles.participantsBtn}`}
          onClick={() => setShowParticipants(v => !v)}>
          👥 {participants.length}
        </button>

        <button className="btn btn-danger btn-sm" onClick={handleLeave}>
          {isCreateur ? '⏹ Terminer' : '← Quitter'}
        </button>
      </div>

      <div className={styles.body}>
        {/* ── Page thumbnails (left sidebar like Word) ── */}
        <div className={styles.pageSidebar}>
          <div className={styles.sidebarTitle}>Pages</div>
          {pages.map((_, idx) => (
            <div key={idx}
              className={`${styles.pageThumbnail} ${currentPage === idx ? styles.activePage : ''}`}
              onClick={() => handleChangePage(idx)}>
              <div className={styles.thumbCanvas}>
                <span className={styles.thumbNum}>{idx + 1}</span>
              </div>
            </div>
          ))}
          {isIntervenant && (
            <button className={`btn btn-ghost btn-sm ${styles.addPageBtn}`} onClick={handleNewPage}>
              + Page
            </button>
          )}
        </div>

        {/* ── Main canvas ── */}
        <div className={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className={`${styles.canvas} ${isIntervenant ? styles.canvasDraw : styles.canvasView}`}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={e => { e.preventDefault(); onPointerDown(e); }}
            onTouchMove={e => { e.preventDefault(); onPointerMove(e); }}
            onTouchEnd={onPointerUp}
          />
          <div className={styles.pageIndicator}>Page {currentPage + 1} / {pages.length}</div>
        </div>

        {/* ── Participants panel ── */}
        {showParticipants && (
          <div className={styles.participantsPanel}>
            <div className={styles.panelTitle}>Participants ({participants.length})</div>
            {participants.map(p => (
              <div key={p.etudiantId} className={styles.participant}>
                <div className="avatar avatar-sm">
                  {p.email?.[0]?.toUpperCase()}
                </div>
                <div className={styles.pInfo}>
                  <span className={styles.pEmail}>{p.email}</span>
                  {p.isIntervenant && <span className={styles.handBadge}>✋ Main</span>}
                </div>
                {isCreateur && p.etudiantId !== user?.id && (
                  <div className={styles.pActions}>
                    {!p.isIntervenant ? (
                      <button className="btn btn-ghost btn-sm" title="Donner la main"
                        onClick={() => handleGiveHand(p.etudiantId)}>✋</button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" title="Retirer la main"
                        onClick={() => handleRemoveHand(p.etudiantId)}>🤚</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
