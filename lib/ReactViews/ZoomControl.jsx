'use strict';
var ZoomControl = React.createClass({
    zoomIn: function(){

    },

    zoomOut: function(){

    },

    zoomReset: function(){

    },

    render: function() {
        return (<div className='zoom-control'>
          <ul className='list-reset'>
          <li><button onClick={this.zoomIn} className='btn zoom-increarse' title='zoom in'><i className='icon icon-zoom-in'></i></button></li>
          <li><button onClick={this.zoomReset} className='btn zoom-decrease' title='reset zoom'><i className='icon icon-refresh'></i></button></li>
          <li><button onClick={this.zoomOut} className='btn zoom-decrease' title='zoom out'><i className='icon icon-zoom-out'></i></button></li>
          </ul></div>);
    }
});
module.exports = ZoomControl;
