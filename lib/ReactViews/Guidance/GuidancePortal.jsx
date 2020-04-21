/**
 * Framework for tour
 *
 */
import React, { useState } from "react";
// import styled from "styled-components";
import styled, { withTheme } from "styled-components";
// import styled, { css } from "styled-components";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import Text from "../../Styled/Text";

import GuidanceDot from "./GuidanceDot.jsx";

const GuidanceProgress = props => {
  const countArray = Array.from(Array(props.max).keys()).map(e => e++);
  const countStep = props.step;
  return (
    <div
      css={`
        float: right;
        margin-right: -8px;
      `}
    >
      {countArray.map(count => {
        return (
          <div
            key={count}
            css={`
              display: inline-block;
              box-sizing: border-box;
              // height: 1px;
              height: 2px;
              width: 8px;
              // border: 2px solid #519ac2;
              background-color: ${p => p.theme.colorPrimary};
              opacity: ${count < countStep ? 0.35 : 1};
              // margin-left: 8px;

              margin-left: 6px;
              border-radius: 4px;
            `}
            // className={classNames(Styles.indicator, {
            //   [Styles.indicatorEnabled]: count < countStep
            // })}
          />
        );
      })}
    </div>
  );
};
GuidanceProgress.propTypes = {
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired
};

const GuidanceContextBox = styled(Box)`
  box-sizing: border-box;
  width: 256px;
  background-color: $modal-bg;
  padding: 16px;
  color: $text-darker;

  min-height: 136px;
  border-radius: 4px;

  box-shadow: 0 6px 6px 0 rgba(0, 0, 0, 0.12), 0 10px 20px 0 rgba(0, 0, 0, 0.05);
`;

const GuidanceContextModal = ({ children }) => {
  const { t } = useTranslation();
  return (
    <GuidanceContextBox>
      <Text tallerHeight>{children}</Text>
      <Button primary>{t("general.next")}</Button>
      {t("general.skip")}
      {/* ? */}
      <GuidanceProgress step={2} max={4} />
    </GuidanceContextBox>
  );
};

GuidanceContextModal.propTypes = {
  children: PropTypes.node.isRequired
};
const GuidancePortalOverlay = styled(Box)`
  position: fixed;
  width: 100%;
  height: 100%;
  background: lightblue;
  z-index: 1000;
  opacity: 0.5;
`;

export const GuidancePortal = ({ children }) => {
  const [showGuidance, setShowGuidance] = useState(false);

  return (
    <GuidancePortalOverlay>
      <GuidanceDot onClick={() => setShowGuidance(!showGuidance)} />
      {showGuidance && <GuidanceContextModal>{children}</GuidanceContextModal>}
    </GuidancePortalOverlay>
  );
};

GuidancePortal.propTypes = {
  children: PropTypes.node.isRequired
};

export default withTheme(GuidancePortal);
