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

  const listener = async ({ request }: { request: Request }) => {
    requests.push({
      url: request.url,
      method: request.method,
      body: await request.clone().text(),
      headers: request.headers
    });
  };

  // Use request:start (fires before handler) so the body is not yet consumed.
  // request:match fires after the handler, where POST body may already be read.
  worker.events.on("request:start", listener);

  return {
    requests,
    clear: () => {
      requests.length = 0;
    },
    dispose: () => worker.events.removeListener("request:start", listener)
  };
}
