import express from "express";
import httpProxy from "http-proxy";
import http from "node:http";
import net from "node:net";

const createProxyServer = (port, connectCallback) => {
  const app = express();
  const proxy = httpProxy.createProxyServer({});

  // Handle regular HTTP proxying
  app.use((req, res) => {
    const targetUrl = req.url;
    // Call the callback to track that proxy was used
    if (connectCallback && targetUrl.startsWith("http://")) {
      connectCallback();
    }

    proxy.web(req, res, { target: `http://${req.headers.host}` }, (err) => {
      console.error("Proxy error:", err);
      res.status(502).send("Bad Gateway");
    });
  });

  const server = http.createServer(app);

  server.on("connect", (req, clientSocket, head) => {
    connectCallback();
    const { hostname: targetHostname, port: targetPort } = new URL(
      `https://${req.url}`
    );
    const serverSocket = net.connect(
      parseInt(targetPort) || 443,
      targetHostname,
      () => {
        clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
      }
    );

    serverSocket.on("error", (err) => {
      console.error("HTTPS CONNECT error:", err);
      clientSocket.end();
    });
  });

  // Start server
  server.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
  });

  return {
    close: () => {
      server.close();
    }
  };
};

export { createProxyServer };
