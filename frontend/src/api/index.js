import axios from 'axios';

const BASE = '/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  register: d => api.post('/auth/register', d),
  login: d => api.post('/auth/login', d),
  logout: rt => api.post('/auth/logout', { refreshToken: rt }),
};

// Etudiants
export const etudiantApi = {
  me: () => api.get('/etudiants/me'),
  getProfil: id => api.get(`/etudiants/${id}`),
  search: q => api.get('/etudiants/search', { params: { q } }),
  suivre: id => api.post(`/etudiants/${id}/suivre`),
  seDesabonner: id => api.delete(`/etudiants/${id}/suivre`),
  getAbonnements: () => api.get('/etudiants/me/abonnements'),
};

// Publications
export const publicationApi = {
  getFil: (page = 0, size = 20) => api.get('/publications/fil', { params: { page, size } }),
  getByEtudiant: (id, page = 0) => api.get(`/publications/etudiant/${id}`, { params: { page } }),
  creer: d => api.post('/publications', d),
  modifier: (id, d) => api.put(`/publications/${id}`, d),
  supprimer: id => api.delete(`/publications/${id}`),
  marquerResolu: id => api.patch(`/publications/${id}/resolu`),
  liker: id => api.post(`/publications/${id}/liker`),
  getCommentaires: id => api.get(`/publications/${id}/commentaires`),
  commenter: (id, d) => api.post(`/publications/${id}/commentaires`, d),
  supprimerCommentaire: id => api.delete(`/publications/commentaires/${id}`),
};

// Messages
export const messageApi = {
  envoyer: d => api.post('/messages', d),
  getConversation: id => api.get(`/messages/conversation/${id}`),
  marquerLus: id => api.patch(`/messages/conversation/${id}/lu`),
  getContacts: () => api.get('/messages/contacts'),
};

// Lives
export const liveApi = {
  getLivesActifs: () => api.get('/lives'),
  creer: d => api.post('/lives', d),
  demarrer: id => api.post(`/lives/${id}/demarrer`),
  arreter: id => api.post(`/lives/${id}/arreter`),
  rejoindre: id => api.post(`/lives/${id}/rejoindre`),
  quitter: id => api.post(`/lives/${id}/quitter`),
  donnerMain: (id, intervenantId) => api.post(`/lives/${id}/main/${intervenantId}`),
  retirerMain: (id, intervenantId) => api.delete(`/lives/${id}/main/${intervenantId}`),
  getPages: id => api.get(`/lives/${id}/pages`),
  ajouterPage: id => api.post(`/lives/${id}/pages`),
  sauvegarderPage: (id, pageNum, contenuJson) => api.put(`/lives/${id}/pages/${pageNum}`, { contenuJson }),
  changerPage: (id, pageNum) => api.patch(`/lives/${id}/pages/${pageNum}/active`),
};

// Notifications
export const notifApi = {
  getAll: () => api.get('/notifications'),
  count: () => api.get('/notifications/count'),
  marquerLue: id => api.patch(`/notifications/${id}/lue`),
  marquerToutesLues: () => api.patch('/notifications/toutes-lues'),
};
