'use strict';
import React from 'react';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import ObserveModelMixin from '../ObserveModelMixin';

const ParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        parameter: React.PropTypes.object,
        onChange: React.PropTypes.func
    },

    renderEditor(){
        switch(this.props.parameter.type) {
            case 'point':
                return <input className='field' type="number" name="points" onChange={this.props.onChange}/>;
            case 'enumeration':
                return <select onChange={this.props.onChange}>
                            {this.props.parameter.posibleValues.map((v, i)=><option value={v} key={i}>{v}</option>)}
                       </select>;
            default:
                return <input className='field' type="text" value={this.props.parameter.value} onChange={this.props.onChange}/>;
        }
    },

    render() {
        return (<div>
                {this.props.parameter.name}
                {this.renderEditor()}
                </div>);
    }
});

module.exports = ParameterEditor;
