import { Socket } from "net";

export function createBridge(a: Socket, b: Socket) {
  const closeAll = () => {
    a.destroy();
    b.destroy();
  };

  a.on("data", (chunk) => b.write(chunk));
  b.on("data", (chunk) => a.write(chunk));

  a.on("close", closeAll);
  b.on("close", closeAll);
  a.on("error", closeAll);
  b.on("error", closeAll);
}
