'use strict';
const React = require('react');
const SearchBox = require('./SearchBox.jsx');
const ModalTriggerButton = require('./ModalTriggerButton.jsx');
const NowViewingContainer = require('./NowViewingContainer.jsx');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

const btnAdd = 'Add Data';
const btnRemove = 'Remove All';

// the sidepanel
// TO DO:  rename this into workbench
// This get re-rendered when nowViewingItem changes
const SidePanel = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes: {
        terria: React.PropTypes.object,
        toggleModalWindow: React.PropTypes.func
    },

    removeAll() {
        this.props.terria.nowViewing.removeAll();
    },

    renderContent(nowViewing) {
        if (nowViewing && nowViewing.length > 0) {
            return (
              <div className="now-viewing">
                  <ul className="now-viewing__header list-reset clearfix">
                      <li className='col col-5'><label className='label'> Data Sets </label></li>
                      <li className='col col-5'><button onClick={this.removeAll} className='btn'>{btnRemove}</button></li>
                      <li className='col col-2'><label className='label-badge label'> {nowViewing.length} </label></li>
                  </ul>
                  <NowViewingContainer toggleModalWindow={this.props.toggleModalWindow} nowViewing={nowViewing}/>
              </div>);
        }
    },

    render() {
        return (
        <div>
        <div className='workbench__header'>
        <SearchBox terria={this.props.terria} dataSearch={false} toggleModalWindow={this.props.toggleModalWindow} />
        <ModalTriggerButton btnHtml={btnAdd} toggleModalWindow={this.props.toggleModalWindow} classNames = 'now-viewing__add' activeTab={1} />
        </div>
        {this.renderContent(this.props.terria.nowViewing.items)}
        </div>);
    }
});
module.exports = SidePanel;
