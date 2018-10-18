import BadgeBar from '../BadgeBar';
import Icon from "../Icon";
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import WorkbenchList from './WorkbenchList';
import { observer } from 'mobx-react';


import Styles from './workbench.scss';

const Workbench = observer(createReactClass({
    displayName: 'Workbench',
    // mixins: [ObserveModelMixin],

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
                <BadgeBar label="Data Sets" badge={this.props.terria.workbench.items.length}>
                    <button type='button' onClick={this.removeAll} className={Styles.removeButton}>
                        Remove All <Icon glyph={Icon.GLYPHS.remove}/>
                    </button>
                </BadgeBar>
                <WorkbenchList viewState={this.props.viewState} terria={this.props.terria}/>
            </div>
        );
    },
}));

export default Workbench;
