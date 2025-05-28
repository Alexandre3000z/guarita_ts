import { format } from 'date-fns';
import { Socket } from 'net';
import { createWriteStream, WriteStream, existsSync, mkdirSync } from 'fs';
import path from 'path';

class GuaritaLogger {
  private logStream: WriteStream;
  private readonly logFilePath: string;
  
  constructor() {
    // Define o caminho do arquivo de log na raiz do projeto
    this.logFilePath = path.resolve(__dirname, '../logs.txt');
    
    try {
      // Verifica/Cria o diretório se necessário
      const logDir = path.dirname(this.logFilePath);
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }

      // Configura o stream de arquivo com tratamento de erros
      this.logStream = createWriteStream(this.logFilePath, { 
        flags: 'a',
        encoding: 'utf8'
      });

      this.logStream.on('error', (err) => {
        console.error('Erro no logStream:', err);
      });

      this.info(`Logger inicializado. Arquivo de log: ${this.logFilePath}`);

    } catch (err) {
      console.error('Falha ao inicializar logger:', err);
      // Fallback para stdout se não conseguir criar arquivo
      this.logStream = process.stdout as unknown as WriteStream;
    }
  }

  private formatTimestamp(): string {
    return format(new Date(), 'MMM dd HH:mm:ss');
  }

  private formatMessage(type: string, message: string): string {
    return `${this.formatTimestamp()} [${type}]: ${message}`;
  }

  private writeToLog(message: string): void {
    try {
      this.logStream.write(message + '\n');
    } catch (err) {
      console.error('Falha ao escrever no log:', err);
    }
  }

  // Métodos para diferentes níveis de log
  public info(message: string): void {
    const formatted = this.formatMessage('INFO', message);
    console.log(formatted);
    this.writeToLog(formatted);
  }
    public debug(message: string): void {
    const formatted = this.formatMessage('DEBUG', message);
    console.log(formatted);
    this.writeToLog(formatted);
  }

  public warn(message: string): void {
    const formatted = this.formatMessage('WARN', message);
    console.warn(formatted);
    this.writeToLog(formatted);
  }

  public error(message: string): void {
    const formatted = this.formatMessage('ERROR', message);
    console.error(formatted);
    this.writeToLog(formatted);
  }

  // Logs específicos para conexões
  public connection(socket: Socket, message: string): void {
    const ip = socket.remoteAddress?.replace('::ffff:', '') || 'unknown';
    const port = socket.remotePort?.toString() || '?';
    this.info(`Nova conexão de: (${ip}, ${port}) - ${message}`);
  }

  // Logs para mensagens recebidas/enviadas
  public messageFlow(direction: 'in'|'out', socket: Socket, message: Buffer|string, host2: string): void {
    const ip = socket.remoteAddress?.replace('::ffff:', '') || 'unknown';
    const port = socket.remotePort?.toString() || '?';
    
    let msg = typeof message === 'string' 
      ? message.trim()
      : message.toString('hex');

    if (msg.length > 50 || msg.length <= 2){
        msg = "..."
    }

    
    this.info(`Mensagem: ${direction === 'in' ? `[${msg}] | enviada de (${ip}:${port}) <--para--> ${host2}` : `[${msg}] | enviada de ${host2} <--para--> (${ip}:${port})`}`);
  }

  // Logs específicos para Guarita
  public guaritaAuth(mac: string, password: string, keepAlive: number): void {
    this.info(`Guarita MAC: ${mac}, Senha: ${password}, Keep Alive: ${keepAlive} segundos`);
  }

  // Logs específicos para Nice
  public niceAuth(password: string): void {
    this.info(`Software Nice identificado com senha: ${password}`);
  }

  // Logs para bridge
  public bridgeCreated(niceSocket: Socket, guaritaSocket: Socket): void {
    const niceAddr = `${niceSocket.remoteAddress}:${niceSocket.remotePort}`;
    const guaritaAddr = `${guaritaSocket.remoteAddress}:${guaritaSocket.remotePort}`;
    this.info(`Bridge criada: Nice (${niceAddr}) ↔ Guarita (${guaritaAddr})`);
  }

  // Método para fechar o logger adequadamente
  public close(): void {
    this.info("Encerrando logger...");
    this.logStream.end();
  }
}

// Exporta uma instância única (singleton)
export const logger = new GuaritaLogger();