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
    },

    render() {
        return (
            <div
                className={classNames('data-panel-wrapper', 'modal-wrapper', 'fixed', 'flex', 'flex-center', {'is-open' : this.props.viewState.modalVisible})}
                id="data-panel-wrapper"
                // Temp disable
                // aria-hidden={!this.props.modalWindowIsOpen}
            >
                <div onClick={this.close}
                     id="data-panel-overlay"
                     className="modal-overlay absolute"
                     tabIndex="-1">
                </div>
                <div id="data-panel" className="data-panel modal-content" aria-labelledby="modalTitle"
                     aria-describedby="modalDescription" role="dialog">
                    <button onClick={this.close} className="btn btn-close-modal" title="Close data panel"
                            data-target="close-modal">
                        <i className='icon icon-close' />
                    </button>
                    <Tabs terria={this.props.terria}
                          viewState={this.props.viewState}
                    />
                </div>
            </div>);
    }
});

module.exports = ModalWindow;
