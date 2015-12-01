'use strict';

var ModalTriggerButton = require('./ModalTriggerButton.jsx');
var imageUrlRegex = /[.\/](png|jpg|jpeg|gif)/i;
var defined = require('terriajs-cesium/Source/Core/defined');

var Legend = React.createClass({
  getInitialState: function() {
    return {
      isOpen: true
    };
  },

  removeFromMap: function(){
    this.props.nowViewingItem.isEnabled = false;
    nowViewingUpdate.raiseEvent();
  },

  toggleDisplay: function(){
    this.setState({
      isOpen: !this.state.isOpen
    })
  },

  toggleVisibility: function(){
    this.props.nowViewingItem.isShown = !this.props.nowViewingItem.isShown;
  },

  zoom: function(){
    this.props.nowViewingItem.zoomToAndUseClock();
  },

  changeOpacity: function(event){
    this.props.nowViewingItem.opacity = event.target.value;
    nowViewingUpdate.raiseEvent();
  },

  render: function() {
    var nowViewingItem = this.props.nowViewingItem;

    var legend = "No legend to show";
    var legendUrl;

    if(nowViewingItem.legendUrl && nowViewingItem.legendUrl.length !==0){
      legendUrl = nowViewingItem.legendUrl.match(imageUrlRegex);
      legend = <a href={legendUrl.input}><img src={legendUrl.input}/></a>
    }
    return (
          <li className={"now-viewing__item clearfix " + (this.state.isOpen === true ? "is-open" : "") }>
              <button onClick={this.toggleDisplay} className="btn block now-viewing__item-title">{nowViewingItem.name}</button>
              <div className ="now-viewing__item-inner">
                <ul className="list-reset flex clearfix now-viewing__item-control">
                  <li className='zoom'><button onClick={this.zoom} title="Zoom in data" className="btn">Zoom To</button></li>
                  <li className='info'><ModalTriggerButton btnText="info" activeTab="2"/></li>
                  <li className='remove'><button onClick={this.removeFromMap} title="Remove this data" className="btn">Remove</button></li>
                  <li className='visibility'><button onClick={this.toggleVisibility} title="Data show/hide" className="btn"><i className="icon icon-eye"></i></button></li>
                </ul>
                <div className="now-viewing__item-opacity">
                  <label htmlFor="opacity">Opacity: </label>
                  <input type='range' name='opacity' min='0' max='1' step='0.01' value={nowViewingItem.opacity} onChange={this.changeOpacity}/>
                </div>
                <div className="now-viewing__item-legend">
                  {legend}
                </div>
              </div>
          </li>
        );
  }
});
module.exports = Legend;
