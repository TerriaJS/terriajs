# Frontend style guide

TerriaJS currently uses React as the user interface framework. Some rough
guidelines are outlined below for the various parts of UI.

## MobX UI refactor

In the v8 branch we are in a transitory period of moving from css modules+sass
to styled-components to improve the theme-ability of TerriaJS.

Any new components should _only_ be using styled-components.

Any work to existing components should include an effort to remove sass from it.

The prop api for `lib/Styled/*.(t|j)sx` will be extremely unstable while we
figure out conventions that are suitable, feel free to suggest improvements or
examples of better ways 🙂

## React UI

### Global state vs local (hook / react-class-component / mobx-observable) state

The majority of the "global UI state" is located in
`lib/ReactViewModels/ViewState.ts`, however throughout the development of
version 8 you may notice things like `setState()` being used on components if
you are converting them from class components. You may be wondering if this
state is more suitable to be stored on ViewState. The answer is usually yes, and
frame the question of "can I control the entirety of essential UI state with
`ViewState` actions alone?" to think about whether this state needs to be set or
used from other parts of the UI.

A really basic example would be an extremely local state item like a hover state
of a tooltip, where it doesn't necessarily need to be known to the rest of the
app (until it does). So don't feel everything needs to be in `ViewState.ts`,
however for these cases you may benefit from the simplicity & ease of the
`useState()` hook & pattern in your functional components, rather than setting
up a class component purely to use local-component-mobx-state.

### Always use actions

For ViewState changes, avoid inlining `runInAction` & ensure any state changes
are encapsulated in an action, e.g. rather than:

```ts
runInAction(() => {
    this.props.viewState.selectedHelpMenuItem = this.props.content.itemName;
    this.props.viewState.helpPanelExpanded = true;
});
```

An action on `ViewState.ts` and calling that action.

```ts
// ViewState.ts
@action
selectHelpMenuItem(key: string) {
  this.selectedHelpMenuItem = key;
  this.helpPanelExpanded = true;
}

// Component.tsx
this.props.viewState.selectHelpMenuItem(this.props.content.itemName);
```

This additional level of abstraction means we get to more freely refactor what
`selectHelpMenuItem` does, not having to trace down every use of it across the
app but also the ability to compose actions that call a group of actions
together.

### When to use a class or function component

The React ecosystem at large heavily utilises composition, but at our model
(read: catalog items) layer we quite heavily use inheritance. For the React
layer, we will favour the use of composition, and with the introduction of
hooks, having more functional components at the UI layer makes most sense. Write
your components as function components.

### HOCs & Hooks

#### HOCs

Higher order components (HOCs) are often used across the codebase. Usually you
do not need to think about the order these are applied in. However there is one
case across terriajs - when using `react-anything-sortable` `sortable` that you
should be aware of. The <Sortable /> component expects each child to be
something wrapped with `sortable`, when you add a HOC over that, you will break
the sorting functionality - to avoid breakage, simply ensure `sortable` is the
outermost HOC.

Finally, when writing a new HOC, consider whether it would be better suited as a
hook - one of the strength of HOCs lie in the ability to apply it to any
component.

#### Hooks

React hooks are often used across the codebase to reuse functionality, and gives
us many of the benefits of HOCs without further deepening the component tree.
The most frequent problem you will run into when utilising hooks, is that they
are incompatible with React class components. This will incentivise us to both
write components as functional components, as well as convert existing class
components to them when suitable. However if you really must use hooks with a
class component, wrap the class component with a functional component and add
the hook there. All hook names should be prefixed with the word `use` so that
React can perform checks on the use of them, e.g. `useWindowSize` or
`useRefForTerria`.

Finally, when writing new hooks, consider if they would be better suited as a
HOC. Hooks need to be consumed within a component rather than wrapping a
component, but is one of its own strengths with you being able to be more
declarative about the dependencies of a component.

### Error Boundaries

Some of our `TerriaMap`s utilise https://reactjs.org/docs/error-boundaries.html
as a way of better handling UI errors, we have not yet added this to TerriaJS.
If you think of good spots to insert these for `terriajs`, please submit a
contribution!

### Testing

Try to add tests for all components, even a basic "it renders" test as seen in
`test/ReactViews/Map/Navigation/Compass/CompassSpec.tsx` can help catch runtime
errors. Some slightly longer, but still in the spirit of "it renders", can be
seen in tests like `test/ReactViews/ShortReportSpec.tsx` &
`test/ReactViews/Search/SearchBoxAndResultsSpec.tsx`.
Some UI-related tests not involving rendering can be seen at
`test/Models/parseCustomMarkdownToReactTsSpec.ts`

### Internationalisation (Internationalization / i18n)

Any strings within the application should be through a translation file - a base
English one is used under `lib/Language/en/translation.json`.

For the most part, simple strings should go through fine by calling
`i18next.t()`. There are a few notable cases where this can get tricky:

1. When loading an object (array) from translation. For example, `"aliases": "helpContentTerm1.aliases"` mapping to an array in the translation file, to
   keep things in one place when loading strings straight from config.json or
   overridden in translation overrides

2. When loading really long strings, they can get truncated, e.g. `markdown`
   striaght into `i18next.t()` will result in losing some markdown inside the
   string

## TypeScript

TypeScript should be the default choice when writing components. Lean towards
`tsx` when writing React components, with the following caveats:

-   The majority of the `lib/Styled` components are not yet `tsx`, these will need
    to be (tsx-ified!) or imported via CommonJS to consume them, e.g.

```ts
const Box: any = require("../../../Styled/Box").default;
```

or

```ts
const BoxSpan: any = require("../../../Styled/Box").BoxSpan;
```

-   When rapididly prototyping a UI, you may find it quicker to do this in jsx
    then tsxifying when you know what the final look is. You may want to consider
    still having some typed benefits by using logic in TypeScript (either through
    a wrapper `tsx`, or some `ts` helpers) to aid in the process.

Components written in TypeScript will not need `PropTypes` defined on them, as
type errors on props will be caught at compilation rather than a runtime check.
