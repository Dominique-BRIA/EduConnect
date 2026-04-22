const fallbackHost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname || 'localhost'

const fallbackProtocol =
  typeof window === 'undefined' ? 'http:' : window.location.protocol || 'http:'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export const backendOrigin =
  import.meta.env.VITE_BACKEND_ORIGIN?.trim() || `${fallbackProtocol}//${fallbackHost}:8080`

export const websocketOrigin =
  import.meta.env.VITE_WS_ORIGIN?.trim() || backendOrigin.replace(/^http/i, 'ws')
