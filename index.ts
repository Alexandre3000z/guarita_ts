import { server } from "./src/socket";

const PORT = 9000;
server.listen(PORT, () => {
  console.log(`Servidor TCP escutando na porta ${PORT}`);
});
