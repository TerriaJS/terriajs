import clipboard from "clipboard";
import React from "react";
import Styles from "./clipboard.scss";
import classNames from "classnames";
import PropTypes from "prop-types";

export default class Clipboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltip: null
    };
    this.resetTooltipLater = this.resetTooltipLater.bind(this);
  }

  componentDidMount() {
    this.clipboardBtn = new clipboard(`.btn-copy-${this.props.id}`);
    this.clipboardBtn.on("success", _ => {
      this.setState({
        tooltip: "copied!"
      });
      this.resetTooltipLater();
    });
    this.clipboardBtn.on("error", _ => {
      this.setState({
        tooltip: "copy unsuccessful!"
      });
      this.resetTooltipLater();
    });
  }

  componentWillUnmount() {
    this.removeTimeout();
    this.clipboardBtn.destroy();
  }

  removeTimeout() {
    if (this._timerID !== undefined) {
      window.clearTimeout(this._timerID);
      this._timerID = undefined;
    }
  }

  resetTooltipLater() {
    this.removeTimeout();
    this._timerID = window.setTimeout(() => {
      this.setState({
        tooltip: null
      });
    }, 3000);
  }

  render() {
    return (
      <div className={Styles.clipboard}>
        <div>Share URL</div>
        <div className={Styles.explanation}>
          Anyone visiting this URL will see this map view.
        </div>
        <div className={Styles.clipboardBody}>
          {this.props.source}
          <button
            className={classNames(`btn-copy-${this.props.id}`, Styles.copyBtn)}
            data-clipboard-target={`#${this.props.id}`}
          >
            Copy
          </button>
        </div>
        {this.state.tooltip && (
          <span className={Styles.tooltip}>{this.state.tooltip}</span>
        )}
      </div>
    );
  }
}

Clipboard.propTypes = {
  id: PropTypes.string.isRequired,
  source: PropTypes.object.isRequired
};
