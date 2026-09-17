import { io } from 'socket.io-client';

// const SOCKET_URL = "http://13.200.197.115:8000/";
const SOCKET_URL = process.env.REACT_APP_LIVE_TRACKING_API_URL || "https://user.aerolive.in";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}
