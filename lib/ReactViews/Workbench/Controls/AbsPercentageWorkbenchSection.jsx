'use strict';

import classNames from 'classnames';
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import Icon from "../../Icon.jsx";
import Styles from './abs-percentage.scss';

const AbsPercentageWorkbenchSection = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        item: React.PropTypes.object
    },

    togglePercentage() {
        this.props.item.displayPercent = !this.props.item.displayPercent;
    },

    render() {
        if (!this.props.item.canDisplayPercent) {
            return null;
        }

        return (
            <label className={Styles.main}>
                <button type='button'
                        onClick={this.togglePercentage}
                        className={classNames(
                            Styles.btn,
                            {
                                [Styles.btnActive]: this.props.item.displayPercent,
                                [Styles.btnInactive]: !this.props.item.displayPercent
                            }
                        )}
                >
                    {this.props.item.displayPercent ? <Icon glyph={Icon.GLYPHS.checkboxOn}/> :<Icon glyph={Icon.GLYPHS.checkboxOff}/>}
                    <span>Display as a percentage of region population</span>
                </button>
            </label>
        );
    }
});
module.exports = AbsPercentageWorkbenchSection;
