import { scaleLinear, scaleTime } from "@vx/scale";
import maxBy from "lodash-es/maxBy";
import minBy from "lodash-es/minBy";
import React from "react";
import TestRenderer from "react-test-renderer";
import MomentPointsChart from "../../../../lib/ReactViews/Custom/Chart/MomentPointsChart";
import { Circle } from "@vx/shape";

describe("MomentPointsChart", function() {
  const chartItem = {
    categoryName: "Points chart",
    name: "chartitem",
    points: [
      { x: new Date("2020-05-25"), y: 0.5 },
      { x: new Date("2020-05-26"), y: 0.5 },
      { x: new Date("2020-05-27"), y: 0.5 },
      { x: new Date("2020-05-28"), y: 0.5 },
      { x: new Date("2020-05-29"), y: 0.5 },
      { x: new Date("2020-05-30"), y: 0.5 }
    ],
    getColor: () => "red",
    onClick: () => {}
  };

  const scales = getScales(chartItem.points);
  const props = {
    id: "testid",
    chartItem,
    scales: { x: scales.x, y: scales.y.domain([0, 1]) }
  };

  it("renders all points", function() {
    const renderer = TestRenderer.create(<MomentPointsChart {...props} />);
    const points = renderer.root.findAllByType(Circle);
    expect(points.length).toBe(6);
  });

  it("renders the points at the correct positions", function() {
    const renderer = TestRenderer.create(<MomentPointsChart {...props} />);
    const points = renderer.root.findAllByType(Circle);
    const xs = [0, 2, 4, 6, 8, 10];
    points.forEach((point, i) => {
      expect(point.props.cx).toEqual(xs[i]);
      expect(point.props.cy).toEqual(5);
    });
  });

  describe("when a basis item is provided", function() {
    it("renders the points on the basis item", function() {
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
      const renderer = TestRenderer.create(
        <MomentPointsChart {...propsWithBasisItem} />
      );
      const points = renderer.root.findAllByType(Circle);
      const xs = [0, 2, 4, 6, 8, 10];
      const ys = [0, 10, 2, 5, 8, 6];
      points.forEach((point, i) => {
        expect(point.props.cx).toEqual(xs[i]);
        expect(Math.ceil(point.props.cy)).toEqual(ys[i]);
      });
    });
  });
});

function getScales(points: { x: Date; y: number }[]) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xDomain = [minBy(xs, d => d.getTime())!, maxBy(xs, d => d.getTime())!];
  const yDomain = [Math.min(...ys), Math.max(...ys)];
  return {
    x: scaleTime({ domain: xDomain, range: [0, 10] }),
    y: scaleLinear({ domain: yDomain, range: [0, 10] })
  };
}
