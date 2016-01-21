'use strict';
const React = require('react');
const SearchBox = require('./SearchBox.jsx');
const ModalTriggerButton = require('./ModalTriggerButton.jsx');
const NowViewingItem = require('./NowViewingItem.jsx');
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
    terria: React.PropTypes.object
  },

  getInitialState() {
    return {
      notSearching: true
    };
  },

  removeAll() {
    this.props.terria.nowViewing.removeAll();
  },

  searchStart(_notSearching) {
    this.setState({
      notSearching: _notSearching
    });
  },

  renderContent(nowViewing) {
    if ((nowViewing && nowViewing.length > 0) && this.state.notSearching === true) {
        return (
        <div className="now-viewing">
            <ul className="now-viewing__header list-reset clearfix">
                <li className='col col-5'><label className='label'> Data Sets </label></li>
                <li className='col col-5'><button onClick={this.removeAll} className='btn'>{btnRemove}</button></li>
                <li className='col col-2'><label className='label-badge label'> {nowViewing.length} </label></li>
            </ul>
            <ul className="now-viewing__content list-reset">
                {nowViewing.map((item, i)=>(<NowViewingItem nowViewingItem={item} index={i} key={i} />))}
            </ul>
        </div>);
    }
  },

  render() {
    const terria = this.props.terria;
    const nowViewing = this.props.terria.nowViewing.items;

    return (
        <div>
        <div className='workbench__header'>
        <SearchBox terria={terria} dataSearch={false} callback={this.searchStart}/>
        <ModalTriggerButton btnHtml={btnAdd} classNames = 'now-viewing__add' activeTab={1} />
        </div>
        {this.renderContent(nowViewing)}
    </div>);
  }
});
module.exports = SidePanel;
