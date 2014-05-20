describe("Dataset", function() {
  var dataset;

  beforeEach(function() {
    dataset = new ausglobe.Dataset();
  });

  it("should have no points", function() {
    expect(dataset._pnt_cnt).toEqual(0);
  });
});
