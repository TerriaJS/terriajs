import Variables from "terriajs/lib/Sass/exports/_variables-export.scss";
import Mixins from "terriajs/lib/Styled/mixins";

export const terriaTheme = {
  ...Variables,
  ...Mixins
};

export type TerriaTheme = typeof terriaTheme;
