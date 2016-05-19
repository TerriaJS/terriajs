import React from 'react';
import WorkbenchList from './WorkbenchList.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import BadgeBar from '../BadgeBar.jsx';
import Styles from './workbench.scss';

const Workbench = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    removeAll() {
        this.props.terria.nowViewing.removeAll();
    },

    render() {
        return (
            <div className={Styles.nowViewing}>
                <BadgeBar label="Data Sets" badge={this.props.terria.nowViewing.items.length}>
                    <button type='button' onClick={this.removeAll} className={Styles.removeButton}>
                        Remove All <i className={Styles.iconRemove}/>
                    </button>
                </BadgeBar>
                <WorkbenchList viewState={this.props.viewState} terria={this.props.terria}/>
            </div>
        );
    }
});

export default Workbench;
