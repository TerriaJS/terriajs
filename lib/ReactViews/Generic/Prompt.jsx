import React from 'react';
import PropTypes from 'prop-types';
import Styles from './prompt.scss';

export default class Prompt extends React.Component {
  dismissPrompt() {
    this.props.dismissAction();
  }
  render() {
    return (<div className={Styles.prompt}>
           <div>{this.props.content}</div>
           <button className={Styles.btn} title={this.props.dismissText} onClick={this.dismissPrompt.bind(this)}>{this.props.dismissText}</button>
           </div>);
  }
}

Prompt.propTypes = {
  content: PropTypes.string,
  dismissText: PropTypes.string,
  dismissAction: PropTypes.func
}


