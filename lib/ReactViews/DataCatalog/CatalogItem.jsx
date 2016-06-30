import React from 'react';
import classNames from 'classnames';
import Icon from "../Icon.jsx";

import Styles from './data-catalog-item.scss';

const STATE_TO_TITLE = {
    loading: 'Loading...',
    remove: 'Remove',
    add: 'Add'
};

const STATE_TO_ICONS = {
    loading: <Icon glyph={Icon.GLYPHS.loader}/>,
    remove: <Icon glyph={Icon.GLYPHS.remove}/>,
    add: <Icon glyph={Icon.GLYPHS.add}/>,
    stats: <Icon glyph={Icon.GLYPHS.barChart}/>
};

/** Dumb catalog item */
function CatalogItem(props) {
    return (
        <li className={classNames(Styles.root)}>
            <button type='button'
                    onClick={props.onTextClick}
                    className={classNames(
                            Styles.btnCatalogItem,
                            {[Styles.btnCatalogItemIsPreviewed]: props.selected}
                        )}>
                {props.text}
            </button>
            <button type='button'
                    onClick={props.onBtnClick}
                    title={STATE_TO_TITLE[props.btnState] || ''}
                    className={Styles.btnAction}>
                    {STATE_TO_ICONS[props.btnState]}
            </button>
        </li>
    );
}

CatalogItem.propTypes = {
    onTextClick: React.PropTypes.func,
    selected: React.PropTypes.bool,
    text: React.PropTypes.string,
    onBtnClick: React.PropTypes.func,
    btnState: React.PropTypes.oneOf(['loading', 'remove', 'add', 'stats'])
};

export default CatalogItem;
