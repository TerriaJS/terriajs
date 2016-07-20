'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';

import Loader from '../../Loader.jsx';
import ObserveModelMixin from '../../ObserveModelMixin';
import proxyCatalogItemUrl from '../../../Models/proxyCatalogItemUrl';
import classNames from 'classnames';
import Styles from './legend.scss';

import React from 'react';

const Legend = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        item: React.PropTypes.object
    },

    onImageError(legend) {
        legend.imageHasError = true;
        this.forceUpdate();
    },

    componentWillMount() {
        this.legends = this.getLegends();
    },

    getLegends() {
        if (defined(this.props.item.legendUrls)) {
            return this.props.item.legendUrls.map((legendUrl)=>{
                return {
                    url: proxyCatalogItemUrl(this.catalogMember, legendUrl.url),
                    isImage: legendUrl.isImage(),
                    imageHasError: false,
                    onImageError: this.onImageError,
                    insertDirectly: !!legendUrl.safeSvgContent, // we only insert content we generated ourselves, not arbitrary SVG from init files.
                    safeSvgContent: {__html: legendUrl.safeSvgContent}
                };
            });
        }
        return [];
    },

    render() {
        return (
            <ul className={Styles.legend}>
                <div className={Styles.legendInner}>
                    <Choose>
                        <When condition={this.props.item.isLoading}>
                            <li className={Styles.loader}><Loader message={this.props.item.loadingMessage}/></li>
                        </When>
                        <Otherwise>
                            <For each="legend" index="i" of={this.legends}>
                                <Choose>
                                    <When condition={legend.isImage && legend.insertDirectly}>
                                        <li key={i}
                                            onError={this.onImageError.bind(this, legend)}
                                            className={Styles.legendSvg, {[Styles.legendImagehasError]: legend.imageHasError}}
                                            dangerouslySetInnerHTML={legend.safeSvgContent}
                                        />
                                    </When>
                                    <When condition={legend.isImage}>
                                        <li key={legend.url} className={classNames({[Styles.legendImagehasError]: legend.imageHasError})}>
                                            <a onError={this.onImageError.bind(this, legend)}
                                               href={legend.url}
                                               target="_blank">
                                                <img src={legend.url}/>
                                            </a>
                                        </li>
                                    </When>
                                    <Otherwise>
                                        <li key={legend.url}>
                                            <a href={legend.url}
                                               target="_blank">Open legend in a separate tab
                                            </a>
                                        </li>
                                    </Otherwise>
                                </Choose>
                            </For>
                        </Otherwise>
                    </Choose>
                </div>
            </ul>
        );
    }
});
module.exports = Legend;
