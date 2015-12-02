'use strict';

var LocationItem = React.createClass({
    render: function() {
        var item = this.props.item;
        return (
            <li className="clearfix location-item"><button className="btn data-item-title col col-11 relative">{item.name}</button><button  className="btn col col-1 relative"><i className='icon icon-map-marker blue'> </i></button></li>
        );
    }
});

module.exports = LocationItem;
