import React from "react";
import PropTypes from "prop-types";
import Styles from "./prompt.scss";
import classNames from "classnames";

export default class Prompt extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isShown: false
    };
  }
  fadeIn() {
    this.fadeInTimer = setTimeout(() => {
      this.setState({
        isShown: true
      });
    }, this.props.displayDelay);
  }

  componentWillUnmount() {
    clearTimeout(this.fadeInTimer);
  }
  componentDidMount() {
    this.fadeIn();
  }
  dismissPrompt() {
    this.props.dismissAction();
  }
  createMarkup() {
    return {
      __html: this.props.content
    };
  }
  render() {
    return (
      <div
        className={classNames(Styles.prompt, {
          [Styles.isVisible]: this.state.isShown
        })}
      >
        {this.props.content}
        <button
          className={Styles.btn}
          title={this.props.dismissText}
          onClick={this.dismissPrompt.bind(this)}
        >
          {this.props.dismissText}
        </button>
      </div>
    );
  }
}

Prompt.propTypes = {
  content: PropTypes.object,
  html: PropTypes.bool,
  dismissText: PropTypes.string,
  dismissAction: PropTypes.func,
  displayDelay: PropTypes.number
};
