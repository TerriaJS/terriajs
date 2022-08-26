import NumericIndex from "../../../lib/Models/ItemSearchProviders/NumericIndex";

describe("NumericIndex", function () {
  describe("search", function () {
    it("returns all matching IDs when the search query is within the index range", async function () {
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
      const ids = await index.search({ start: 1, end: 9 });
      expect([...ids]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("returns all matching IDs when the end value of the search query is outside the index range", async function () {
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
      const ids = await index.search({ start: 1, end: 100 });
      expect([...ids]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("returns all matching IDs when the start and end values are the same", async function () {
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

    it("returns an empty set when the start and end values are outside the range of the index", async function () {
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
      let ids = await index.search({ start: 30, end: 40 });
      expect(ids.size).toBe(0);
      ids = await index.search({ start: -10, end: -20 });
      expect(ids.size).toBe(0);
    });
  });
});
