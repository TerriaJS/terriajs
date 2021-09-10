import PropTypes from "prop-types";
import React from "react";
import { scaleOrdinal } from "@visx/scale";
import { LegendOrdinal } from "@visx/legend";
import Glyphs from "./Glyphs";
import { GlyphCircle } from "@visx/glyph";
import styled from "styled-components";

export default class Legends extends React.PureComponent {
  static propTypes = {
    chartItems: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired
  };

  static maxHeightPx = 33;

  render() {
    const chartItems = this.props.chartItems;
    const colorScale = scaleOrdinal({
      domain: chartItems.map(c => `${c.categoryName} ${c.name}`),
      range: chartItems.map(c => c.getColor())
    });

    return (
      <Container style={{ maxWidth: this.props.width }}>
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
      </Container>
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
      <Label title={label.text}>
        <svg
          width={`${squareSize}px`}
          height={`${squareSize}px`}
          style={{ flexShrink: 0 }}
        >
          <Glyph top={10} left={10} fill={label.value} size={100} />
        </svg>
        <LabelText>{label.text}</LabelText>
      </Label>
    );
  }
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin: auto;
  padding: 7px;
  border: "1px solid red";
  font-size: 0.8em;
`;

const Label = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0px;
  border: "1px solid blue";
`;

const LabelText = styled.span`
  margin-left: 4px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;
