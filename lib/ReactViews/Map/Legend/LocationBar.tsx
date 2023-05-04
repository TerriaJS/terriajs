import classNames from "classnames";
import { observer } from "mobx-react";
import React, { RefObject, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Terria from "../../../Models/Terria";
import MouseCoords from "../../../ReactViewModels/MouseCoords";
import Styles from "./legend.scss";

interface PropsType {
  terria: Terria;
  showUtmZone: boolean;
  mouseCoords: MouseCoords;
}

const LocationBar: React.FC<PropsType> = observer(({ mouseCoords }) => {
  const { t } = useTranslation();
  const elevationRef = useRef<HTMLElement>(null);
  const longitudeRef = useRef<HTMLElement>(null);
  const latitudeRef = useRef<HTMLElement>(null);
  const utmZoneRef = useRef<HTMLElement>(null);
  const eastRef = useRef<HTMLElement>(null);
  const northRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const disposer = mouseCoords.updateEvent.addEventListener(() => {
      setInnerText(elevationRef, mouseCoords.elevation ?? "");
      setInnerText(longitudeRef, mouseCoords.longitude ?? "");
      setInnerText(latitudeRef, mouseCoords.latitude ?? "");
      setInnerText(utmZoneRef, mouseCoords.utmZone ?? "");
      setInnerText(eastRef, mouseCoords.east ?? "");
      setInnerText(northRef, mouseCoords.north ?? "");
    });
    return disposer;
  });

  return (
    <LocationButton
      type="button"
      className={classNames(Styles.locationBar, {
        [(Styles as any).useProjection]: mouseCoords.useProjection
      })}
      onClick={() => mouseCoords.toggleUseProjection()}
    >
      {!mouseCoords.useProjection && (
        <>
          <div className={Styles.section}>
            <span>{t("legend.lat")}</span>
            <span ref={latitudeRef}>{mouseCoords.latitude}</span>
          </div>
          <div className={Styles.section}>
            <span>{t("legend.lon")}</span>
            <span ref={longitudeRef}>{mouseCoords.longitude}</span>
          </div>
        </>
      )}
      {mouseCoords.useProjection && (
        <>
          <div className={Styles.sectionShort}>
            <span>{t("legend.zone")}</span>
            <span ref={utmZoneRef}>{mouseCoords.utmZone}</span>
          </div>
          <div className={Styles.section}>
            <span>{t("legend.e")}</span>
            <span ref={eastRef}>{mouseCoords.east}</span>
          </div>
          <div className={Styles.section}>
            <span>{t("legend.n")}</span>
            <span ref={northRef}>{mouseCoords.north}</span>
          </div>
        </>
      )}
      <div className={Styles.sectionLong}>
        <span>{t("legend.elev")}</span>
        <span ref={elevationRef}>{mouseCoords.elevation}</span>
      </div>
    </LocationButton>
  );
});

function setInnerText(ref: RefObject<HTMLElement>, value: string) {
  if (ref.current) ref.current.innerText = value;
}

const LocationButton = styled.button`
  &:hover {
    background: ${(p) => p.theme.colorPrimary};
  }
`;

export default LocationBar;
