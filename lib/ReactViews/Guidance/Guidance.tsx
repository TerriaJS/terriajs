/**
 * <Guidance /> is the (currently unused) "in app tour" where we have the dots,
 * whereas <Guide /> is the generic "slider/static tour"
 */
import React, { useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { useTranslation } from "react-i18next";

import Styles from "./guidance.scss";
import Text from "../../Styled/Text";

import GuidanceDot from "./GuidanceDot.jsx";

const GuidanceProgress = (props: any) => {
  const countArray = Array.from(Array(props.max).keys()).map((e) => e++);
  const countStep = props.step;
  return (
    <div className={Styles.indicatorWrapper}>
      {countArray.map((count) => {
        return (
          <div
            key={count}
            className={classNames(Styles.indicator, {
              [Styles.indicatorEnabled]: count < countStep
            })}
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

const GuidanceContextModal = ({
  children
}: any) => {
  const { t } = useTranslation();
  return (
    <div className={Styles.context}>
      // @ts-expect-error TS(2769): No overload matches this call.
      <Text tallerHeight>{children}</Text>
      <button className={Styles.btn}>{t("general.next")}</button>
      {t("general.skip")}
      {/* ? */}
      // @ts-expect-error TS(2741): Property 'children' is missing in type Remove this comment to see the full error message
      <GuidanceProgress step={2} max={4} />
    </div>
  );
};

GuidanceContextModal.propTypes = {
  children: PropTypes.node.isRequired
};

export const Guidance = ({
  children
}: any) => {
  const [showGuidance, setShowGuidance] = useState(false);

  return (
    <div className={Styles.guidance}>
      <GuidanceDot onClick={() => setShowGuidance(!showGuidance)} />
      {showGuidance && <GuidanceContextModal>{children}</GuidanceContextModal>}
    </div>
  );
};

Guidance.propTypes = {
  children: PropTypes.node.isRequired
};

export default Guidance;
