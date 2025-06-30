import debounce from "lodash-es/debounce";
import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef
} from "react";
import { forwardRef } from "react";
import styled, { useTheme } from "styled-components";
import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Text from "../../Styled/Text";

const SearchInput = styled.input<{ rounded?: boolean }>`
  box-sizing: border-box;
  margin-top: 0;
  margin-bottom: 0;
  border: none;
  border-radius: 4px;
  height: 40px;
  width: 100%;
  display: block;
  padding: 0.5rem 40px;
  vertical-align: middle;
  -webkit-appearance: none;
`;

export const DEBOUNCE_INTERVAL = 1000;

interface SearchBoxProps {
  onSearchTextChanged: (text: string) => void;
  onDoSearch: () => void;
  searchText: string;
  onFocus?: () => void;
  placeholder?: string;
  onClear?: () => void;
  alwaysShowClear?: boolean;
  debounceDuration?: number;
  supportsAutocomplete?: boolean;
  autoFocus?: boolean;
  inputBoxRef?: React.Ref<HTMLInputElement>;
}

/**
 * Simple dumb search box component that leaves the actual execution of searches to the component that renders it. Note
 * that just like an input, this calls onSearchTextChanged when the value is changed, and expects that its parent
 * component will listen for this and update searchText with the new value.
 */
export const SearchBox: React.FC<SearchBoxProps> = ({
  onSearchTextChanged,
  onDoSearch,
  searchText,
  onFocus,
  placeholder = "Search",
  onClear,
  alwaysShowClear = false,
  debounceDuration,
  autoFocus = false,
  supportsAutocomplete = true,
  inputBoxRef
}) => {
  const theme = useTheme();
  const debouncedOnDoSearch = useRef<ReturnType<typeof debounce>>();

  useEffect(() => {
    const debounced = debounce(
      () => onDoSearch(),
      debounceDuration ?? DEBOUNCE_INTERVAL
    );
    debouncedOnDoSearch.current = debounced;

    return () => {
      debounced.flush();
    };
  }, [onDoSearch, debounceDuration]);

  useEffect(() => {
    return () => debouncedOnDoSearch.current?.cancel();
  }, []);

  const search = useCallback(() => {
    debouncedOnDoSearch.current?.cancel();
    onDoSearch();
  }, [onDoSearch]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // immediately bypass debounce if we started with no value
    onSearchTextChanged(value);
    if (!supportsAutocomplete) return;

    if (searchText.length === 0) {
      search();
    } else {
      debouncedOnDoSearch.current?.();
    }
  };

  const clearSearch = () => {
    onSearchTextChanged("");
    search();

    if (onClear) {
      onClear();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      search();
    }
  };

  const hasValue = searchText.length > 0;

  return (
    <form
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        search();
      }}
      css={`
        position: relative;
        width: 100%;
      `}
    >
      <label
        htmlFor="search"
        css={`
          position: absolute;
        `}
      >
        <Box paddedRatio={2}>
          {/* Without position:absolute the icon runs away from the search bar in safari. Ideally we should redo the search bar using simple flexbox */}
          <StyledIcon
            glyph={Icon.GLYPHS.search}
            styledWidth={"20px"}
            fillColor={theme.charcoalGrey}
            opacity={0.5}
            css={`
              position: absolute;
            `}
          />
        </Box>
      </label>
      <Text large semiBold>
        <SearchInput
          ref={inputBoxRef}
          id="search"
          type="text"
          name="search"
          value={searchText}
          onChange={handleChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          rounded
        />
      </Text>
      {(alwaysShowClear || hasValue) && (
        <Box position="absolute" topRight fullHeight styledWidth={"40px"}>
          {/* The type="button" here stops the browser from assuming the close button is the submit button */}
          <RawButton
            type="button"
            onClick={clearSearch}
            fullWidth
            fullHeight
            aria-label="Clear search"
          >
            <BoxSpan centered>
              <StyledIcon
                glyph={Icon.GLYPHS.close}
                styledWidth={"15px"}
                fillColor={theme.charcoalGrey}
                opacity={0.5}
              />
            </BoxSpan>
          </RawButton>
        </Box>
      )}
    </form>
  );
};

type WrappedSearchBoxProps = Omit<SearchBoxProps, "inputBoxRef">;

const SearchBoxWithRef = (
  props: WrappedSearchBoxProps,
  ref: React.Ref<HTMLInputElement>
) => <SearchBox {...props} inputBoxRef={ref} />;

export default forwardRef(SearchBoxWithRef);
