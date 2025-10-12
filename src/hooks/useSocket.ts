
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export function useSocket() {
  const { token } = useAuth();
  const sock = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const apiBase =
      import.meta.env.VITE_NODE_ENV == 'development'
        ? import.meta.env.VITE_DEV_API_BASE
        : import.meta.env.VITE_PROD_API_BASE;

 
    const origin = apiBase.replace(/\/api\/?$/, '');

    const s = io(origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      withCredentials: true,
      timeout: 20000,
    });

    s.on('connect', () => {
      
      s.io.engine.on('upgrade', () => {
       
      });
    });

    s.on('connect_error', (err: any) => {
   
    });

    sock.current = s;
    return () => { s.disconnect(); sock.current = null; };
  }, [token]);

  return sock.current;
}
