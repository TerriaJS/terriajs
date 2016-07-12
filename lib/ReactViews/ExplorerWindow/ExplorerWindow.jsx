import React from 'react';
import classNames from 'classnames';

import ObserveModelMixin from '../ObserveModelMixin';
import Tabs from './Tabs.jsx';
import Styles from './explorer-window.scss';

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
        const className = classNames(
            Styles.modalWrapper,
            {
                [Styles.isOpen]: this.isVisible()
            }
        );

        return (
            <div className={className}
                 id="explorer-panel-wrapper"
                 aria-hidden={!this.isVisible}>
                <div onClick={this.close}
                     id="modal-overlay"
                     className={Styles.modalOverlay}
                     tabIndex="-1"/>
                <div id="explorer-panel"
                     className={classNames(Styles.explorerPanel, Styles.modalContent)}
                     aria-labelledby="modalTitle"
                     aria-describedby="modalDescription"
                     role="dialog">
                    <button type='button'
                            onClick={this.close}
                            className={Styles.btnCloseModal}
                            title="Close data panel"
                            data-target="close-modal">
                        Done
                    </button>
                    <Tabs terria={this.props.terria} viewState={this.props.viewState}/>
                </div>
            </div>
        );
    }
});

module.exports = ExplorerWindow;
