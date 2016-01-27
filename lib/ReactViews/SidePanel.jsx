'use strict';
const React = require('react');
const SearchBox = require('./SearchBox.jsx');
const ModalTriggerButton = require('./ModalTriggerButton.jsx');
const NowViewingContainer = require('./NowViewingContainer.jsx');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');
const Chart = require('./Chart.jsx');

const btnAdd = 'Add Data';
const btnRemove = 'Remove All';

// the sidepanel
// TO DO:  rename this into workbench
// This get re-rendered when nowViewingItem changes
const SidePanel = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes: {
        terria: React.PropTypes.object,
        toggleModalWindow: React.PropTypes.func,
        setPreview: React.PropTypes.func
    },

    removeAll() {
        this.props.terria.nowViewing.removeAll();
    },

    resetPreviewed() {
        // Use the add data button to open modal window,
        // the preview map should be reset
        this.props.setPreview(null);
    },

    renderNowViewing(nowViewing) {
        if (nowViewing && nowViewing.length > 0) {
            return (
              <div>
                  <ul className="now-viewing__header list-reset clearfix">
                      <li className='col col-6'><label className='label-inline'> Data Sets </label><label className='label-badge label-inline'> {nowViewing.length} </label></li>
                      <li className='col col-6'><button onClick={this.removeAll} className='btn right'>{btnRemove}</button></li>
                  </ul>
                  <NowViewingContainer toggleModalWindow={this.props.toggleModalWindow}
                                       nowViewing={nowViewing}
                                       setPreview={this.props.setPreview}
                  />
              </div>);
        }
    },

    renderCharts(nowViewing) {
        if (nowViewing && nowViewing.length > 0) {
            return (
              <div>
                  <ul className="now-viewing__header list-reset clearfix">
                      <li className='col col-6'><label className='label-inline'> Charts </label><label className='label-badge label-inline'> 1 </label></li>
                  </ul>
                  <div className='nowViewing-chart'>
                      <Chart />
                  </div>
              </div>);
        }
        return null;
    },

    render() {
        return (
        <div className='workbench__inner'>
        <div className='workbench__header workbench-add'>
            <ModalTriggerButton btnHtml={btnAdd}
                                toggleModalWindow={this.props.toggleModalWindow}
                                classNames = 'now-viewing__add'
                                activeTab={1}
                                callback={this.resetPreviewed}
            />
        </div>
        <SearchBox terria={this.props.terria} dataSearch={false} toggleModalWindow={this.props.toggleModalWindow} />
        <div className="now-viewing hide-on-search">
          {this.renderNowViewing(this.props.terria.nowViewing.items)}
          {this.renderCharts(this.props.terria.nowViewing.items)}
        </div>
        </div>);
    }
});
module.exports = SidePanel;
