import { server } from "./socket";




server.listen(9000, () => {
  console.log("Servidor TCP escutando na porta 9000");
});
