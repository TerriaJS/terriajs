'use strict';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from "./Icon.jsx";

import Styles from './drag-drop-notification.scss';

const DragDropNotification = createReactClass({
    displayName: 'DragDropNotification',
    mixins: [ObserveModelMixin],
    propTypes: {
        viewState: PropTypes.object,
    },

    handleClick() {
      this.props.viewState.explorerPanelIsVisible = true;
    },

    render() {
      const fileNames = this.props.viewState.recentlyUploadedFiles.join(', ');

      return (
        <button className={classNames(Styles.notification, {[Styles.isActive]: fileNames.length > 0})} onClick={this.handleClick}>
            <div className={Styles.icon}><Icon glyph={Icon.GLYPHS.upload} /></div>
            <div className={Styles.info}><span className={Styles.filename}>{'"'}{`${fileNames.length > 0 ? fileNames : "your files"}`}{'"'}</span> has been added to <span className={Styles.action}>My data</span></div>
        </button>);
    },
});
module.exports = DragDropNotification;
