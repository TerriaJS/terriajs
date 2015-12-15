'use strict';
var React = require('react');
var MyDataTab = React.createClass({
    render: function() {
        return (<div className="panel-content row">
                <div className='col col-6'>
                <h2> Your Data </h2>
                <p> Empty </p>
                </div>
                <div className='col col-6'>
                <h2> Add Data </h2>
                <p> Add data to the map from your local system or from elsewhere on the web. Data added in this way is not saved or made visible to others unless you explicitly share it by using the Share panel. </p>
                <ul className='list-reset row relative'>
                  <li className='col col-6 is-active'> <button className='btn btn-data-upload'> Local file</button> <div aria-hidden = 'false' className='mydata-panel_data-tab-section'> <input className='btn'  type='file'/> </div></li>
                  <li className='col col-6'> <button className='btn btn-data-upload'> Web Service</button> <div aria-hidden = 'true' className='mydata-panel_data-tab-section'> <input  className='field' type='text' placeholder='e.g. http://data.gov.au/geoserver/wms'/> </div> </li>
                </ul>
                </div>
                </div>);
    }
});
module.exports = MyDataTab;
