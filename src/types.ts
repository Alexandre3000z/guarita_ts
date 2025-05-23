import { Socket } from "net";

export interface GuaritaInfo {
  sockets: Socket[];
  password: string;
  keepAlive: number; // em segundos
  lastSeen: number; // timestamp em ms
}
export interface SocketExt extends Socket {
  role?: "guarita" | "nice";
  mac?: string;
  password?: string;
}
