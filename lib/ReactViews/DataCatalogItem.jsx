'use strict';

const React = require('react');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

// Individual dataset
const DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes: {
        item: React.PropTypes.object
    },

    getInitialState() {
        return {
            isPreviewed: false
        };
    },

    addToPreview(event) {
        event.preventDefault();

        if (this.state.isPreviewed === false) {
            window.previewUpdate.raiseEvent(this.props.item);
        }

        this.setState({
            isPreviewed: !this.state.isPreviewed
        });
    },

    addToMap(event) {
        event.preventDefault();

        this.props.item.toggleEnabled();
        this.addToPreview(event);
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

    render() {
        const item = this.props.item;
        return (
            <li className="clearfix data-catalog-item flex">
                <button onClick={this.addToMap} title="add to map" className='btn relative btn-add-to-map'>
                    <i className={this.renderIconClass(item)}> </i>
                </button>
                <button onClick={this.addToPreview} className='btn btn-catalog-item relative'>{item.name}</button>
            </li>
            );
    }
});

module.exports = DataCatalogItem;
