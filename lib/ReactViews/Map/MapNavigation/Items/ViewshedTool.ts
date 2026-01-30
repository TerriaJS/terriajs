"use strict";
import React from "react";
import { reaction } from "mobx";
import Terria from "../../../../Models/Terria";
import ViewerMode from "../../../../Models/ViewerMode";
import { GLYPHS } from "../../../../Styled/Icon";
import MapNavigationItemController from "../../../../ViewModels/MapNavigation/MapNavigationItemController";
import UserDrawingViewshed from "../../../../Models/UserDrawingViewshed";
import i18next from "i18next";

interface ViewshedToolOptions {
  terria: Terria;
  onClose(): void;
  onOpen(): void;
}

export class ViewshedTool extends MapNavigationItemController {
  static id = "viewshed-tool";
  static displayName = "ViewshedTool";

  private readonly terria: Terria;
  private userDrawing: UserDrawingViewshed;

  onClose: () => void;
  onOpen: () => void;
  itemRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: ViewshedToolOptions) {
    super();
    this.terria = props.terria;
    this.userDrawing = new UserDrawingViewshed({
      terria: props.terria,
      messageHeader: i18next.t("viewshed.messageHeader"),
      numMaxPoints: 2,
      onMakeDialogMessage: this.onMakeDialogMessage.bind(this),
      onCleanUp: this.onCleanUp.bind(this)
    });
    this.onClose = props.onClose;
    this.onOpen = props.onOpen;

    reaction(
      () => this.terria.mainViewer,
      (viewer) => {
        this.setVisible(viewer.viewerMode === ViewerMode.Cesium);
      }
    );
  }

  get glyph(): any {
    return GLYPHS.eye;
  }

  get viewerMode(): ViewerMode | undefined {
    return undefined;
  }

  onCleanUp() {
    this.terria.viewshedDistances = undefined;
    this.deactivate();
  }

  /**
   * @overrides
   */
  deactivate() {
    this.onClose();
  }

  /**
   * @overrides
   */
  activate() {
    this.onOpen();
    this.userDrawing.enterDrawMode();
  }

  prettifyNumber(number: number) {
    if (number <= 0) {
      return "";
    }
    // Given a number representing a number in metres, make it human readable
    let label = "m";
    if (number > 999) {
      label = "Km";
      number = number / 1000.0;
    }
    let numberStr = number.toFixed(2);
    // http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    numberStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    numberStr = `${numberStr} ${label}`;

    return numberStr;
  }

  onMakeDialogMessage = () => {
    const distOrig =
      this.terria.viewshedDistances && this.terria.viewshedDistances[0];
    const distInter =
      this.terria.viewshedDistances && this.terria.viewshedDistances[1];

    return `
      <br/>
      <table>
        <tbody>
        <tr>
            <td>${
              distOrig && distInter
                ? Math.abs(distOrig - distInter) < 0.01
                  ? i18next.t("viewshed.resultOk")
                  : i18next.t("viewshed.resultKo")
                : ""
            }</td>
          </tr>
          <tr/>
          <tr>
            <td>${i18next.t("viewshed.distance")}</td>
            <td>${distOrig ? this.prettifyNumber(distOrig) : ""}</td>
          </tr>
          <tr/>
          <tr>
            <td>${i18next.t("viewshed.distanceVisible")}</td>
            <td>${distInter ? this.prettifyNumber(distInter) : ""}</td>
          </tr>
        </tbody>
      </table>
    `;
  };
}
