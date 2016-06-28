import React from 'react';
import classNames from 'classnames';

import Styles from './data-catalog-item.scss';

const STATE_TO_TITLE = {
    loading: 'Loading...',
    remove: 'Remove',
    add: 'Add'
};

const STATE_TO_BUTTON_CLASS = {
    loading: Styles.btnActionLoadingOnMap,
    remove: Styles.btnActionRemoveFromMap,
    add: Styles.btnActionAddToMap,
    stats: Styles.btnActionStatsBars
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
                    className={classNames(Styles.btnAction, STATE_TO_BUTTON_CLASS[props.btnState])}
            />
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
