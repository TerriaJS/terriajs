import { Complete } from "../../lib/Core/TypeModifiers";
import createDiscreteTimesFromIsoSegments from "../../lib/Core/createDiscreteTimes";

describe("createDiscreteTimesFromIsoSegments", () => {
  it("should not duplicate stop date", () => {
    const result: {
      times: string[];
      tags: string[];
    } = {
      times: [],
      tags: []
    };
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
    expect(result.times.length).toBe(3);
    expect(result.times[0]).toBe("2018-02-07T00:00:00Z");
    expect(result.times[1]).toBe("2018-02-22T00:00:00Z");
    expect(result.times[2]).toBe("2018-03-09T00:00:00Z");
  });

  it("should include a stop date", () => {
    const result: {
      times: string[];
      tags: string[];
    } = {
      times: [],
      tags: []
    };
    const value = "2018-02-07T00:00:00.000Z/2018-03-10T00:00:00.000Z/P15D";
    const isoSegments = value.split("/");
    const maxRefreshIntervals = 10;
    createDiscreteTimesFromIsoSegments(
      result,
      isoSegments[0],
      isoSegments[1],
      isoSegments[2],
      maxRefreshIntervals
    );
    expect(result.times.length).toBe(4);
    expect(result.times[0]).toBe("2018-02-07T00:00:00Z");
    expect(result.times[1]).toBe("2018-02-22T00:00:00Z");
    expect(result.times[2]).toBe("2018-03-09T00:00:00Z");
    expect(result.times[3]).toBe("2018-03-10T00:00:00Z");
  });

  it("should limit time number to maxRefreshInterval", () => {
    const result: {
      times: string[];
      tags: string[];
    } = {
      times: [],
      tags: []
    };
    const value = "2018-02-07T00:00:00.000Z/2018-03-09T00:00:00.000Z/P15D";
    const isoSegments = value.split("/");
    const maxRefreshIntervals = 2;
    createDiscreteTimesFromIsoSegments(
      result,
      isoSegments[0],
      isoSegments[1],
      isoSegments[2],
      maxRefreshIntervals
    );
    expect(result.times.length).toBe(maxRefreshIntervals);
    expect(result.times[0]).toBe("2018-02-07T00:00:00Z");
    expect(result.times[1]).toBe("2018-02-22T00:00:00Z");
  });
});
