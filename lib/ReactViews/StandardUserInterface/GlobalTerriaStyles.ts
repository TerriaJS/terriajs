import { createGlobalStyle } from "styled-components";

export const GlobalTerriaStyles = createGlobalStyle`
body {
  font-family: ${(p) => p.theme.fontBase};

  *:focus {
    outline: 3px solid #C390F9;
  }
}

// Theme-ify sass classes until they are removed

// We override the primary, secondary, map and share buttons here as they
// are imported everywhere and used in various ways - until we remove sass
// this is the quickest way to tackle them for now
.tjs-_buttons__btn--map {
  ${(p) => p.theme.addTerriaMapBtnStyles(p)}
}

.tjs-_buttons__btn-primary {
  ${(p) => p.theme.addTerriaPrimaryBtnStyles(p)}
}

.tjs-_buttons__btn--secondary,
.tjs-_buttons__btn--close-modal {
  ${(p) => p.theme.addTerriaSecondaryBtnStyles(p)}
}

.tjs-_buttons__btn--tertiary {
  ${(p) => p.theme.addTerriaTertiaryBtnStyles(p)}
}

.tjs-_buttons__btn-small:hover,
.tjs-_buttons__btn-small:focus {
  color: ${(p) => p.theme.colorPrimary};
}

.tjs-share-panel__catalog-share-inner {
  background: ${(p) => p.theme.greyLightest};
}

.tjs-share-panel__btn--catalogShare {
  color: ${(p) => p.theme.colorPrimary};
  background:transparent;
  svg {
    fill: ${(p) => p.theme.colorPrimary};
  }
}
.tjs-dropdown__btn--dropdown {
  color: ${(p) => p.theme.textDark};
  background: ${(p) => p.theme.textLight};
  &:hover,
  &:focus {
    color: ${(p) => p.theme.textDark};
    background: ${(p) => p.theme.textLight};
    border: 1px solid ${(p) => p.theme.colorPrimary};
  }
  svg {
    fill: ${(p) => p.theme.textDark};
  }
}
.tjs-dropdown__btn--option.tjs-dropdown__is-selected {
  color: ${(p) => p.theme.colorPrimary};
}

button {
  cursor: pointer;
}
`;
