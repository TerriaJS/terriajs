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
            <li className="clearfix location-item">
                <button onClick={item.clickAction} className="btn col col-12 btn-location-name"><span
                    className="col col-1 relative left-align"><i className='icon icon-location'> </i></span><span
                    className='col col-11 relative'>{item.name}</span></button>
            </li>
        );
    }
});

module.exports = LocationItem;
