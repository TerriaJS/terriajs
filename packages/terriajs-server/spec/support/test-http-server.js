import express from "express";
import http from "node:http";

/**
 * Creates a simple HTTP server for testing proxy functionality
 * @param {number} port - Port to listen on
 * @param {object} routes - Object mapping paths to response handlers
 * @returns {object} Server with close method
 */
async function createTestServer(port) {
  const app = express();
  app.use(express.json());

  const routes = new Map();

  // Helper to register routes dynamically
  const addRoute = (method, path, handler) => {
    const key = `${method.toUpperCase()}:${path}`;
    routes.set(key, handler);
  };

  const clearRoutes = () => {
    routes.clear();
  };

  // Catch-all handler
  app.use((req, res) => {
    const key = `${req.method}:${req.path}`;
    const handler = routes.get(key);

    if (handler) {
      handler(req, res);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  const server = http.createServer(app);

  return new Promise((resolve) => {
    server.listen(port, () => {
      // console.log(`Test server running on http://localhost:${port}`);
      resolve({
        addRoute,
        clearRoutes,
        close: () =>
          new Promise((resolveClose) => {
            server.close(() => resolveClose());
          }),
        port,
        url: `http://localhost:${port}`
      });
    });
  });
}

export { createTestServer };
