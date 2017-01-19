'use strict';

import ObserverModelMixin from '../ObserveModelMixin';
import React from 'react';
import parseCustomHtmlToReact from '../Custom/parseCustomHtmlToReact';
import Styles from './help-screen-window.scss';
import classNames from 'classnames';
import defined from 'terriajs-cesium/Source/Core/defined';
import HelpSequences from '../../ReactViewModels/HelpSequences';

const HelpScreenWindow = React.createClass({
    mixins: [ObserverModelMixin],

    propTypes: {
        helpSequences: React.PropTypes.object
    },

    render() {
        const currentScreen = this.props.helpSequences.currentScreen;

        const windowClass = classNames(Styles.window, {
            [Styles.isActive]: currentScreen
        });
        const buttonText = currentScreen && currentScreen.totalNumberOfScreens === currentScreen.currentScreenNumber ? 'DONE' : 'NEXT';
        const positionLeft = currentScreen && calculateLeftPosition(currentScreen);
        const positionTop = currentScreen && calculateTopPosition(currentScreen);

        const caretTop = currentScreen && currentScreen.caretTop;
        const caretLeft = currentScreen && currentScreen.caretLeft;

        const width = currentScreen && currentScreen.width;

        return (
            <div style={{left: positionLeft + 'px', top: positionTop + 'px', width: width + 'px'}} className={windowClass} aria-hidden={ !currentScreen }>
              <span style={{left: caretLeft + 'px', top: caretTop + 'px'}} className={Styles.caret}/>
              <div className={Styles.content}>
                  {currentScreen && parseCustomHtmlToReact(currentScreen.message())}
              </div>
              <div className={Styles.screenCount}>
                  <strong>{currentScreen && currentScreen.currentScreenNumber + '/' + currentScreen.totalNumberOfScreens}</strong>
              </div>
              <div className={Styles.nextButton}>
                  <button type='button' onClick={currentScreen && currentScreen.onNext}
                      className={Styles.btn}><strong>{buttonText}</strong></button>
              </div>
            </div>);
    }
});

/**
 * Work out the screen pixel value for left positioning based on helpScreen parameters.
 * @private
 */
function calculateLeftPosition(helpScreen) {
    if (!defined(helpScreen)) {
        return;
    }
    const screenRect = helpScreen.rectangle;
    let leftPosition = 0;
    if (helpScreen.positionLeft === HelpSequences.RelativePosition.RECT_LEFT) {
        leftPosition = screenRect.left;
    } else if (helpScreen.positionLeft === HelpSequences.RelativePosition.RECT_RIGHT) {
        leftPosition = screenRect.right;
    } else if (helpScreen.positionLeft === HelpSequences.RelativePosition.RECT_TOP) {
        leftPosition = screenRect.top;
    } else if (helpScreen.positionLeft === HelpSequences.RelativePosition.RECT_BOTTOM) {
        leftPosition = screenRect.bottom;
    }

    leftPosition += helpScreen.offsetLeft;
    return leftPosition;
}

/**
 * Work out the screen pixel value for top positioning based on helpScreen parameters.
 * @private
 */
function calculateTopPosition(helpScreen) {
    if (!defined(helpScreen)) {
        return;
    }
    const screenRect = helpScreen.rectangle;
    let topPosition = 0;
    if (helpScreen.positionTop === HelpSequences.RelativePosition.RECT_LEFT) {
        topPosition = screenRect.left;
    } else if (helpScreen.positionTop === HelpSequences.RelativePosition.RECT_RIGHT) {
        topPosition = screenRect.right;
    } else if (helpScreen.positionTop === HelpSequences.RelativePosition.RECT_TOP) {
        topPosition = screenRect.top;
    } else if (helpScreen.positionTop === HelpSequences.RelativePosition.RECT_BOTTOM) {
        topPosition = screenRect.bottom;
    }

    topPosition += helpScreen.offsetTop;
    return topPosition;
}

module.exports = HelpScreenWindow;
