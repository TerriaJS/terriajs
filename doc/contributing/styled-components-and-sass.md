# MobX UI refactor
In the mobx branch we are in a transitory period of moving from css modules+sass to styled-components to improve the theme-ability of TerriaJS.

Any new components should _only_ be using styled-components.

Any work to existing components should include an effort to remove sass from it.

The prop api for `lib/Styled/*.(t|j)sx` will be extremely unstable while we figure out conventions that are suitable, feel free to suggest improvements or examples of better ways 🙂