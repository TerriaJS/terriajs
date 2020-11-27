import React from "react";
import MediaQuery from "react-responsive";
import PropTypes from "prop-types";

// This should come from some config some where
const small = 480;
const medium = 768;
const large = 992;

export function ExtraSmall(props) {
  return <MediaQuery maxWidth={small}>{props.children}</MediaQuery>;
}

export function Small(props) {
  return <MediaQuery maxWidth={small - 1}>{props.children}</MediaQuery>;
}

export function Medium(props) {
  return <MediaQuery minWidth={small}>{props.children}</MediaQuery>;
}

export function Large(props) {
  return <MediaQuery minWidth={medium}>{props.children}</MediaQuery>;
}

export function ExtraLarge(props) {
  return <MediaQuery minWidth={large}>{props.children}</MediaQuery>;
}

ExtraSmall.propTypes = {
  children: PropTypes.element
};
Small.propTypes = {
  children: PropTypes.element
};
Medium.propTypes = {
  children: PropTypes.element
};
Large.propTypes = {
  children: PropTypes.element
};
ExtraLarge.propTypes = {
  children: PropTypes.element
};
