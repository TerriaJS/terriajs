'use strict';

const React = require('react');
const Tabs = require('./Tabs.jsx');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

const ModalWindow = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes: {
        terria: React.PropTypes.object,
        activeTab: React.PropTypes.number,
        modalWindowIsOpen: React.PropTypes.bool,
        previewed: React.PropTypes.object,
        setPreview: React.PropTypes.func
    },

    closeModal() {
        this.props.toggleModalWindow(false, null);
    },

    render() {
        return (
            <div className="data-panel-wrapper modal-wrapper fixed flex flex-center"
            id="data-panel-wrapper"
            aria-hidden={ !this.props.modalWindowIsOpen }>
              <div onClick={ this.closeModal }
                   id="data-panel-overlay"
                   className="modal-overlay absolute"
                   tabIndex="-1">
              </div>
              <div id="data-panel"
                   className="data-panel modal-content mx-auto v-middle"
                   aria-labelledby="modalTitle"
                   aria-describedby="modalDescription"
                   role="dialog">
                <button onClick={ this.closeModal }
                        className="btn btn-close-modal"
                        title="Close data panel"
                        data-target="close-modal">
                        <i className='icon icon-close'></i>
                </button>
                <Tabs terria={ this.props.terria }
                      activeTab={ this.props.activeTab }
                      toggleModalWindow={this.props.toggleModalWindow}
                      defaultSearchText={this.props.defaultSearchText}
                      previewed={this.props.previewed}
                      setPreview={this.props.setPreview}
                />
              </div>
            </div>
        );
    }
});
module.exports = ModalWindow;
