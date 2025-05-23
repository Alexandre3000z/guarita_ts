import * as net from 'net';

const server = net.createServer((socket) => {
  console.log('Cliente conectado');

  socket.on('data', (data) => {
    console.log('Recebido:', data.toString());
    // Processar dados e responder
  });

  socket.on('end', () => {
    console.log('Cliente desconectado');
  });
});

server.listen(9000, () => {
  console.log('Servidor TCP escutando na porta 9000');
});
