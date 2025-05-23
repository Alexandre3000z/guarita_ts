import { GuaritaInfo, SocketExt } from "../types";
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

  // Substitui sockets antigos (opcional) ou limpa depois
  if (info.sockets.length > 0) {
    info.sockets.forEach((s) => s.destroy());
    info.sockets = [];
  }

  info.sockets.push(socket);

  const cleanup = () => removeSocket(mac, socket);
  socket.on("close", cleanup);
  socket.on("error", cleanup);
}

export function touchGuarita(mac: string) {
  const info = guaritas.get(mac);
  if (info) info.lastSeen = Date.now();
}

export function findGuaritaByPassword(password: string) {
  for (const [mac, info] of guaritas.entries()) {
    if (info.password === password && info.sockets.length > 0) {
      return { mac, info };
    }
  }
  return null;
}

export function removeSocket(mac: string, sock: Socket) {
  const info = guaritas.get(mac);
  if (!info) return;
  info.sockets = info.sockets.filter((s) => s !== sock);
  if (info.sockets.length === 0) {
    console.log(`Todas conexões da guarita ${mac} encerradas; removendo-a.`);
    guaritas.delete(mac);
  }
}

export function monitorKeepAlive() {
  setInterval(() => {
    const now = Date.now();
    for (const [mac, info] of guaritas.entries()) {
      if (info.keepAlive > 0 && now - info.lastSeen > info.keepAlive * 1000) {
        console.warn(`Keep-alive expirado para ${mac}, removendo.`);
        info.sockets.forEach((s) => s.destroy());
        guaritas.delete(mac);
      }
    }
  }, 5000);
}
