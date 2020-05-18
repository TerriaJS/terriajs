import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import debounce from "lodash-es/debounce";
import Icon from "../Icon";
import styled, { withTheme } from "styled-components";
import Text from "../../Styled/Text";
import Styles from "./search-box.scss";

const SearchInput = styled.input`
  box-sizing: border-box;
  margin-top: 0;
  margin-bottom: 0;
  border-style: solid;
  border-width: 1px;
  border-color: ${props => props.theme.greyLighter};
  border-radius: 20px;
  height: 40px;
  width: 100%;
  color: $text-dark;
  display: block;
  padding: 0.5rem 0.5rem;
  vertical-align: middle;
  -webkit-appearance: none;
`;

export const DEBOUNCE_INTERVAL = 1000;

/**
 * Simple dumb search box component that leaves the actual execution of searches to the component that renders it. Note
 * that just like an input, this calls onSearchTextChanged when the value is changed, and expects that its parent
 * component will listen for this and update searchText with the new value.
 */
export const SearchBox = createReactClass({
  displayName: "SearchBox",
  propTypes: {
    /** Called when the search changes, after a debounce of {@link DEBOUNCE_INTERVAL} ms */
    onSearchTextChanged: PropTypes.func.isRequired,
    /** Called when an actual search is triggered, either by clicking the button or pressing Enter */
    onDoSearch: PropTypes.func.isRequired,
    /** The search text to display in the search box */
    searchText: PropTypes.string.isRequired,
    /** Called when the search box receives focus */
    onFocus: PropTypes.func,

    placeholder: PropTypes.string,
    onClear: PropTypes.func,
    alwaysShowClear: PropTypes.bool,
    debounceDuration: PropTypes.number,
    inputBoxRef: PropTypes.object,
    autoFocus: PropTypes.bool,
    theme: PropTypes.object
  },

  getDefaultProps() {
    return {
      placeholder: "Search",
      alwaysShowClear: false,
      autoFocus: false
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.searchWithDebounce = debounce(this.search, DEBOUNCE_INTERVAL);
  },

  componentDidUpdate(prevProps) {
    if (
      prevProps.debounceDuration !== this.props.debounceDuration &&
      this.props.debounceDuration > 0
    ) {
      this.removeDebounce();
      this.searchWithDebounce = debounce(
        this.search,
        this.props.debounceDuration
      );
    }
  },

  componentWillUnmount() {
    this.removeDebounce();
  },

  hasValue() {
    return this.props.searchText.length > 0;
  },

  search() {
    this.removeDebounce();
    this.props.onDoSearch();
  },

  removeDebounce() {
    this.searchWithDebounce.cancel();
  },

  handleChange(event) {
    const value = event.target.value;
    // immediately bypass debounce if we started with no value
    if (this.props.searchText.length === 0) {
      this.props.onSearchTextChanged(value);
      this.search();
    } else {
      this.props.onSearchTextChanged(value);
      this.searchWithDebounce();
    }
  },

  clearSearch() {
    this.props.onSearchTextChanged("");
    this.search();

    if (this.props.onClear) {
      this.props.onClear();
    }
  },

  onKeyDown(event) {
    if (event.keyCode === 13) {
      this.search();
    }
  },

  render() {
    console.log(this.props.theme);
    const clearButton = (
      <button
        type="button"
        className={Styles.searchClear}
        onClick={this.clearSearch}
      >
        <Icon glyph={Icon.GLYPHS.close} />
      </button>
    );

    return (
      <Text large fullWidth>
        <form
          autoComplete="off"
          onSubmit={event => event.preventDefault()}
          css={`
            position: relative;
            width: 100%;
          `}
        >
          <label htmlFor="search" className={Styles.formLabel}>
            <Icon glyph={Icon.GLYPHS.search} />
          </label>
          <SearchInput
            ref={this.props.inputBoxRef}
            id="search"
            type="text"
            name="search"
            value={this.props.searchText}
            onChange={this.handleChange}
            onFocus={this.props.onFocus}
            onKeyDown={this.onKeyDown}
            // className={Styles.searchField}
            placeholder={this.props.placeholder}
            autoComplete="off"
            autoFocus={this.props.autoFocus}
            rounded
            // css={`
            //   border-radius: 20px;
            //   background-color: ${this.props.theme.textDarker};
            //   color: ${this.props.theme.greyLightest};
            // `}
          />
          {(this.props.alwaysShowClear || this.hasValue()) && clearButton}
        </form>
      </Text>
    );
  }
});

const SearchBoxWithRef = (props, ref) => (
  <SearchBox {...props} inputBoxRef={ref} />
);

export default withTheme(React.forwardRef(SearchBoxWithRef));
