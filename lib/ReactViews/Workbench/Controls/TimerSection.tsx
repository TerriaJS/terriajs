import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import defined from "terriajs-cesium/Source/Core/defined";
import Timer from "../../Generic/Timer/Timer";
import { withTranslation } from "react-i18next";
import Styles from "./timer-section.scss";

@observer
class TimerSection extends React.Component {
  static propTypes = {
    item: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  interval: any;
  nextUpdate: any;

  constructor(props: any) {
    super(props);
    this.state = {
      secondsLeft: 0
    };
  }

  isEnabled() {
    return (
      // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      defined(this.props.item) &&
      // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      this.props.item.isPolling &&
      // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      defined(this.props.item.nextScheduledUpdateTime) &&
      // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      this.props.item.refreshInterval < 30 * 60 * 1000 // only show refresh timer for refresh intervals less than 30 minutes
    );
  }

  getCountdownDuration() {
    // How many seconds until our next update?
    return Math.round(
      // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      (this.props.item.nextScheduledUpdateTime.getTime() -
        new Date().getTime()) /
        1000
    );
  }

  getTimerStartTime() {
    return new Date(
      // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      this.props.item.nextScheduledUpdateTime -
        // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
        this.props.item.refreshInterval * 1000
    );
  }

  // Ticks down the countdown clock
  countdown() {
    // @ts-expect-error TS(2339): Property 'secondsLeft' does not exist on type 'Rea... Remove this comment to see the full error message
    if (this.state.secondsLeft > 0) {
      this.setState((state) => {
        return {
          // @ts-expect-error TS(2339): Property 'secondsLeft' does not exist on type 'Rea... Remove this comment to see the full error message
          secondsLeft: state.secondsLeft - 1
        };
      });
    } else {
      // Stop.
      clearInterval(this.interval);
    }
  }

  startCountdown() {
    this.setState({
      secondsLeft: this.getCountdownDuration()
    });
    this.interval = setInterval(() => this.countdown(), 1000);
  }

  getCountdownString() {
    // @ts-expect-error TS(2769): No overload matches this call.
    const date = new Date(null);
    // @ts-expect-error TS(2339): Property 'secondsLeft' does not exist on type 'Rea... Remove this comment to see the full error message
    date.setSeconds(this.state.secondsLeft);

    const addLeadingZeroIfRequired = (numString: any) =>
      numString.length < 2 ? "0" + numString : numString;

    const minutes = addLeadingZeroIfRequired(date.getMinutes().toString());
    const seconds = addLeadingZeroIfRequired(date.getSeconds().toString());

    return `00:${minutes}:${seconds}`;
  }

  componentDidUpdate() {
    if (!this.isEnabled()) {
      return;
    }

    // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
    if (this.nextUpdate !== this.props.item.nextScheduledUpdateTime) {
      if (defined(this.interval)) {
        clearInterval(this.interval);
      }
      this.startCountdown();
      // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      this.nextUpdate = this.props.item.nextScheduledUpdateTime;
    }
  }

  componentDidMount() {
    if (!this.isEnabled()) {
      return;
    }

    this.startCountdown();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    return this.isEnabled() ? (
      <div className={Styles.section}>
        <div className={Styles.timerContainer}>
          <Timer
            // @ts-expect-error TS(2322): Type '{ tooltipText: any; radius: number; start: n... Remove this comment to see the full error message
            tooltipText={t("timer.nextScheduledUpdateTime", {
              // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
              scheduledUpdateTime: this.props.item.nextScheduledUpdateTime
            })}
            radius={10}
            start={this.getTimerStartTime().getTime()}
            // @ts-expect-error TS(2339): Property 'item' does not exist on type 'Readonly<{... Remove this comment to see the full error message
            stop={this.props.item.nextScheduledUpdateTime.getTime()}
          />
        </div>
        <span>
          {t("timer.nextScheduledUpdateCountdown", {
            timeCountdown: this.getCountdownString()
          })}
        </span>
      </div>
    ) : null;
  }
}

export default withTranslation()(TimerSection);
