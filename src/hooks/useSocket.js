import { useState, useEffect, useRef } from 'react';
// Import real socket.io-client or mock for testing
// import { io } from '../services/mockSocket.js'; // Use mock for testing
import { io } from 'socket.io-client'; // Use real socket.io when backend is ready

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Get server URL from environment variable or use default
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

    // Create socket connection
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false
    });

    const currentSocket = socketRef.current;

    // Connection event handlers
    currentSocket.on('connect', () => {
      console.log('Connected to server:', currentSocket.id);
      setIsConnected(true);
    });

    currentSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
    });

    currentSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    currentSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to server, attempt:', attemptNumber);
      setIsConnected(true);
    });

    currentSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    currentSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to server');
      setIsConnected(false);
    });

    // Set socket in state and add emit interceptor for mock
    if (currentSocket.handleMessage) {
      // For mock socket, intercept emit calls
      const originalEmit = currentSocket.emit.bind(currentSocket);
      currentSocket.emit = (event, data) => {
        if (event === 'message') {
          currentSocket.handleMessage(data);
        }
        return originalEmit(event, data);
      };
    }
    
    setSocket(currentSocket);

    // Cleanup function
    return () => {
      if (currentSocket) {
        currentSocket.disconnect();
        currentSocket.removeAllListeners();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
      }
    };
  }, []);

  return {
    socket,
    isConnected
  };
};

export default useSocket;