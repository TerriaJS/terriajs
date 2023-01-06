import { observer } from "mobx-react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { DefaultTheme, withTheme } from "styled-components";
import { RelatedMap } from "../../Models/RelatedMaps";
import Box from "../../Styled/Box";
import { ExternalLinkIcon } from "../Custom/ExternalLink";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import {
  withViewState,
  WithViewState
} from "../StandardUserInterface/ViewStateContext";
import Styles from "./related-maps.scss";

const MenuPanel =
  require("../StandardUserInterface/customizable/MenuPanel").default;

type PropTypes = WithViewState &
  WithTranslation & {
    theme: DefaultTheme;
    relatedMaps: RelatedMap[];
  };

@observer
class RelatedMaps extends React.Component<PropTypes> {
  /**
   * @param {Props} props
   */
  constructor(props: PropTypes) {
    super(props);
  }

  render() {
    const dropdownTheme = {
      inner: Styles.dropdownInner,
      icon: "gallery"
    };

    const smallScreen = this.props.viewState.useSmallScreenInterface;

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnText="Related Maps"
        smallScreen={smallScreen}
        viewState={this.props.viewState}
        btnTitle="See related maps"
        showDropdownInCenter
      >
        <h2>Related Maps</h2>

        <p>Clicking on a map below will open it in a separate window or tab.</p>

        {this.props.relatedMaps.map((map, i) => (
          <Box flex key={i}>
            <Box>
              <a target="_blank" href={map.url}>
                <img
                  style={{
                    marginRight: "10px",
                    marginBottom: "10px",
                    width: "200px",
                    height: "150px"
                  }}
                  src={map.imageUrl}
                  alt={map.title}
                />
              </a>
            </Box>

            <Box displayInlineBlock>
              <a
                target="_blank"
                style={{ color: this.props.theme.colorPrimary }}
                href={map.url}
              >
                {map.title}
                <ExternalLinkIcon />
              </a>

              {parseCustomMarkdownToReact(map.description)}
            </Box>
          </Box>
        ))}
      </MenuPanel>
    );
  }
}

export default withTranslation()(withTheme(withViewState(RelatedMaps)));
