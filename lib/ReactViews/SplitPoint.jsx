'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const SplitPoint = createReactClass({
    propTypes: {
        loadComponent: PropTypes.func.isRequired
    },
    getInitialState() {
        return {component: null};
    },
    componentDidMount() {
        this.props.loadComponent(component => this.setState({component}));
    },
    render() {
        const ChunkComponent = this.state.component;
        return ChunkComponent && <ChunkComponent {...this.props}/>;
    }
});

module.exports = SplitPoint;
