import React from "react";
import styled from "styled-components";
import PortalContainer from "../PortalContainer";

export const ActionBarPortalId = "action-bar-portal";

interface PropsType {
  show: boolean;
}

export const ActionBarPortalContainer: React.FC<PropsType> = ({ show }) => {
  return <Container id={ActionBarPortalId} show={show} />;
};

const Container = styled(PortalContainer)<{ show: boolean }>`
  display: flex;
  position: absolute;
  height: 56px;
  visibility: ${(p) => (p.show ? "visible" : "hidden")};
  max-width: 60%;
  bottom: ${(p) => (p.show ? "80px" : "-56px")};
  left: 0;
  right: 0;
  margin: auto;

  /* Animate slide in-out */
  transition: all 0.2s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
`;
