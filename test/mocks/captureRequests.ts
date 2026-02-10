import { worker } from "./browser";

export interface CapturedRequest {
  url: string;
  method: string;
  body: string | null;
  headers: Headers;
}

export function captureRequests(): {
  requests: CapturedRequest[];
  clear: () => void;
  dispose: () => void;
} {
  const requests: CapturedRequest[] = [];

  const unsubscribe = worker.events.on("request:match", async ({ request }) => {
    requests.push({
      url: request.url,
      method: request.method,
      body: await request.clone().text(),
      headers: request.headers
    });
  });

  return {
    requests,
    clear: () => {
      requests.length = 0;
    },
    dispose: () => unsubscribe()
  };
}
