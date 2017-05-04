'use strict';

import classNames from 'classnames';
import defined from 'terriajs-cesium/Source/Core/defined';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import Loader from '../../Loader.jsx';
import ObserveModelMixin from '../../ObserveModelMixin';
import proxyCatalogItemUrl from '../../../Models/proxyCatalogItemUrl';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Styles from './legend.scss';

const Legend = createReactClass({
    displayName: 'Legend',
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object
    },

    componentWillMount() {
        this.legendsWithError = {};
    },

    onImageError(legend) {
        this.legendsWithError[legend.url] = true;
    },

    doesLegendHaveError(legend) {
        const hasError = this.legendsWithError[legend.url];
        if (!defined(hasError)) {
            this.legendsWithError[legend.url] = false;
            knockout.track(this.legendsWithError, [legend.url]);
        }
        return this.legendsWithError[legend.url];
    },

    renderLegend(legendUrl, i) {
        const isImage = legendUrl.isImage();
        const insertDirectly = !!legendUrl.safeSvgContent; // we only insert content we generated ourselves, not arbitrary SVG from init files.
        const safeSvgContent = {__html: legendUrl.safeSvgContent};
        const proxiedUrl = proxyCatalogItemUrl(this.props.item, legendUrl.url);

        return (
            <Choose>
                <When condition={isImage && insertDirectly}>
                    <li key={i}
                        onError={this.onImageError.bind(this, legendUrl)}
                        className={classNames(Styles.legendSvg , {[Styles.legendImagehasError]: this.doesLegendHaveError(legendUrl)})}
                        dangerouslySetInnerHTML={safeSvgContent}
                    />
                </When>
                <When condition={isImage}>
                    <li key={proxiedUrl} className={classNames({[Styles.legendImagehasError]: this.doesLegendHaveError(legendUrl)})}>
                        <a onError={this.onImageError.bind(this, legendUrl)}
                           href={proxiedUrl}
                           className={Styles.imageAnchor}
                           target="_blank">
                            <img src={proxiedUrl}/>
                        </a>
                    </li>
                </When>
                <Otherwise>
                    <li key={proxiedUrl}>
                        <a href={proxiedUrl}
                           target="_blank">Open legend in a separate tab
                        </a>
                    </li>
                </Otherwise>
            </Choose>);
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
                            <For each="legend" index="i" of={this.props.item.legendUrls || []}>
                                {this.renderLegend(legend, i)}
                            </For>
                        </Otherwise>
                    </Choose>
                </div>
            </ul>
        );
    },
});
module.exports = Legend;
