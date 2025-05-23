import { GuaritaInfo } from "../types";
import { Socket } from "net";

const guaritas = new Map<string, GuaritaInfo>();

export function registerGuarita(
  mac: string,
  password: string,
  keepAlive: number,
  socket: Socket
) {
  let info = guaritas.get(mac);
  if (!info) {
    info = { sockets: [], password, keepAlive, lastSeen: Date.now() };
    guaritas.set(mac, info);
  }
  info.lastSeen = Date.now();
  if (!info.sockets.includes(socket)) {
    info.sockets.push(socket);
  }
}

export function removeGuarita(mac: string) {
  const info = guaritas.get(mac);
  if (info) {
    info.sockets.forEach((s) => s.destroy());
    guaritas.delete(mac);
  }
}

export function findGuaritaByPassword(password: string) {
  for (const [mac, info] of guaritas.entries()) {
    if (info.password === password && info.sockets.length > 0) {
      return { mac, info };
    }
  }
  return null;
}

export function monitorKeepAlive() {
  setInterval(() => {
    const now = Date.now();
    for (const [mac, info] of guaritas.entries()) {
      if (info.keepAlive > 0 && now - info.lastSeen > info.keepAlive * 1000) {
        console.warn(`Keep-alive expirado para ${mac}, removendo.`);
        removeGuarita(mac);
      }
    }
  }, 5000);
}
