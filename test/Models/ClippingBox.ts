describe("ClippingBox", function() {
  describe("clippingPlaneCollection", function() {
    describe("when clipping outside the box", function() {
      it("the plane normals must point inwards");
      it("sets unionClippingRegions to true");
    });

    describe("when clipping outside the box", function() {
      it("the plane normals must point outwards");
      it("sets unionClippingRegions to false");
    });
  });

  describe("dataSource", function() {
    describe("box sides", function() {});
    describe("corner points", function() {
      it("generates 8 corner points");
    });
  });

  describe("interaction", function() {});
});
