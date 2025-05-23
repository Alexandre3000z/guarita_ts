import { createServer, Socket } from "net";
import {
  registerGuarita,
  findGuaritaByPassword,
  monitorKeepAlive,
} from "./services/store";
import { createBridge } from "./services/bridge";

monitorKeepAlive(); // inicia o monitor de keep-alive

export const server = createServer((client: Socket) => {
  const clienteId = `${client.remoteAddress}:${client.remotePort}`;
  console.log(`Cliente conectado: ${clienteId}`);

  client.once("data", (buffer) => {
    const msg = buffer.toString().trim();
    if (msg.startsWith("@")) {
      // Mensagem de guarita: “@MAC@senha@keepAlive”
      const [, mac, pass, keep] = msg.split("@");
      const keepAlive = parseInt(keep, 10);
      console.log(`Guarita ${mac} pediu auth, keepAlive=${keepAlive}`);
      registerGuarita(mac, pass, keepAlive, client);
      client.write("Autorizado   \x00");
      console.log(`Autorizado guarita ${mac}`);
      // não fecha aqui: fica esperando mensagens de keep-alive
    } else {
      // Mensagem do software Nice: apenas a senha
      const pass = msg;
      client.write("Autorizado\x00");
      const entry = findGuaritaByPassword(pass);
      if (!entry) {
        console.warn(`Nice tentou auth com senha ${pass}, sem guarita.`);
        return client.end();
      }
      console.log(`Nice conectado, criando bridge com guarita ${entry.mac}`);
      // usa o primeiro socket ativo
      createBridge(client, entry.info.sockets[0]);
    }
  });

  client.on("end", () => {
    console.log(`Cliente desconectou: ${clienteId}`);
  });

  client.on("error", (err) => {
    console.error(`Erro no socket ${clienteId}:`, err);
  });
});
