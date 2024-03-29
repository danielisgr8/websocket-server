import WebSocket from 'ws';

interface WebSocketMessage {
  event: string;
  data: any;
}

interface EventHandler {
  (id: number, data: any): void
}

// TODO: Consider a low-coupling way to handle reconnects
// TODO: Replace console.log usage with an optional log callback
class WebSocketServer {
  // FIXME: Set through a setter method or constructor instead
  public onClose: ((id: number) => void) | undefined;

  private wss: WebSocket.Server;
  private events: { [eventName: string]: Array<EventHandler> };
  private clients: { [id: number]: WebSocket };
  private clientCount: number;

  public constructor(wss: WebSocket.Server) {
    this.wss = wss;

    this.events = {};
    this.clients = {};
    this.clientCount = 0;
  }

  public run(): void {
    this.wss.on('connection', (ws) => {
      const id = this.clientCount++;
      this.clients[id] = ws;

      ws.on('message', (message) => {
        let stringMessage = '';
        if (message instanceof Buffer) {
          stringMessage = message.toString();
        } else if (message instanceof ArrayBuffer) {
          stringMessage = new TextDecoder().decode(message);
        } else {
          message.forEach((buffer) => {
            stringMessage += buffer.toString();
          });
        }
        this.handleEvent(id, stringMessage);
      });

      ws.on('close', () => {
        if (this.onClose) this.onClose(id);
      });
    });
  }

  public addEventHandler(eventName: string, callback: EventHandler): void {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push(callback);
  }

  public removeEventHandler(eventName: string, callback: EventHandler): void {
    if (this.events[eventName]) {
      // TODO: See if there's a better way to do this using indexOf and splice
      this.events[eventName] = this.events[eventName].filter((fn) => fn !== callback);
    }
  }

  private handleEvent(id: number, message: string): void {
    console.log(`Received from ${id}: ${message}`);
    const parsedMessage: WebSocketMessage = JSON.parse(message);

    const handlers = this.events[parsedMessage.event];
    if (handlers) handlers.forEach((handler) => handler(id, parsedMessage.data));
  }

  public sendMessage(id: number, event: string, data: any): void {
    const ws = this.clients[id];
    if (!ws) throw new Error(`No WebSocket connection found with ID ${id}`);

    const msg = JSON.stringify({
      event,
      data,
    });

    if (ws.readyState === WebSocket.OPEN) {
      console.log(`Sending to ${id}: ${msg}`);
      ws.send(msg);
    }
  }
}

export default WebSocketServer;
export type { EventHandler };
