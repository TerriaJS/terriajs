import { Feature, FeatureCollection } from "geojson";
import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import { Button, useViewState } from "terriajs-plugin-api";
import isDefined from "terriajs/lib/Core/isDefined";
import { GeojsonField } from "../../Models/Ogc/UiElements";
import { Input } from "../Common";
import { pickPoint, pointFeature } from "./PointFieldRenderer";
import {
  featureCollection,
  pickExistingPolygon,
  pickPolygon,
  polygonFeature
} from "./PolygonFieldRenderer";

const GeojsonFieldRenderer: FC<{ field: GeojsonField }> = observer(
  ({ field }) => {
    const viewState = useViewState();
    const { t } = useTranslation();
    const value = field.getValue();

    const displayValue = value
      ? (featureIds(value) ?? JSON.stringify(value))
      : undefined;

    return (
      <Container>
        <Buttons>
          <Button
            type="button"
            onClick={() =>
              pickPoint({
                viewState,
                message: t("analytics.selectLocation")
              }).then((position) =>
                field.setValue(
                  pointFeature(Cartographic.fromCartesian(position))
                )
              )
            }
          >
            Point
          </Button>
          <Button
            type="button"
            onClick={() =>
              pickPolygon(viewState).then((positions) =>
                field.setValue(polygonFeature(positions))
              )
            }
          >
            Polygon
          </Button>
          <Button
            type="button"
            onClick={() =>
              pickExistingPolygon({
                viewState,
                message:
                  '<div>Select existing polygon<div style="font-size:12px"><p><i>If there are no polygons to select, add a layer that provides polygons.</i></p></div></div>'
              }).then((features) => field.setValue(featureCollection(features)))
            }
          >
            Existing shape
          </Button>
        </Buttons>
        <DisabledInput
          id={field.id}
          required={field.required}
          type="text"
          value={displayValue ?? ""}
          placeholder={t("analytics.nothingSelected")}
        />
      </Container>
    );
  }
);

function featureIds(features: FeatureCollection | Feature): string | undefined {
  const fs: Feature[] =
    features.type === "FeatureCollection" ? features.features : [features];

  const ids = fs.map((f) => f.id).filter(isDefined);
  return ids.length > 0 ? ids.join(",") : undefined;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  & > * {
    flex: 1;
  }
`;

const DisabledInput = styled(Input).attrs({ disabled: true })`
  opacity: 0.7;
`;

export default GeojsonFieldRenderer;
