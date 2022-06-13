import React, { FC } from "react";
import { Credit } from "./Credit";
import { ICreditsProps } from "./Credits.props";
import { useTheme } from "styled-components";

export const Spacer = () => {
  const theme = useTheme();
  return (
    <span aria-hidden="true" css={{ color: theme.textLight }}>
      |
    </span>
  );
};

export const Credits: FC<ICreditsProps> = ({ credits }) => {
  if (!credits || credits.length === 0) {
    return null;
  }
  return (
    <>
      {credits.map((credit, index) => (
        <Credit
          key={index}
          credit={credit}
          lastElement={index === credits.length - 1}
        />
      ))}
    </>
  );
};
