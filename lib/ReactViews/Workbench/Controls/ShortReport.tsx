"use strict";

import React from "react";
import Styles from "./short-report.scss";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import CommonStrata from "../../../Models/CommonStrata";

const parseCustomMarkdownToReact = require("../../Custom/parseCustomMarkdownToReact");

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
        {this.props.item.shortReportSections.map((r, i) => (
          <div key={i}>
            <a
              href="#"
              onClick={this.clickShortReport.bind(this, r.name)}
              style={{
                color: "inherit",
                fontWeight: "bold",
                paddingTop: "5px",
                display: "block"
              }}
            >
              {r.name}
            </a>
            {r.show
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
