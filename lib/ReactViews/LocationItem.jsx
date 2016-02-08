'use strict';
const React = require('react');

// A Location item when doing Bing map searvh or Gazetter search
const LocationItem = React.createClass({
    propTypes: {
        item: React.PropTypes.object
    },

    render() {
        const item = this.props.item;
        return (
            <li className="location-item"><button onClick={item.clickAction} className="btn btn--location-name">{item.name}</button></li>
            );
    }
});

module.exports = LocationItem;
