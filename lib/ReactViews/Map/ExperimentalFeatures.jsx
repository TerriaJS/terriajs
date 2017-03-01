import React from 'react';

import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './experimental-features.scss';

// The experimental features
const ExperimentalFeatures = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
        experimentalItems: React.PropTypes.arrayOf(React.PropTypes.element)
    },

    getDefaultProps() {
        return {
            experimentalItems: []
        };
    },

    render() {
        return (
            <div className={Styles.experimentalFeatures}>
                <For each="item" of={this.props.experimentalItems} index="i">
                    <div className={Styles.control} key={i}>
                        {item}
                    </div>
                </For>
            </div>
        );
    }
});

export default ExperimentalFeatures;
