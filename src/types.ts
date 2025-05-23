import { Socket } from "net";

export interface GuaritaInfo {
  sockets: Socket[];
  password: string;
  keepAlive: number;     // em segundos
  lastSeen: number;      // timestamp em ms
}
