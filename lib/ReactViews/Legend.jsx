'use strict';
var React = require('react');
var ModalTriggerButton = require('./ModalTriggerButton.jsx');
var imageUrlRegex = /[.\/](png|jpg|jpeg|gif)/i;
var defined = require('terriajs-cesium/Source/Core/defined');
var renderAndSubscribe = require('./renderAndSubscribe');

// Maybe should be called nowViewingItem?
var Legend = React.createClass({
    propTypes:{
      nowViewingItem: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            isOpen: true,
            isVisible: true
        };
    },

    removeFromMap: function() {
        this.props.nowViewingItem.isEnabled = false;
        window.nowViewingUpdate.raiseEvent();
    },

    toggleDisplay: function() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    toggleVisibility: function() {
        this.props.nowViewingItem.isShown = !this.props.nowViewingItem.isShown;
        this.setState({
          isVisible: !this.state.isVisible
        });
    },

    zoom: function() {
        this.props.nowViewingItem.zoomToAndUseClock();
    },

    changeOpacity: function(event) {
        this.props.nowViewingItem.opacity = event.target.value;
        window.nowViewingUpdate.raiseEvent();
    },

    render: function() {
        return renderAndSubscribe(this, function() {
            var nowViewingItem = this.props.nowViewingItem;

            var legend = 'No legend to show';
            var legendUrl;

            if (nowViewingItem.legendUrl && nowViewingItem.legendUrl.length !== 0) {
                legendUrl = nowViewingItem.legendUrl.match(imageUrlRegex);
                if (legendUrl){
                  legend = (<a href={legendUrl.input}><img src={legendUrl.input}/></a>);
                }
            }
            return (
                <li className={'now-viewing__item clearfix ' + (this.state.isOpen === true ? 'is-open' : '')}>
                  <button onClick={this.toggleDisplay} className="btn block now-viewing__item-title">{nowViewingItem.name}</button>
                  <div className ="now-viewing__item-inner">
                    <ul className="list-reset flex clearfix now-viewing__item-control">
                      <li><button onClick={this.zoom} title="Zoom in data" className="btn zoom">Zoom To</button></li>
                      <li><ModalTriggerButton btnText="info" classNames='info' /></li>
                      <li><button onClick={this.removeFromMap} title="Remove this data" className="btn remove">Remove</button></li>
                      <li className='flex-grow right-align'><button onClick={this.toggleVisibility} title="Data show/hide" className="btn visibility"><i className={'icon ' + (this.state.isVisible ? 'icon-visible' : 'icon-invisible')}></i></button></li>
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
        });
    }
});
module.exports = Legend;
