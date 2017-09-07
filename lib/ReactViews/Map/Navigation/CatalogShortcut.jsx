'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './tool_button.scss';
import Icon from "../../Icon.jsx";

import defined from 'terriajs-cesium/Source/Core/defined';

const CatalogShortcut = createReactClass({
    displayName: 'CatalogShortcut',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        catalogMember: PropTypes.object.isRequired,
        glyph: PropTypes.string.isRequired,
        title: PropTypes.string
    },

    handleClick() {
        if (defined(this.props.catalogMember)) {
            this.props.viewState.viewCatalogMember(this.props.catalogMember);
        }
    },

    render() {
        var title = "";
        if (defined(this.props.title)) {
            title = this.props.title;
        } else if (defined(this.props.catalogMember.name)) {
            title = this.props.catalogMember.name;
        }

        return <div className={Styles.toolButton}>
                  <button type='button' className={Styles.btn}
                          title={title}
                          onClick={this.handleClick}>
                          <Icon glyph={this.props.glyph}/>
                  </button>
               </div>;
    },
});

export default CatalogShortcut;
