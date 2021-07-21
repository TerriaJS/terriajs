import React from "react";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import TerriaError from "../../Core/TerriaError";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import { RawButton } from "../../Styled/Button";
import ViewState from "../../ReactViewModels/ViewState";
import { TextSpan } from "../../Styled/Text";

// Hard code colour for now
const warningColor = "#f69900";

const WarningBox: React.FC<{
  error?: TerriaError;
  viewState?: ViewState;
}> = props => (
  <Box backgroundColor={warningColor} rounded padded>
    <Spacing right={1} />
    <WarningIcon />
    <Spacing right={2} />
    <Box backgroundColor="#ffffff" rounded fullWidth paddedRatio={3}>
      {props.error ? (
        <div>
          {parseCustomMarkdownToReact(`### ${props.error.title}`)}
          {parseCustomMarkdownToReact(props.error.message)}

          {/* Add "show details" button if there are nested errors */}
          {props.viewState &&
          Array.isArray(props.error!.originalError) &&
          props.error!.originalError.length > 0 ? (
            <RawButton
              activeStyles
              onClick={() =>
                props.viewState!.terria.raiseErrorToUser(
                  props.error,
                  undefined,
                  true
                )
              }
            >
              <TextSpan primary>See details</TextSpan>
            </RawButton>
          ) : null}
        </div>
      ) : (
        props.children
      )}
    </Box>
  </Box>
);

// Equilateral triangle
const WarningIcon = () => (
  <p
    css={`
      width: 0px;
      height: 0px;
      text-indent: -2px;
      border-left: 12px solid transparent;
      border-right: 12px solid transparent;
      border-bottom: 20px solid white;
      font-weight: bold;
      line-height: 25px;
      user-select: none;
    `}
  >
    !
  </p>
);

export default WarningBox;
