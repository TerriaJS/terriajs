"use strict";

import React from "react";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import CommonStrata from "../../../Models/CommonStrata";

import parseCustomMarkdownToReact from "../../Custom/parseCustomMarkdownToReact";

import { GLYPHS, StyledIcon } from "../../Icon";

// :(
const RawButton: any = require("../../../Styled/Button").RawButton;
const Text: any = require("../../../Styled/Text").default;
const Box: any = require("../../../Styled/Box").default;
const Spacing: any = require("../../../Styled/Spacing").default;

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
    const shortReportSections = this.props.item?.shortReportSections?.filter(
      r => isDefined(r.name)
    );

    if (
      (!isDefined(this.props.item.shortReport) ||
        this.props.item.shortReport === "") &&
      (!isDefined(shortReportSections) || shortReportSections.length === 0)
    ) {
      return null;
    }

    return (
      <Box fullWidth displayInlineBlock padded>
        {isDefined(this.props.item.shortReport) && (
          <Text textLight medium>
            {parseCustomMarkdownToReact(this.props.item.shortReport, {
              catalogItem: this.props.item
            })}
          </Text>
        )}
        {shortReportSections.map((r, i) => (
          <React.Fragment key={r.name}>
            <RawButton
              fullWidth
              onClick={this.clickShortReport.bind(this, r.name)}
              css={`
                text-align: left;
              `}
              aria-expanded={r.show}
              aria-controls={`${this.props.item.uniqueId}-${r.name}`}
            >
              <Text as="span" textLight bold medium>
                {r.name}
              </Text>

              <StyledIcon
                styledWidth={"8px"}
                light
                glyph={r.show ? GLYPHS.minusThick : GLYPHS.plusThick}
                css={`
                  padding-left: 10px;
                  display: inline;
                `}
              />
            </RawButton>

            {r.show && isDefined(r.content) ? (
              <Text
                textLight
                small
                id={`${this.props.item.uniqueId}-${r.name}`}
              >
                {parseCustomMarkdownToReact(r.content, {
                  catalogItem: this.props.item
                })}
              </Text>
            ) : (
              ""
            )}

            {i < shortReportSections.length - 1 && <Spacing bottom={2} />}
          </React.Fragment>
        ))}
      </Box>
    );
  }
}

module.exports = ShortReport;
