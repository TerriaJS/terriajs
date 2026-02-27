import getClipsForSplitter from "../../../lib/Map/Leaflet/getClipsForSplitter";

describe("getClipsForSplitter", function () {
  it("returns correct left and right clip-path polygons for a given split position", function () {
    const result = getClipsForSplitter({
      size: { x: 1000, y: 600 },
      nw: { x: 0, y: 0 },
      se: { x: 1000, y: 600 },
      splitPosition: 0.5
    });

    expect(result.left).toBe(
      "polygon(0px 0px, 500px 0px, 500px 600px, 0px 600px)"
    );
    expect(result.right).toBe(
      "polygon(500px 0px, 1000px 0px, 1000px 600px, 500px 600px)"
    );
    expect(result.clipX).toBe(500);
  });

  it("rounds clipX to the nearest integer", function () {
    const result = getClipsForSplitter({
      size: { x: 1001, y: 600 },
      nw: { x: 0, y: 0 },
      se: { x: 1001, y: 600 },
      splitPosition: 0.5
    });

    expect(result.clipX).toBe(501);
    expect(result.left).toBe(
      "polygon(0px 0px, 501px 0px, 501px 600px, 0px 600px)"
    );
  });

  it("handles non-zero nw offset (scrolled/panned map)", function () {
    const result = getClipsForSplitter({
      size: { x: 800, y: 400 },
      nw: { x: -100, y: -50 },
      se: { x: 700, y: 350 },
      splitPosition: 0.25
    });

    expect(result.clipX).toBe(Math.round(-100 + 800 * 0.25));
    expect(result.left).toBe(
      "polygon(-100px -50px, 100px -50px, 100px 350px, -100px 350px)"
    );
    expect(result.right).toBe(
      "polygon(100px -50px, 700px -50px, 700px 350px, 100px 350px)"
    );
  });

  it("handles split position at 0 (fully left)", function () {
    const result = getClipsForSplitter({
      size: { x: 1000, y: 600 },
      nw: { x: 0, y: 0 },
      se: { x: 1000, y: 600 },
      splitPosition: 0
    });

    expect(result.clipX).toBe(0);
    expect(result.left).toBe("polygon(0px 0px, 0px 0px, 0px 600px, 0px 600px)");
    expect(result.right).toBe(
      "polygon(0px 0px, 1000px 0px, 1000px 600px, 0px 600px)"
    );
  });

  it("handles split position at 1 (fully right)", function () {
    const result = getClipsForSplitter({
      size: { x: 1000, y: 600 },
      nw: { x: 0, y: 0 },
      se: { x: 1000, y: 600 },
      splitPosition: 1
    });

    expect(result.clipX).toBe(1000);
    expect(result.left).toBe(
      "polygon(0px 0px, 1000px 0px, 1000px 600px, 0px 600px)"
    );
    expect(result.right).toBe(
      "polygon(1000px 0px, 1000px 0px, 1000px 600px, 1000px 600px)"
    );
  });
});
