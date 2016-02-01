"use strict";

import React from 'react';
import SearchResult from './SearchResult.jsx';
import Loader from '../Loader.jsx';

export default React.createClass({
    render() {
        return (
            <div>
                <label className='label label-sub-heading'>{this.props.name}</label>

                <ul className='list-reset search-results-items'>
                    {this.props.isSearching && <Loader />}
                    {this.props.searchMessage && <li className='label no-results'>{this.props.searchMessage}</li>}

                    {this.props.searchResults.map((result, i) => (
                        <SearchResult result={result} key={i} />
                    ))}
                </ul>
            </div>
        );
    }
});
