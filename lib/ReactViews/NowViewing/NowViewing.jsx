import React from 'react';
import NowViewingList from './NowViewingList.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './now-viewing.scss';

const NowViewing = React.createClass({
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
                <ul className={Styles.header}>
                    <li>
                        <label className={Styles.label}>Data Sets</label>
                    </li>
                    <li>
                        <label className={Styles.labelBadge}>{this.props.terria.nowViewing.items.length}</label>
                    </li>
                    <li>
                        <button type='button' onClick={this.removeAll} className={Styles.removeButton}>
                            Remove All
                        </button>
                        <i className={Styles.iconRemove}/>
                    </li>
                </ul>
                <NowViewingList viewState={this.props.viewState} terria={this.props.terria}/>
            </div>
        );
    }
});

export default NowViewing;
