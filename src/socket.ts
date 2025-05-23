import { createServer } from "net";
import {
  registerGuarita,
  touchGuarita,
  findGuaritaByPassword,
  monitorKeepAlive,
} from "./services/store";
import { createBridge } from "./services/bridge";
import { SocketExt } from "./types";

monitorKeepAlive();

export const server = createServer((cSock: SocketExt) => {
  const id = `${cSock.remoteAddress}:${cSock.remotePort}`;
  console.log("Cliente conectado:", id);

  cSock.on("data", (buf) => {
    const msg = buf.toString().trim();

    // 1) Handshake inicial
    if (!cSock.role) {
      if (msg.startsWith("@")) {
        // GUARITA
        const [, mac, pass, keep] = msg.split("@");
        const keepAlive = parseInt(keep, 10);
        console.log(`Guarita ${mac} auth, keepAlive=${keepAlive}`);
        cSock.role     = "guarita";
        cSock.mac      = mac;
        cSock.password = pass;
        registerGuarita(mac, pass, keepAlive, cSock);
        cSock.write("Autorizado   \x00");  // 3 espaços + \x00
      } else {
        // NICE
        console.log(`Nice iniciou auth com senha="${msg}"`);
        cSock.role     = "nice";
        cSock.password = msg;
        cSock.write("Autorizado\x00");
        const target = findGuaritaByPassword(msg);
        if (!target) {
          console.warn("Nenhuma guarita para essa senha, fechando Nice");
          return cSock.end();
        }
        console.log(`Criando bridge: Nice ↔ Guarita ${target.mac}`);
        createBridge(cSock, target.info.sockets[0]);
      }
      return;
    }

    // 2) Após handshake, guarita envia keep-alive
    if (cSock.role === "guarita") {
      touchGuarita(cSock.mac!);
      return;
    }

    // 3) Se forem dados do Nice, eles fluem pela bridge automaticamente
  });

  cSock.on("end", () => console.log("Cliente desconectou:", id));
  cSock.on("error", (err) => console.error("Erro socket", id, err));
});
