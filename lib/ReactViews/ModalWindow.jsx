'use strict';

import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import Tabs from './Tabs.jsx';

const ModalWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        isVisible: React.PropTypes.bool,
        activeTabID: React.PropTypes.number,
        catalogSearchText: React.PropTypes.string,
        previewedCatalogItem: React.PropTypes.object,
        myDataPreviewedCatalogItem: React.PropTypes.object,
        onClose: React.PropTypes.func,
        onCatalogSearchTextChanged: React.PropTypes.func,
        onActiveTabChanged: React.PropTypes.func,
        onPreviewedCatalogItemChanged: React.PropTypes.func,
        isDraggingDroppingFile: React.PropTypes.bool,
        onFinishDroppingFile: React.PropTypes.func
    },

    render() {
        return (
            <div className={'data-panel-wrapper modal-wrapper fixed flex flex-center ' + (this.props.isVisible ? 'is-open' : '')}
                 id="data-panel-wrapper"
                 // Temp disable
                 // aria-hidden={!this.props.modalWindowIsOpen}
                 >
              <div onClick={this.props.onClose}
                   id="data-panel-overlay"
                   className="modal-overlay absolute"
                   tabIndex="-1">
              </div>
              <div id="data-panel" className="data-panel modal-content" aria-labelledby="modalTitle" aria-describedby="modalDescription" role="dialog">
                <button onClick={this.props.onClose} className="btn btn-close-modal" title="Close data panel" data-target="close-modal">
                  <i className='icon icon-close'></i>
                </button>
                <Tabs terria={this.props.terria}
                      activeTabID={this.props.activeTabID}
                      catalogSearchText={this.props.catalogSearchText}
                      previewedCatalogItem={this.props.previewedCatalogItem}
                      myDataPreviewedCatalogItem={this.props.myDataPreviewedCatalogItem}
                      onCatalogSearchTextChanged={this.props.onCatalogSearchTextChanged}
                      onActiveTabChanged={this.props.onActiveTabChanged}
                      onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                      isDraggingDroppingFile ={this.props.isDraggingDroppingFile}
                      onFinishDroppingFile={this.props.onFinishDroppingFile}
                />
              </div>
            </div>);
    }
});

module.exports = ModalWindow;
