import i18next from "i18next";
import { applyTranslationIfExists } from "../Language/languageHelpers";
import { Term } from "../ReactViewModels/defaultTerms";

const findFirstTerm = (
  text: string,
  terms: Map<string, Term>,
  fromIndex: number
) => {
  let termIndex = Infinity;
  let termLength = 0;
  let termToReplace: string | undefined;
  let ignore = false;

  terms.forEach((_, term) => {
    const foundIndex = text.toLowerCase().indexOf(
      applyTranslationIfExists(term, i18next).toLowerCase(), // TODO: remove use of global i18next, and use i18n from react-i18next instead
      fromIndex
    );
    if (
      foundIndex !== -1 &&
      (foundIndex < termIndex ||
        (foundIndex <= termIndex && term.length > termLength))
    ) {
      const nextOpeningBrace = text.toLowerCase().indexOf("[", foundIndex);
      const nextClosingBrace = text.toLowerCase().indexOf("]", foundIndex);
      const hasNextClosingBrace = nextClosingBrace !== -1;
      const nextBracesAreClosedLink =
        nextOpeningBrace !== -1 &&
        hasNextClosingBrace &&
        nextOpeningBrace < nextClosingBrace;
      const inLinkLabel = hasNextClosingBrace && !nextBracesAreClosedLink;

      const nextOpeningParen = text.toLowerCase().indexOf("(", foundIndex);
      const nextClosingParen = text.toLowerCase().indexOf(")", foundIndex);
      const hasNextClosingParen = nextClosingParen !== -1;
      const nextParensAreClosedLink =
        nextOpeningParen !== -1 &&
        hasNextClosingParen &&
        nextOpeningParen < nextClosingParen;
      const inLinkHref = hasNextClosingParen && !nextParensAreClosedLink;

      const nextOpeningATag = text.toLowerCase().indexOf("<a ", foundIndex);
      const nextClosingATag = text.toLowerCase().indexOf("</a>", foundIndex);
      const hasNextClosingATag = nextClosingATag !== -1;
      const nextTagIsClosing =
        nextOpeningATag !== -1 &&
        hasNextClosingATag &&
        nextOpeningATag < nextClosingATag;
      const inAhref = hasNextClosingATag && !nextTagIsClosing;

      const lastNewLine = text.toLowerCase().lastIndexOf("\n", foundIndex);
      const hasLastNewLine = lastNewLine !== -1;
      const lastNewLineIsHeading = text[lastNewLine + 1] === "#";
      // Some help content will have headings on the very first line,
      // so if we've found a term in the middle of a heading, we'll be
      // parsing the very first line
      const firstLineIsHeading = !hasLastNewLine && text[0] === "#";
      const inHeading =
        (hasLastNewLine && lastNewLineIsHeading) || firstLineIsHeading;

      ignore = inLinkLabel || inLinkHref || inHeading || inAhref;
      termIndex = foundIndex;
      termLength = term.length;
      termToReplace = text.substr(foundIndex, term.length);
    }
  });

  return { termToReplace, termIndex, ignore };
};

const injectTerms = (string: string, termDictionary: Term[]): string => {
  let injectIndex = 0;
  const injectedBoldSet = new Set();
  while (1) {
    let tooltipTerms = new Map<string, Term>();

    termDictionary.forEach((item: any) =>
      tooltipTerms.set(
        applyTranslationIfExists(item.term, i18next).toLowerCase(),
        item
      )
    );
    // some help content things will have aliases / variants

    termDictionary.forEach((term) => {
      const termAliases = term.aliases;
      if (!termAliases) {
        return;
      }
      const addAliasesToTooltipTerms = (aliases: string[]) =>
        aliases.forEach((alias) => {
          tooltipTerms.set(alias.toLowerCase(), term);
        });
      if (Array.isArray(termAliases)) {
        /**
         * If provided an array of terms, we'll assume direct from config.json
         *
         * e.g. `termAliases` is ["data set", "data sets", "datasets"]
         */
        addAliasesToTooltipTerms(termAliases);
      } else if (i18next.exists(termAliases)) {
        /**
         * If provided a string, try and translate it - if it returns an array
         * we can add those to the term dictionary
         *
         * e.g. `termAliases` is `helpContentTerm1.aliases`
         * then `i18next.t()` resolves to ["data set", "data sets", "datasets"]
         *
         * Otherwise if `termAliases` is a simple string "data set" do not try
         * and add a single string as plain strings should be provided in an
         * array
         */
        const translated = i18next.t(termAliases, { returnObjects: true });
        if (
          Array.isArray(translated) &&
          translated.every((item) => typeof item === "string")
        ) {
          addAliasesToTooltipTerms(translated);
        }
      }
    });
    const { termIndex, termToReplace, ignore } = findFirstTerm(
      string,
      tooltipTerms,
      injectIndex
    );
    if (
      termToReplace !== undefined &&
      !ignore &&
      !injectedBoldSet.has(termToReplace.toLowerCase())
    ) {
      const currentText = string;
      const termObj = tooltipTerms.get(termToReplace.toLowerCase());
      const description = termObj
        ? applyTranslationIfExists(termObj.content, i18next)
        : i18next.t("term.missingContent");
      // const injectedLink = `**${termToReplace}**`;
      const injectedLink = `<terriatooltip title="${termToReplace}">${description}</terriatooltip>`;
      string = currentText.substring(0, termIndex);
      string += injectedLink;
      string += currentText.substring(termIndex + termToReplace.length);
      injectIndex = termIndex + injectedLink.length;
      injectedBoldSet.add(termToReplace.toLowerCase());
    } else if (
      (termToReplace && ignore) ||
      (termToReplace &&
        !ignore &&
        injectedBoldSet.has(termToReplace.toLowerCase()))
    ) {
      injectIndex = termIndex + termToReplace.length;
    } else {
      break;
    }
  }
  return string;
};

export default injectTerms;
