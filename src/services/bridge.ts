import * as net from "net";

export function createBridge(socketA: net.Socket, socketB: net.Socket) {
  socketA.on("data", (data) => socketB.write(data));
  socketB.on("data", (data) => socketA.write(data));

  const closeBoth = () => {
    socketA.destroy();
    socketB.destroy();
  };

  socketA.on("close", closeBoth);
  socketB.on("close", closeBoth);
  socketA.on("error", closeBoth);
  socketB.on("error", closeBoth);
}
