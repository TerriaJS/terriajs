'use strict';
import ObserveModelMixin from './ObserveModelMixin';
import proxyCatalogItemUrl from '../Models/proxyCatalogItemUrl';
import React from 'react';

const Legend = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        nowViewingItem: React.PropTypes.object
    },

    onImageError(legend) {
        legend.imageHasError = true;
    },

    getLegends() {
        return this.props.nowViewingItem.legendUrls &&
                  this.props.nowViewingItem.legendUrls.length &&
                  this.props.nowViewingItem.legendUrls.map((legendUrl)=>{
                      return {
                          url: proxyCatalogItemUrl(this.catalogMember, legendUrl.url),
                          isImage: legendUrl.isImage(),
                          imageHasError: false,
                          onImageError: this.onImageError,
                          insertDirectly: !!legendUrl.safeSvgContent, // we only insert content we generated ourselves, not arbitrary SVG from init files.
                          safeSvgContent: {__html: legendUrl.safeSvgContent}
                      };
                  });
    },

    renderLegends() {
        let legends = this.getLegends().map((legend, i)=>{
            if(legend.isImage) {
                if (legend.imageHasError) {return null;}

                if (legend.insertDirectly) {
                    return (<div key={i} onError={this.onImageError.bind(this, legend)} className="legend--svg" dangerouslySetInnerHTML={legend.safeSvgContent}></div>);
                }

                return (<a key={i} onError={this.onImageError.bind(this, legend)} href={legend.url} target="_blank">
                            <div className="legend--image">
                                <img src={legend.url}/>
                            </div>
                        </a>);
            }
            return (<a key={i} className="legend--text"
                       href={legend.url}
                       target="_blank">Open legend in a separate tab
                    </a>);
        });

        if(!this.getLegends || this.getLegends().length === 0) {
            if (this.props.nowViewingItem.type === 'abs-itt') {
                legends = <div className="legend--text">Select at least one code in each data area.</div>;
            }
            else {
                legends = <div className="legend--text">No legend available for this data item.</div>;
            }
        }
        return legends;
    },

    render() {
        return <div className='legend'>{this.renderLegends()}</div>;
    }
});
module.exports = Legend;
