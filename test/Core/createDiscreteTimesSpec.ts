import { Complete } from "../../lib/Core/TypeModifiers";
import createDiscreteTimesFromIsoSegments from "../../lib/Core/createDiscreteTimes";

describe("createDiscreteTimesFromIsoSegments", () => {
  it("should not return duplicates", () => {
    const result: Complete<{
      time?: string;
      tag?: string;
    }>[] = [];
    const value = "2018-02-07T00:00:00.000Z/2018-03-09T00:00:00.000Z/P15D";
    const isoSegments = value.split("/");
    const maxRefreshIntervals = 10;
    createDiscreteTimesFromIsoSegments(
      result,
      isoSegments[0],
      isoSegments[1],
      isoSegments[2],
      maxRefreshIntervals
    );
    expect(result.length).toBe(4);
  });
});
