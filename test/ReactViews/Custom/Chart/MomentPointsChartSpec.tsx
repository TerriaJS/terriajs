import { render } from "@testing-library/react";
import { scaleLinear, scaleTime } from "@visx/scale";
import maxBy from "lodash-es/maxBy";
import minBy from "lodash-es/minBy";
import MomentPointsChart from "../../../../lib/ReactViews/Custom/Chart/MomentPointsChart";

function parseGlyphPositions(container: HTMLElement) {
  const glyphs = container.querySelectorAll("g.visx-glyph");
  return Array.from(glyphs).map((g) => {
    const transform = g.getAttribute("transform") || "";
    const match = transform.match(/translate\(\s*([^,\s]+)\s*,\s*([^)]+)\s*\)/);
    return {
      left: parseFloat(match?.[1] ?? "0"),
      top: parseFloat(match?.[2] ?? "0")
    };
  });
}

describe("MomentPointsChart", function () {
  const chartItem = {
    id: "chartitem",
    item: {} as never,
    categoryName: "Points chart",
    key: "key-chartitem",
    name: "chartitem",
    type: "momentPoints" as const,
    xAxis: { name: "xAxis", scale: "time" as const },
    points: [
      { x: new Date("2020-05-25"), y: 0.5 },
      { x: new Date("2020-05-26"), y: 0.5 },
      { x: new Date("2020-05-27"), y: 0.5 },
      { x: new Date("2020-05-28"), y: 0.5 },
      { x: new Date("2020-05-29"), y: 0.5 },
      { x: new Date("2020-05-30"), y: 0.5 }
    ],
    domain: {
      x: [new Date("2020-05-25").valueOf(), new Date("2020-05-30").valueOf()],
      y: [0.5, 0.5]
    },
    getColor: () => "red",
    onClick: () => {},
    showInChartPanel: true,
    isSelectedInWorkbench: true,
    updateIsSelectedInWorkbench: () => {}
  };

  const scales = getScales(chartItem.points);
  const props = {
    id: "testid",
    chartItem,
    scales: { x: scales.x, y: scales.y.domain([0, 1]) }
  };

  it("renders all points", function () {
    const { container } = render(
      <svg>
        <MomentPointsChart {...props} />
      </svg>
    );
    const glyphs = container.querySelectorAll("g.visx-glyph");
    expect(glyphs.length).toBe(6);
  });

  it("renders the points at the correct positions", function () {
    const { container } = render(
      <svg>
        <MomentPointsChart {...props} />
      </svg>
    );
    const positions = parseGlyphPositions(container);
    const xs = [0, 2, 4, 6, 8, 10];
    positions.forEach((pos, i) => {
      expect(pos.left).toEqual(xs[i]);
      expect(pos.top).toEqual(5);
    });
  });

  it("renders the correct type of glyph", function () {
    const { container } = render(
      <svg>
        <MomentPointsChart {...props} glyph="square" />
      </svg>
    );
    const glyphs = container.querySelectorAll("g.visx-glyph");
    expect(glyphs.length).toBe(6);
  });

  describe("when a basis item is provided", function () {
    it("renders the points on the basis item", function () {
      const basisItem = {
        ...chartItem,
        name: "basisitem",
        points: chartItem.points.map(({ x }, i) => ({
          x,
          y: [0, 10, 2, 5, 8, 6][i]
        }))
      };
      const basisItemScales = getScales(basisItem.points);
      const propsWithBasisItem = {
        ...props,
        basisItem,
        basisItemScales
      };
      const { container } = render(
        <svg>
          <MomentPointsChart {...propsWithBasisItem} />
        </svg>
      );
      const positions = parseGlyphPositions(container);
      const xs = [0, 2, 4, 6, 8, 10];
      const ys = [0, 10, 2, 5, 8, 6];
      positions.forEach((pos, i) => {
        expect(pos.left).toEqual(xs[i]);
        expect(pos.top).toEqual(ys[i]);
      });
    });
  });
});

function getScales(points: { x: Date; y: number }[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xDomain = [
    minBy(xs, (d) => d.getTime())!,
    maxBy(xs, (d) => d.getTime())!
  ];
  const yDomain = [Math.min(...ys), Math.max(...ys)];
  return {
    x: scaleTime({ domain: xDomain, range: [0, 10] }),
    y: scaleLinear({ domain: yDomain, range: [0, 10] })
  };
}
