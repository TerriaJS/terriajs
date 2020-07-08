"use strict";

import React from "react";
import Styles from "./short-report.scss";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import CommonStrata from "../../../Models/CommonStrata";

import parseCustomMarkdownToReact from "../../Custom/parseCustomMarkdownToReact";
import Icon from "../../Icon";

@observer
export default class ShortReport extends React.Component<{
  item: CatalogMemberMixin.CatalogMemberMixin;
}> {
  clickShortReport(reportName?: string) {
    const shortReportSections = this.props.item.shortReportSections;
    const clickedReport = shortReportSections.find(
      report => report.name === reportName
    );

    if (isDefined(clickedReport)) {
      runInAction(() => {
        /**
         * Ensure short report order is reflected by all strata up to this point
         * & replicate all onto user stratum so that toggling doesn't re-order
         * reports - a stopgap for the lack of consistent behaviour surrounding
         * removals / re-ordering of objectArrayTraits
         */
        shortReportSections.forEach(report =>
          report.setTrait(CommonStrata.user, "show", report.show)
        );
        clickedReport.setTrait(CommonStrata.user, "show", !clickedReport.show);
      });
    }
    return false;
  }

  render() {
    if (
      (!isDefined(this.props.item.shortReport) ||
        this.props.item.shortReport === "") &&
      (!isDefined(this.props.item.shortReportSections) ||
        this.props.item.shortReportSections.length === 0)
    ) {
      return null;
    }
    return (
      <div className={Styles.shortReport}>
        {isDefined(this.props.item.shortReport)
          ? parseCustomMarkdownToReact(this.props.item.shortReport, {
              catalogItem: this.props.item
            })
          : ""}
        {this.props.item.shortReportSections
          .filter(r => isDefined(r.name))
          .map((r, i) => (
            <div key={r.name}>
              <a
                href="#"
                onClick={this.clickShortReport.bind(this, r.name)}
                className={Styles.shortReportTitle}
              >
                {r.name}
                {r.show ? (
                  <Icon glyph={Icon.GLYPHS.minusThick} />
                ) : (
                  <Icon glyph={Icon.GLYPHS.plusThick} />
                )}
              </a>
              {r.show && isDefined(r.content)
                ? parseCustomMarkdownToReact(r.content, {
                    catalogItem: this.props.item
                  })
                : ""}
            </div>
          ))}
      </div>
    );
  }
}

module.exports = ShortReport;
