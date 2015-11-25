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

    console.log(legendUrl);
    return (
          <li className="now-viewing__item">
            <ul className="clearfix list-reset">
              <li className="col col-12"><button onClick={this.toggleDisplay} className="btn block">{nowViewingItem.name}</button></li>
              <ul className="list-reset col col-12">
                <li className="col col-1"><button onClick={this.toggleVisibility} title="Data show/hide" className="btn"><i className="fa fa-eye"></i></button></li>
                <li className="col col-1"><button onClick={this.zoom} title="Zoom in data" className="btn"><i className="fa fa-camera"></i></button></li>
                <li className="col col-1"><ModalTriggerButton btnText="info" activeTab="2"/></li>
                <li className="col col-9 right-align"><button onClick={this.removeFromMap} title="Remove this data" className="btn">Remove</button></li>
              </ul>
              <li className="col col-12">
                <label htmlFor="opacity">Opacity: </label>
                <input type='range' name='opacity' min='0' max='1' step='0.01' value={nowViewingItem.opacity} onChange={this.changeOpacity}/>
              </li>
              <li className="col col-12" aria-hidden={this.state.isOpen === true ? "false" : "true" }>
                {legend}
              </li>
            </ul>
          </li>
        );
  }
});
module.exports = Legend;
