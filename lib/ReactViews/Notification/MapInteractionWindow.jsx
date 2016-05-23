'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import Styles from './map-interaction-window.scss';
import classNames from 'classnames';

const MapInteractionWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object
    },

    render() {
        const interactionMode = this.props.terria.mapInteractionModeStack && this.props.terria.mapInteractionModeStack[this.props.terria.mapInteractionModeStack.length - 1];
        let windowClass = classNames(Styles.window, {
            [Styles.isActive]: interactionMode
        });

        return (
            <div className={windowClass} aria-hidden={ !interactionMode }>
              <div className={Styles.content}>{interactionMode && interactionMode.message}</div><button type='button' onClick={interactionMode && interactionMode.onCancel}
                          className='btn btn-primary'>Cancel</button>
            </div>);
    }
});

module.exports = MapInteractionWindow;
