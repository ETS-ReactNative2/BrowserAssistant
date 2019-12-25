import React from 'react';
import classNames from 'classnames';
import { SWITCHER_IDS } from '../../../stores/consts';
import './switcher.pcss';

const Switcher = ({
    id, checked, onClick, isPageSecured, certStatus,
}) => {
    const switcherTextClass = classNames({
        switcher__text: true,
        'switcher__text--secured': isPageSecured,
    });

    const switcherLabelClass = classNames({
        switcher__label: true,
        'switcher__label--disabled': isPageSecured || (id === SWITCHER_IDS.HTTPS_SWITCHER && certStatus.isInvalid),
    });

    return (
        <div className="switcher">
            <input
                className="switcher__checkbox"
                type="checkbox"
                id={id}
                readOnly
                checked={checked}
            />
            <label
                className={switcherLabelClass}
                htmlFor={id}
                onClick={onClick}
            />
            <div className={switcherTextClass} />
        </div>
    );
};

export default Switcher;
