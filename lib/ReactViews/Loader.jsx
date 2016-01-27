'use strict';
const React = require('react');
const Loader = React.createClass({
    render() {
        return <li className='loader '><i className='icon icon-loader'></i> Loading</li>;
    }
});
module.exports = Loader;
