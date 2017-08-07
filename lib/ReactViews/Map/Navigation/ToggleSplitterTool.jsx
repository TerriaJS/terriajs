'use strict';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from "../../Icon.jsx";
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './toggle_splitter_tool.scss';

const ToggleSplitterTool = createReactClass({
    displayName: 'ToggleSplitterTool',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object
    },

    handleClick() {
        const terria = this.props.terria;
        terria.showSplitter = !terria.showSplitter;
    },

    render() {
        if (!this.props.terria.currentViewer.canShowSplitter) {
            return null;
        }
        return <div className={Styles.toggle_splitter_tool}>
                  <button type='button' className={Styles.btn}
                          title='Toggle splitter control'
                          onClick={this.handleClick}>
                          <Icon glyph={this.props.terria.showSplitter ? Icon.GLYPHS.checkboxOn : Icon.GLYPHS.checkboxOff}/>
                  </button>
               </div>;
    },
});

export default ToggleSplitterTool;
