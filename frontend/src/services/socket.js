import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '')
  : 'http://localhost:5000';

let socket = null;

export const getSocket = async () => {
  if (socket && socket.connected) return socket;
  const token = await SecureStore.getItemAsync('token');
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};