'use strict';
var ZoomControl = React.createClass({
    render: function() {
        return (<div className='zoom-control'><ul className='list-reset'><li><button className='btn zoom-increarse' title='zoom in'><i className='icon icon-add'></i></button></li><li><button className='btn zoom-decrease' title='zoom out'><i className='icon icon-minus'></i></button></li></ul></div>);
    }
});
module.exports = ZoomControl;
