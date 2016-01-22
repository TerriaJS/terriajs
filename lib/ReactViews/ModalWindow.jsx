'use strict';

const React = require('react');
const Tabs = require('./Tabs.jsx');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

const ModalWindow = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            isOpen: true,
            activeTab: 0
        };
    },

    componentWillMount() {
        const that = this;
        window.openModalWindow.addEventListener((_activeTab) => {
            that.setState({
                isOpen: true,
                activeTab: _activeTab
            });
        });
    },

    closeModal() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    render() {
        return (
            <div className="data-panel-wrapper modal-wrapper fixed flex flex-center" id="data-panel-wrapper" aria-hidden={ !this.state.isOpen }>
              <div onClick={ this.closeModal } id="data-panel-overlay" className="modal-overlay absolute" tabIndex="-1"></div>
              <div id="data-panel" className="data-panelm odal-content mx-auto v-middle" aria-labelledby="modalTitle" aria-describedby="modalDescription" role="dialog">
                <button onClick={ this.closeModal } className="btn btn-close-modal" title="Close data panel" data-target="close-modal"><i className='icon icon-close'></i></button>
                <Tabs terria={ this.props.terria } activeTab={ this.state.activeTab } />
              </div>
            </div>
            );
    }
});
module.exports = ModalWindow;
