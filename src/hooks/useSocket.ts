'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (roomName?: string) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the Socket.io server (port matches Next.js custom server)
    const socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to socket server:', socket.id);
      if (roomName) {
        socket.emit('join-room', roomName);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from socket server');
    });

    return () => {
      if (roomName) {
        socket.emit('leave-room', roomName);
      }
      socket.disconnect();
    };
  }, [roomName]);

  return {
    socket: socketRef.current,
    connected,
  };
};
