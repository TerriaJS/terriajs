import updateApplicationOnMessageFromParentWindow from "../../lib/ViewModels/updateApplicationOnMessageFromParentWindow";

// The handler must only accept start data from an allowed origin. It must NOT
// trust the frame relationship (window.parent / window.opener), because a page
// that frames or opens TerriaJS is the parent/opener.
describe("updateApplicationOnMessageFromParentWindow", function () {
  let updateFromStartData: jasmine.Spy;
  let dispatchMessage: (event: any) => Promise<void> | void;
  let parent: { postMessage: jasmine.Spy };
  let opener: { postMessage: jasmine.Spy };

  function install(selfOrigin: string, allowedOrigins?: string[]) {
    updateFromStartData = jasmine
      .createSpy("updateFromStartData")
      .and.resolveTo({ raiseError: () => {} });
    parent = { postMessage: jasmine.createSpy("parentPostMessage") };
    opener = { postMessage: jasmine.createSpy("openerPostMessage") };

    const listeners: ((event: any) => void)[] = [];
    const window: any = {
      location: { origin: selfOrigin },
      parent,
      opener,
      addEventListener: (_type: string, fn: (event: any) => void) =>
        listeners.push(fn)
    };
    const terria: any = {
      configParameters: { parentMessageAllowedOrigins: allowedOrigins },
      updateFromStartData
    };

    updateApplicationOnMessageFromParentWindow(terria, window);

    dispatchMessage = (event) =>
      Promise.all(listeners.map((fn) => fn(event))).then(() => undefined);
  }

  it("accepts a message from the same origin", async function () {
    install("https://victim.example");
    await dispatchMessage({
      origin: "https://victim.example",
      source: parent,
      data: { initSources: [] }
    });
    expect(updateFromStartData).toHaveBeenCalled();
  });

  it("rejects a cross-origin message from the parent that is not allow-listed", async function () {
    install("https://victim.example");
    await dispatchMessage({
      origin: "https://attacker.example",
      source: parent,
      data: { initSources: ["pwn.json"] }
    });
    expect(updateFromStartData).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin message from the opener that is not allow-listed", async function () {
    install("https://victim.example");
    await dispatchMessage({
      origin: "https://attacker.example",
      source: opener,
      data: { initSources: ["pwn.json"] }
    });
    expect(updateFromStartData).not.toHaveBeenCalled();
  });

  it("accepts a cross-origin message from an allow-listed origin", async function () {
    install("https://victim.example", ["https://embedder.example"]);
    await dispatchMessage({
      origin: "https://embedder.example",
      source: parent,
      data: { initSources: [] }
    });
    expect(updateFromStartData).toHaveBeenCalled();
  });

  it("does not grant trust via event.data.allowOrigin", async function () {
    install("https://victim.example");
    await dispatchMessage({
      origin: "https://attacker.example",
      source: parent,
      data: {
        allowOrigin: "https://attacker.example",
        initSources: ["pwn.json"]
      }
    });
    expect(updateFromStartData).not.toHaveBeenCalled();
  });

  it("ignores react-devtools messages", async function () {
    install("https://victim.example");
    await dispatchMessage({
      origin: "https://victim.example",
      source: parent,
      data: { source: "react-devtools-bridge" }
    });
    expect(updateFromStartData).not.toHaveBeenCalled();
  });

  it("posts 'ready' only to allowed origins, never to '*'", function () {
    install("https://victim.example", ["https://embedder.example"]);
    const targets = parent.postMessage.calls
      .allArgs()
      .concat(opener.postMessage.calls.allArgs());

    expect(targets.length).toBeGreaterThan(0);
    targets.forEach(([message, targetOrigin]) => {
      expect(message).toBe("ready");
      expect(targetOrigin).not.toBe("*");
      expect(["https://victim.example", "https://embedder.example"]).toContain(
        targetOrigin
      );
    });
  });
});
