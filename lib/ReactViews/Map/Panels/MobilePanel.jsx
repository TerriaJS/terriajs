// proptypes are in mixin.
/* eslint react/prop-types:0*/

import React from 'react';

import createReactClass from 'create-react-class';

import MobileMenuItem from '../../Mobile/MobileMenuItem';
import BaseOuterPanel from './BaseOuterPanel';
import InnerPanel from './InnerPanel';

import Styles from './panel.scss';

const MobilePanel = createReactClass({
    displayName: 'MobilePanel',
    mixins: [BaseOuterPanel],

    render() {
        return (
            <div className={Styles.mobilePanel}>
                <MobileMenuItem onClick={this.openPanel} caption={this.props.btnText}/>
                <If condition={this.state.isOpen}>
                    {/* The overlay doesn't actually need to do anything except block clicks, as InnerPanel will listen to the window */}
                    <div className={Styles.overlay}/>

                    
                </If>
            </div>
        );
    },
});

export default MobilePanel;
