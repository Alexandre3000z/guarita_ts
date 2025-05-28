import { Socket } from "net";

export function createBridge(a: Socket, b: Socket) {
  const idA = `${a.remoteAddress}:${a.remotePort}`;
  const idB = `${b.remoteAddress}:${b.remotePort}`;

  const closeAll = () => {
    a.destroy();
    b.destroy();
  };

  a.on("data", (chunk) => {
    // log no console o que o app (Nice) está enviando para a guarita
    // console.log(`[→] ${idA} → ${idB} | ${chunk.length} bytes`);
    // Se quiser ver como texto:
    // console.log(`    Texto: ${chunk.toString("utf8")}`);
    // Ou, para bytes brutos (hex):
    // console.log(`    Hex: ${chunk.toString("hex")}`);
    b.write(chunk);
  });

  b.on("data", (chunk) => {
    // log no console o que a guarita está enviando para o app
    // console.log(`[←] ${idB} → ${idA} | ${chunk.length} bytes`);
    // console.log(`    Texto: ${chunk.toString("utf8")}`);
    // console.log(`    Hex: ${chunk.toString("hex")}`);
    a.write(chunk);
  });

  a.on("close", closeAll);
  b.on("close", closeAll);
  a.on("error", closeAll);
  b.on("error", closeAll);
}
