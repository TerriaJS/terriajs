import React from 'react';
import NowViewingList from './NowViewingList.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import SidePanelHeader from '../SidePanel/SidePanelHeader.jsx';
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
                <SidePanelHeader label="Data Sets" badge={this.props.terria.nowViewing.items.length}>
                    <button type='button' onClick={this.removeAll} className={Styles.removeButton}>
                        Remove All
                    </button>
                    <i className={Styles.iconRemove}/>
                </SidePanelHeader>
                <NowViewingList viewState={this.props.viewState} terria={this.props.terria}/>
            </div>
        );
    }
});

export default NowViewing;
