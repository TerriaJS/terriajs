import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserveModelMixin from './ObserveModelMixin';


const StoryPanel = createReactClass({
    displayName: 'StoryPanel',
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            newTitle: "",
            newText: "",
            uri: ""
        };
    },

    render() {
        const l = [];
        for (let i = 0; i < 100; i++) {
            l.push(i);
        }
        return (
            <div>
                {l.map(n => (<div key={n}>{n}</div>))}
            </div>
        )
    }
});

export default StoryPanel;
