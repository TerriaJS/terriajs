import { http, HttpResponse } from "msw";

/** The tile server of the test datasets and base maps */
export const TILES = "https://tiles.invalid";

// A transparent PNG, a pixel in size, as each tile
const BLANK_TILE = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII="
  ),
  (char) => char.charCodeAt(0)
);

/**
 * Answers every tile with a blank one, as a working server does. Registered
 * for every test (network.ts), as a test's tiles can still be requested once
 * it has ended
 */
export const tileServer = http.get(`${TILES}/*`, () =>
  HttpResponse.arrayBuffer(BLANK_TILE.buffer, {
    headers: { "Content-Type": "image/png" }
  })
);

/** Fails every tile, as a server that's down: `network.use(tileServerDown)` */
export const tileServerDown = http.get(`${TILES}/*`, () =>
  HttpResponse.error()
);
