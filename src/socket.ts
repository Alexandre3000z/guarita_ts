import { createServer, Socket } from "net";
import {
  registerGuarita,
  findGuaritaByPassword,
  monitorKeepAlive,
  touchGuarita,      // vamos criar isso
} from "./services/store";
import { createBridge } from "./services/bridge";

monitorKeepAlive();  // inicia o monitor

export const server = createServer((client: Socket) => {
  const clienteId = `${client.remoteAddress}:${client.remotePort}`;
  console.log(`Cliente conectado: ${clienteId}`);

  client.on("data", (buffer) => {
    const msg = buffer.toString().trim();

    // 1) Mensagem inicial de guarita
    if (msg.startsWith("@")) {
      const [, mac, pass, keep] = msg.split("@");
      const keepAlive = parseInt(keep, 10);
      console.log(`Guarita ${mac} auth (keepAlive=${keepAlive}s)`);
      registerGuarita(mac, pass, keepAlive, client);
      client.write("Autorizado   \x00");
      return;
    }

    // 2) Caso seja uma mensagem de keep-alive puro da guarita
    const entry = findGuaritaByPassword(msg);
    if (!entry) {
      // 3) Talvez seja o Nice (envia só a senha)
      client.write("Autorizado\x00");
      const target = findGuaritaByPassword(msg);
      if (!target) {
        console.warn(`Nice tentou auth com senha ${msg}, sem guarita.`);
        return client.end();
      }
      console.log(`Nice conectado, criando bridge com ${target.mac}`);
      return createBridge(client, target.info.sockets[0]);
    }

    // 4) Se chegou aqui e msg === senha de guarita, é keep-alive
    //    podemos apenas “tocar” o lastSeen
    touchGuarita(entry.mac);
  });

  client.on("end", () => {
    console.log(`Cliente desconectou: ${clienteId}`);
  });

  client.on("error", (err) => {
    console.error(`Erro no socket ${clienteId}:`, err);
  });
});
