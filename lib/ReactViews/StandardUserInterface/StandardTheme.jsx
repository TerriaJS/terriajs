import Variables from "style-loader!css-loader!sass-loader!../../Sass/common/_variables-export.scss";

import Mixins from "../../Styled/mixins";

export const terriaTheme = {
  ...Variables,
  ...Mixins
};
