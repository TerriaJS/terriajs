'use strict';
const React = require('react');
const ModalTriggerButton = require('./ModalTriggerButton.jsx');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

const NowViewingItem = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object,
        index: React.PropTypes.number,
        toggleModalWindow: React.PropTypes.func,
        setPreview: React.PropTypes.func
    },

    removeFromMap() {
        this.props.nowViewingItem.isEnabled = false;
    },

    toggleDisplay() {
        this.props.nowViewingItem.isLegendVisible = !this.props.nowViewingItem.isLegendVisible;
    },

    toggleVisibility() {
        this.props.nowViewingItem.isShown = !this.props.nowViewingItem.isShown;
    },

    zoom() {
        this.props.nowViewingItem.zoomToAndUseClock();
    },

    changeOpacity(event) {
        this.props.nowViewingItem.opacity = event.target.value;
    },

    onDragStart(e) {
        this.props.onDragStart(e);
    },

    onDragOver(e) {
        this.props.onDragOver(e);
    },

    onDragEnd(e) {
        this.props.onDragEnd(e);
    },

    renderLegend(_nowViewingItem) {
        if (_nowViewingItem.legendUrl) {
            if (_nowViewingItem.legendUrl.isImage()) {
                return <a href={_nowViewingItem.legendUrl.url} target="_blank"><img src={_nowViewingItem.legendUrl.url}/></a>;
            }
            return <a href={_nowViewingItem.legendUrl.input} target="_blank">Open legend in a separate tab</a>;
        }
        return 'No legend to show';
    },

    NowViewingAsPreviewed() {
        this.props.setPreview(this.props.nowViewingItem);
    },

    render() {
        const nowViewingItem = this.props.nowViewingItem;

        return (
          <li className={'now-viewing__item clearfix ' + (nowViewingItem.isLegendVisible === true ? 'is-open' : '') + ' ' + (this.props.dragging === true ? 'is-dragging' : '')} onDragOver ={this.onDragOver} data-key={this.props.index} >
            <div className ="now-viewing__item-header clearfix">
              <button draggable='true' data-key={this.props.index} onDragStart={this.onDragStart} onDragEnd={this.onDragEnd} className="btn btn-drag block col col-11">{nowViewingItem.name}</button>
              <button onClick={this.toggleDisplay} className="btn block col col-1"><i className={nowViewingItem.isLegendVisible ? 'icon-chevron-down icon' : 'icon-chevron-right icon'}></i></button>
            </div>
            <div className ="now-viewing__item-inner">
              <ul className="list-reset flex clearfix now-viewing__item-control">
                <li><button onClick={this.zoom} data-key={this.props.index} title="Zoom in data" className="btn zoom">Zoom To</button></li>
                <li><ModalTriggerButton btnHtml="info" classNames='info' toggleModalWindow={this.props.toggleModalWindow} activeTab={1} callback={this.NowViewingAsPreviewed} /></li>
                <li><button onClick={this.removeFromMap} title="Remove this data" className="btn remove">Remove</button></li>
                <li className='flex-grow right-align'><button onClick={this.toggleVisibility} title="Data show/hide" className="btn visibility"><i className={'icon ' + (nowViewingItem.isShown ? 'icon-visible' : 'icon-invisible')}></i></button></li>
              </ul>
              <div className="now-viewing__item-opacity">
                <label htmlFor="opacity">Opacity: </label>
                <input type='range' name='opacity' min='0' max='1' step='0.01' value={nowViewingItem.opacity} onChange={this.changeOpacity}/>
              </div>
              <div className="now-viewing__item-legend">
                {this.renderLegend(nowViewingItem)}
              </div>
            </div>
            </li>
      );
    }
});
module.exports = NowViewingItem;
