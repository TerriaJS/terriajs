'use strict';

import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import Tabs from './Tabs.jsx';
import classNames from 'classnames';

// TODO: Rename this :/
const ModalWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    close() {
        this.props.viewState.modalVisible = false;
        this.props.viewState.switchMobileView('nowViewing');
    },

    render() {
        return (
            <div className={classNames('data-panel-wrapper', 'modal-wrapper', {'is-open' : this.props.viewState.modalVisible})}
                 id="explorer-panel-wrapper"
                 aria-hidden={!this.props.viewState.modalVisible}
            >
                <div onClick={this.close}
                     id="modal-overlay"
                     className="modal-overlay"
                     tabIndex="-1">
                </div>
                <div id="explorer-panel"
                     className="explorer-panel modal-content"
                     aria-labelledby="modalTitle"
                     aria-describedby="modalDescription"
                     role="dialog">
                    <button onClick={this.close}  className="btn btn--close-modal" title="Close data panel" data-target="close-modal"></button>
                    <Tabs terria={this.props.terria}
                          viewState={this.props.viewState}
                    />
                </div>
            </div>);
    }
});

module.exports = ModalWindow;
