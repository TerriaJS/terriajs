'use strict';
var React = require('react');
var Loader = React.createClass({
    render: function() {
        return <li className='loader'><i className='icon icon-loader'></i> Loading</li>;
    }
});
module.exports = Loader;
