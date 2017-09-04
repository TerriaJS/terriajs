'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import MenuPanel from '../../../StandardUserInterface/customizable/MenuPanel.jsx';

import Styles from './tools-panel.scss';

const TestingSection = createReactClass({
    displayName: 'TestingSection',
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
      return {
        datasetToTest: 'all-opened',
        from: '5',
        to: '5',
        useWMSTileCache: true,
        showMoreImageryLayerInfo: false,
        useProxyCache: false
      }
    },

    render() {
        return (
            <form>
              <h3>Dataset Testing</h3>
                <label>
                  <div>Select the dataset to test</div>
                  <select className={Styles.select}>
                    <option value="all-opened">All Opened</option>
                    <option value="all-enabled">All Enabled</option>
                    <option value="all">All</option>
                  </select>
                </label>

                <label>
                  <div className={Styles.zoomRange}>Measure speed of tiles in zoom range:</div>
                  <input className={Styles.numberInput} type="number" />
                  <span> to </span>
                  <input className={Styles.numberInput} type="number" />
                </label>
                  <label className={Styles.checkbox}>
                      <input type="checkbox"/>
                      Use WMS tile cache
                  </label>
                  <label className={Styles.checkbox}>
                      <input type="checkbox"/>
                      Show more imagery layer info
                  </label>
                  <label className={Styles.checkbox}>
                      <input type="checkbox"/>
                        Use proxy cache
                  </label>
                <button className={Styles.submit} type="button" value="Request Tiles">Request Tiles</button>
            </form>
        );
    },
});

export default TestingSection;
