import { Response } from 'express';

type SSEClient = {
  id: string;
  res: Response;
};

class NotificationService {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, res: Response): void {
    this.clients.set(id, { id, res });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.clients.delete(id);
    });
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  broadcast(event: string, data: unknown): void {
    const message = `data: ${JSON.stringify({ type: event, data, timestamp: new Date().toISOString() })}\n\n`;

    for (const client of this.clients.values()) {
      try {
        client.res.write(message);
      } catch {
        this.clients.delete(client.id);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const notifications = new NotificationService();
