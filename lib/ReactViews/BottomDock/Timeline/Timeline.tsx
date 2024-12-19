import dateFormat from "dateformat";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import withControlledVisibility from "../../HOCs/withControlledVisibility";
import CesiumTimeline from "./CesiumTimeline";
import { formatDateTime } from "./DateFormats";
import DateTimePicker from "./DateTimePicker";
import Styles from "./timeline.scss";
import TimelineControls from "./TimelineControls";

@observer
class Timeline extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    locale: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props: any) {
    super(props);
    this.state = {
      isPickerOpen: false
    };
  }

  componentDidMount() {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    this.props.terria.timelineStack.activate();
  }

  componentWillUnmount() {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    this.props.terria.timelineStack.deactivate();
  }

  changeDateTime(time: any) {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    this.props.terria.timelineClock.currentTime = JulianDate.fromDate(
      new Date(time)
    );
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    this.props.terria.timelineStack.syncToClock(CommonStrata.user);
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  onOpenPicker() {
    this.setState({
      isPickerOpen: true
    });
  }

  onClosePicker() {
    this.setState({
      isPickerOpen: false
    });
  }

  render() {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    const terria = this.props.terria;
    const catalogItem = terria.timelineStack.top;
    if (
      !defined(catalogItem) ||
      !defined(catalogItem.currentTimeAsJulianDate)
    ) {
      return null;
    }
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;

    const jsDate = JulianDate.toDate(catalogItem.currentTimeAsJulianDate);
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    const timelineStack = this.props.terria.timelineStack;
    let currentTime;
    if (defined(timelineStack.top) && defined(timelineStack.top.dateFormat)) {
      currentTime = dateFormat(
        jsDate,
        // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
        this.props.terria.timelineStack.top.dateFormat
      );
    } else {
      // @ts-expect-error TS(2339): Property 'locale' does not exist on type 'Readonly... Remove this comment to see the full error message
      currentTime = formatDateTime(jsDate, this.props.locale);
    }

    const discreteTimes = catalogItem.discreteTimesAsSortedJulianDates;
    const objectifiedDates = catalogItem.objectifiedDates;
    const currentDiscreteJulianDate = catalogItem.currentDiscreteJulianDate;

    return (
      <div className={Styles.timeline}>
        <div
          className={Styles.textRow}
          css={`
            background: ${(p: any) => p.theme.dark};
          `}
        >
          <div
            className={Styles.textCell}
            title={t("dateTime.timeline.textCell")}
          >
            <div className={Styles.layerNameTruncated}>{catalogItem.name}</div>
            {currentTime}
          </div>
        </div>
        <div className={Styles.controlsRow}>
          <TimelineControls
            // @ts-expect-error TS(2322): Type '{ clock: any; analytics: any; currentViewer:... Remove this comment to see the full error message
            clock={terria.timelineClock}
            analytics={terria.analytics}
            currentViewer={terria.currentViewer}
          />
          {defined(discreteTimes) &&
            discreteTimes.length !== 0 &&
            defined(currentDiscreteJulianDate) && (
              <DateTimePicker
                currentDate={JulianDate.toDate(currentDiscreteJulianDate)}
                dates={objectifiedDates}
                // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                onChange={() => this.changeDateTime()}
                openDirection="up"
                // @ts-expect-error TS(2339): Property 'isPickerOpen' does not exist on type 'Re... Remove this comment to see the full error message
                isOpen={this.state.isPickerOpen}
                onOpen={() => this.onOpenPicker()}
                onClose={() => this.onClosePicker()}
                dateFormat={catalogItem.dateFormat}
              />
            )}
          // @ts-expect-error TS(2769): No overload matches this call.
          <CesiumTimeline terria={terria} />
        </div>
      </div>
    );
  }
}

export default withControlledVisibility(withTranslation()(Timeline));
