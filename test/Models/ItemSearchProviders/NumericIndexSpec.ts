import NumericIndex from "../../../lib/Models/ItemSearchProviders/NumericIndex";

describe("NumericIndex", function() {
  describe("search", function() {
    it("should return all matching IDs when the start and end values are the same", async function() {
      const index = new NumericIndex("", { min: 0, max: 10 });
      index.idValuePairs = Promise.resolve([
        { dataRowId: 0, value: 0 },
        { dataRowId: 1, value: 1 },
        { dataRowId: 2, value: 2 },
        { dataRowId: 3, value: 3 },
        { dataRowId: 4, value: 3 },
        { dataRowId: 5, value: 3 },
        { dataRowId: 6, value: 3 },
        { dataRowId: 7, value: 3 },
        { dataRowId: 8, value: 9 },
        { dataRowId: 9, value: 10 }
      ]);
      const ids = await index.search({ start: 3, end: 3 });
      expect([...ids]).toEqual([3, 4, 5, 6, 7]);
    });
  });
});
