import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import Tabs from './Tabs.jsx';

const ExplorerWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    close() {
        this.props.viewState.explorerPanelIsVisible = false;
        this.props.viewState.switchMobileView('nowViewing');
    },

    bringToFront() {
        // Bring modal window to front.
        this.props.viewState.switchComponentOrder(this.props.viewState.componentOrderOptions.modelWindow);
    },

    isVisible() {
        return !this.props.viewState.hideMapUi() && this.props.viewState.explorerPanelIsVisible;
    },

    componentDidMount() {
        this.escKeyListener = e => {
            if (e.keyCode === 27) {
                this.close();
            }
        };
        window.addEventListener('keydown', this.escKeyListener, true);
    },

    componentWillUnmount() {
        window.removeEventListener('keydown', this.escKeyListener, false);
    },

    render() {
        return (
            <div onClick={this.bringToFront}
                 className={`data-panel-wrapper modal-wrapper ${this.isVisible() ? 'is-open' : ''} ${this.props.viewState.componentOnTop === this.props.viewState.componentOrderOptions.modelWindow ? 'is-top' : ''}`}
                 id="explorer-panel-wrapper"
                 aria-hidden={!this.isVisible}>
                <div onClick={this.close}
                     id="modal-overlay"
                     className="modal-overlay"
                     tabIndex="-1"/>
                <div id="explorer-panel"
                     className="explorer-panel modal-content"
                     aria-labelledby="modalTitle"
                     aria-describedby="modalDescription"
                     role="dialog">
                    <button type='button' onClick={this.close} className="btn btn-transparent btn--close-modal" title="Close data panel"
                            data-target="close-modal">
                        Done
                    </button>
                    <Tabs terria={this.props.terria}
                          viewState={this.props.viewState}
                    />
                </div>
            </div>);
    }
});

module.exports = ExplorerWindow;
