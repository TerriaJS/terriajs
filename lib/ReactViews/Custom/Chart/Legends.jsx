import PropTypes from "prop-types";
import React from "react";
import { LegendOrdinal, LegendItem, LegendLabel } from "@visx/legend";
import { scaleOrdinal } from "@visx/scale";
import Styles from "./legends.scss";
import Glyphs from "./Glyphs";

export default class Legends extends React.PureComponent {
  static propTypes = {
    chartItems: PropTypes.array.isRequired
  };

  static maxHeightPx = 33;

  render() {
    const chartItems = this.props.chartItems;
    const colorScale = scaleOrdinal({
      domain: chartItems.map(c => `${c.categoryName} ${c.name}`),
      range: chartItems.map(c => c.getColor())
    });

    return (
      <div
        className={Styles.legends}
        style={{ maxHeight: `${Legends.maxHeightPx}px` }}
      >
        <LegendOrdinal scale={colorScale}>
          {labels =>
            labels.map((label, i) => (
              <Legend
                key={`legend-${label.text}`}
                label={label}
                glyph={chartItems[i]?.glyphStyle ?? "circle"}
              />
            ))
          }
        </LegendOrdinal>
      </div>
    );
  }
}

class Legend extends React.PureComponent {
  static propTypes = {
    label: PropTypes.object.isRequired,
    glyph: PropTypes.string
  };

  render() {
    const label = this.props.label;
    const squareSize = 20;
    const Glyph = Glyphs[this.props.glyph] ?? GlyphCircle;
    return (
      <LegendItem margin="0 5px">
        <svg width={`${squareSize}px`} height={`${squareSize}px`}>
          <Glyph top={10} left={10} fill={label.value} size={100} />
        </svg>
        <LegendLabel className={Styles.label} align="left" margin="0 0 0 4px">
          {label.text}
        </LegendLabel>
      </LegendItem>
    );
  }
}
