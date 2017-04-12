import BadgeBar from '../BadgeBar.jsx';
import Icon from "../Icon.jsx";
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import PropTypes from 'prop-types';
import WorkbenchList from './WorkbenchList.jsx';

import Styles from './workbench.scss';

const Workbench = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired
    },

    removeAll() {
        this.props.terria.nowViewing.removeAll();
    },

    render() {
        return (
            <div className={Styles.workbench}>
                <BadgeBar label="Data Sets" badge={this.props.terria.nowViewing.items.length}>
                    <button type='button' onClick={this.removeAll} className={Styles.removeButton}>
                        Remove All <Icon glyph={Icon.GLYPHS.remove}/>
                    </button>
                </BadgeBar>
                <WorkbenchList viewState={this.props.viewState} terria={this.props.terria}/>
            </div>
        );
    }
});

export default Workbench;
