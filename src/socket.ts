import { createServer } from "net";
import {
  registerGuarita,
  touchGuarita,
  findGuaritaByPassword,
  monitorKeepAlive,
} from "./services/store";
import { createBridge } from "./services/bridge";
import { SocketExt } from "./types";
import { logger } from "./services/logger"; // Importando o logger

// Inicia o monitor de keep-alive
monitorKeepAlive();

export const server = createServer((cSock: SocketExt) => {
  // Registra a nova conexão usando o logger
  logger.connection(cSock, "Novo cliente conectado");

  cSock.on("data", (buf) => {
    const msg = buf.toString().trim();
    logger.messageFlow('in', cSock, msg, 'Servidor'); // Log da mensagem recebida

    // 1) Handshake inicial
    if (!cSock.role) {
      if (msg.startsWith("@")) {
        // GUARITA
        const [, mac, pass, keep] = msg.split("@");
        const keepAlive = parseInt(keep, 10);
        
        // Log detalhado da autenticação da Guarita
        logger.guaritaAuth(mac, pass, keepAlive);
        
        cSock.role = "guarita";
        cSock.mac = mac;
        cSock.password = pass;
        
        registerGuarita(mac, pass, keepAlive, cSock);
        
        const authResponse = "Autorizado   \x00";
        cSock.write(authResponse);
        logger.messageFlow('out', cSock, authResponse, 'Servidor'); // Log da resposta

      } else {
        // NICE
        logger.niceAuth(msg); // Log da autenticação Nice
        
        cSock.role = "nice";
        cSock.password = msg;
        
        const authResponse = "Autorizado\x00";
        cSock.write(authResponse);
        logger.info('Software NICE conectando com guarita'); // Log da resposta

        const target = findGuaritaByPassword(msg);
        if (!target) {
          logger.warn(`Nenhuma guarita encontrada para a senha: ${msg}`);
          return cSock.end();
        }
        
        logger.bridgeCreated(cSock, target.info.sockets[0]);
        createBridge(cSock, target.info.sockets[0]);
      }
      return;
    }

    // 2) Após handshake, guarita envia keep-alive
    if (cSock.role === "guarita") {
      logger.info(`Keep-alive recebido da Guarita ${cSock.mac}`);
      touchGuarita(cSock.mac!);
      return;
    }
    
    // 3) Se forem dados do Nice, eles fluem pela bridge automaticamente
  });

  cSock.on("end", () => {
    const ip = cSock.remoteAddress?.replace('::ffff:', '') || 'unknown';
    const port = cSock.remotePort?.toString() || '?';
    logger.info(`Cliente desconectado: (${ip}, ${port})`);
  });

  cSock.on("error", (err) => {
    const ip = cSock.remoteAddress?.replace('::ffff:', '') || 'unknown';
    const port = cSock.remotePort?.toString() || '?';
    logger.error(`Erro no socket (${ip}, ${port}): ${err.message}`);
  });
});
