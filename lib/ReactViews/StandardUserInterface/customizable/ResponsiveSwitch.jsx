import React from 'react';

export default (LargeScreenComponent, SmallScreenComponent, location) => {
    function ResponsiveSwitch(props) {
        return (
            <Choose>
                <When condition={props.smallScreen}>
                    <SmallScreenComponent {...props} />
                </When>
                <Otherwise>
                    <LargeScreenComponent {...props} />
                </Otherwise>
            </Choose>
        );
    }

    ResponsiveSwitch.propTypes = {
        smallScreen: React.PropTypes.bool.isRequired
    };

    ResponsiveSwitch.location = location;

    return ResponsiveSwitch;
};
