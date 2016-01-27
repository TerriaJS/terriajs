'use strict';

const React = require('react');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

// Individual dataset
const DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes: {
        item: React.PropTypes.object,
        previewed: React.PropTypes.object,
        setPreview: React.PropTypes.func
    },

    addToPreview(event) {
        event.preventDefault();
        this.props.setPreview(this.props.item);
    },

    addToMap(event) {
        event.preventDefault();
        this.props.item.toggleEnabled();
        this.props.setPreview(this.props.item);
    },

    renderIconClass(item) {
        if (item.isEnabled) {
            if (item.isLoading) {
                return 'icon icon-loader';
            }
            return 'icon icon-minus';
        }
        return 'icon icon-add';
    },

    compareItem(item1, item2) {
        if((item1 && item2) && (item1 === item2)) {
            return true;
        }
        return false;
    },

    render() {
        const item = this.props.item;
        return (
            <li className={(this.compareItem(this.props.previewed, item) ? 'is-previewed' : '') + ' clearfix data-catalog-item flex' }>
                <button onClick={this.addToMap} title="add to map" className='btn relative btn-add-to-map'>
                    <i className={this.renderIconClass(item)}></i>
                </button>
                <button onClick={this.addToPreview} className='btn btn-catalog-item relative'>{item.name}</button>
            </li>
            );
    }
});

module.exports = DataCatalogItem;
