
import { StreamUIMessages } from './types.js';

const HOST = process.env.PUBSUB_HOST ?? 'localhost';
const API_KEY = process.env.PUBSUB_API_KEY ?? '';

export type CreatePublisherClient = {
  topic: string;
};

export type PublisherClient = {
  publish: (message: StreamUIMessages) => void;
  close: () => void;  
}

export type CreateSubscriberClient = {
  topic: string;
  host: string;
  onMessage: (message: StreamUIMessages) => void;
  onOpen?: () => void;
  onError?: (error: Error) => void;
};

export type SubscriberClient = {
  close: () => void;
};


export const publisherClient = async ({ topic }: CreatePublisherClient): Promise<PublisherClient> => {

  const ws = new WebSocket(`wss://${HOST}/ws/publish/${topic}?key=${API_KEY}`);

  let resolve: (value: void | PromiseLike<void>) => void,
    reject: (arg0: Error) => void;

  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  
  // create a readable stream to emit messages

  ws.onopen = () => {
    resolve();
  };
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    reject(new Error(`WebSocket error: ${error}`));
  };
  ws.onclose = () => {
    if (ws.readyState !== WebSocket.CLOSED) {
      reject(new Error("WebSocket closed unexpectedly"));
    }
  };

  await promise;

  return {
    publish: (message: StreamUIMessages) => {
      ws.send(JSON.stringify(message));
    },

    close: () => {
      ws.close();
    },
  };
};


export const subscriberClient = async ({
  topic,
  host,
  onMessage,
  onError
}: CreateSubscriberClient): Promise<SubscriberClient> => {
  const ws = new WebSocket(`wss://${host}/ws/subscribe/${topic}`);
    
  let closed: boolean = false;

  let resolve: (value: void | PromiseLike<void>) => void,
    reject: (arg0: Error) => void;

  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  // create a readable stream to emit messages

  ws.onopen = () => {
    resolve();
  };
  ws.onerror = (error) => {
    const err = new Error(`WebSocket error: ${error}`);
    reject(err);
    onError?.(err);
  };
  ws.onclose = () => {
    if (ws.readyState !== WebSocket.CLOSED) {
      reject(new Error('WebSocket closed unexpectedly'));
    }
  };
  ws.onmessage = async (event) => {
    let data;
    if (event.data instanceof Blob) {
      const text = await event.data.text();
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse JSON:", text);
        return;
      }
    } else if (typeof event.data === "string") {
      // Handle string messages directly
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.error("Failed to parse JSON:", event.data);
        return;
      }
    } else {
      console.warn("Received unexpected message type:", typeof event.data);
      return;
    }

    const message = data as StreamUIMessages;
    if (closed) return;
    onMessage(message);
  };

  await promise;

  return {
    close: () => {
      closed = true;
      ws.close();
    },
  };
};

