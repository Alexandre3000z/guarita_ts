import { createServer, Socket } from "net";

export const server = createServer((client: Socket) => {
  console.log("Cliente conectado:", client.remoteAddress, client.remotePort);
  const clienteId = `${client.remoteAddress}:${client.remotePort}`;
  
  client.on("data", (data) => {
    console.log("Recebido do cliente:", data.toString());
    // aqui você processa e, se for bridge, envia para outro socket…
  });

  client.on("end", () => {
    console.log(`Cliente desconectou: ${clienteId}`);
  });

  client.on("error", (err) => {
    console.error(`Erro no socket ${clienteId}:`, err);
  });
});
