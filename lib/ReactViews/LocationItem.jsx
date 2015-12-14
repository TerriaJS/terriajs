'use strict';
var React = require('react');
var LocationItem = React.createClass({
    propTypes: {
      item: React.PropTypes.object
    },

    render: function() {
        var item = this.props.item;
        return (
            <li className="clearfix location-item"><button onClick={item.clickAction} className="btn col col-12 btn-location-name"><span className='col col-11 relative'>{item.name}</span><span className="col col-1 relative right-align"><i className='icon icon-location_on'> </i></span></button></li>
        );
    }
});

module.exports = LocationItem;
