import { WebSocketServer, WebSocket } from 'ws';

interface Client {
  ws: WebSocket;
  assignmentId?: string;
}

class WSManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, Client>();

  init(wss: WebSocketServer): void {
    this.wss = wss;
    wss.on('connection', (ws, req) => {
      const id = Math.random().toString(36).slice(2);
      this.clients.set(id, { ws });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'subscribe' && msg.assignmentId) {
            const client = this.clients.get(id);
            if (client) client.assignmentId = msg.assignmentId;
          }
        } catch {}
      });

      ws.on('close', () => this.clients.delete(id));
      ws.on('error', () => this.clients.delete(id));

      ws.send(JSON.stringify({ type: 'connected', id }));
    });
  }

  broadcast(assignmentId: string, message: object): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.assignmentId === assignmentId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }

  broadcastAll(message: object): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }
}

export const wsManager = new WSManager();
