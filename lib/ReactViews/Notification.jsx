'use strict';
const React = require('react');
const Notification = React.createClass({
  render() {
    return <li className='loader'><i className='icon icon-loader'></i> Loading</li>;
  }
});
module.exports = Notification;
