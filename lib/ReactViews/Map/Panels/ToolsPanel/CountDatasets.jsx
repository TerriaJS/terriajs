'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';

import Styles from './tools-panel.scss';

const CountDatasets = createReactClass({
    displayName: 'CountDatasets',
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
      return {
        count: null,
      }
    },

    render() {
        return (
            <form>
                <button className={Styles.submit} onClick={this.props.countDatasets} type="button" value="Count datasets">Count Datasets</button>
            </form>
        );
    },
});

export default CountDatasets;
