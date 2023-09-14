import React from "react";
import { useTheme } from "styled-components";

export const Spacer = () => {
  const theme = useTheme();
  return (
    <span aria-hidden="true" css={{ color: theme.textLight }}>
      |
    </span>
  );
};
