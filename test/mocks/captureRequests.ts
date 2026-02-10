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

  worker.events.on("request:match", listener);

  return {
    requests,
    clear: () => {
      requests.length = 0;
    },
    dispose: () => worker.events.removeListener("request:match", listener)
  };
}
