import { CalendarDate } from "@internationalized/date";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Breadcrumbs } from "../../primitives/Breadcrumbs";
import { Calendar } from "../../primitives/Calendar";
import { CloseButton } from "../../primitives/CloseButton";
import { LocalizedStringsProvider, type LocalizedStrings } from "..";

const FRENCH: LocalizedStrings = { fr: { "closeButton.label": "Fermer" } };

describe("LocalizedStringsProvider", () => {
  it("translates the components' strings into the app's locale", async () => {
    const screen = await render(
      <I18nProvider locale="fr-FR">
        <LocalizedStringsProvider value={FRENCH}>
          <CloseButton />
        </LocalizedStringsProvider>
      </I18nProvider>
    );

    await expect
      .element(screen.getByRole("button", { name: "Fermer" }))
      .toBeVisible();
  });

  it("keeps in English what the app hasn't translated", async () => {
    const screen = await render(
      <I18nProvider locale="fr-FR">
        <LocalizedStringsProvider value={FRENCH}>
          <Breadcrumbs>
            <Breadcrumbs.Item>Home</Breadcrumbs.Item>
          </Breadcrumbs>
        </LocalizedStringsProvider>
      </I18nProvider>
    );

    await expect
      .element(screen.getByRole("navigation", { name: "Breadcrumbs" }))
      .toBeVisible();
  });

  it("is English in a locale the app has no strings for", async () => {
    const screen = await render(
      <I18nProvider locale="de-DE">
        <LocalizedStringsProvider value={FRENCH}>
          <CloseButton />
        </LocalizedStringsProvider>
      </I18nProvider>
    );

    await expect
      .element(screen.getByRole("button", { name: "Close" }))
      .toBeVisible();
  });

  it("serves a locale the strings of another in its language", async () => {
    const screen = await render(
      <I18nProvider locale="fr-CA">
        <LocalizedStringsProvider
          value={{ "fr-FR": { "closeButton.label": "Fermer" } }}
        >
          <CloseButton />
        </LocalizedStringsProvider>
      </I18nProvider>
    );

    await expect
      .element(screen.getByRole("button", { name: "Fermer" }))
      .toBeVisible();
  });

  // Chinese is written in two scripts; a locale's region or script says
  // which, and the strings in the other one aren't the ones it reads
  it.each([
    ["zh-HK", { "zh-CN": "关闭", "zh-TW": "關閉" }],
    ["zh-Hant-TW", { "zh-Hans": "关闭", "zh-Hant": "關閉" }],
    ["zh-TW", { "zh-Hans": "关闭", "zh-Hant": "關閉" }]
  ])("serves %s the strings in its own script", async (locale, labels) => {
    const strings: LocalizedStrings = Object.fromEntries(
      Object.entries(labels).map(([key, label]) => [
        key,
        { "closeButton.label": label }
      ])
    );
    const screen = await render(
      <I18nProvider locale={locale}>
        <LocalizedStringsProvider value={strings}>
          <CloseButton />
        </LocalizedStringsProvider>
      </I18nProvider>
    );

    await expect
      .element(screen.getByRole("button", { name: "關閉" }))
      .toBeVisible();
  });

  it("takes from its language what its region leaves out", async () => {
    const screen = await render(
      <I18nProvider locale="fr-CA">
        <LocalizedStringsProvider
          value={{
            fr: { "closeButton.label": "Fermer" },
            "fr-CA": { "tree.loading": "Chargement…" }
          }}
        >
          <CloseButton />
        </LocalizedStringsProvider>
      </I18nProvider>
    );

    await expect
      .element(screen.getByRole("button", { name: "Fermer" }))
      .toBeVisible();
  });

  it("builds a translated string from its values", async () => {
    const screen = await render(
      <I18nProvider locale="fr-FR">
        <LocalizedStringsProvider
          value={{
            fr: {
              "calendar.yearPicker": ({ monthYear }) =>
                `${String(monthYear)}, choisir l'année`
            }
          }}
        >
          <Calendar
            aria-label="Date"
            defaultFocusedValue={new CalendarDate(2025, 12, 16)}
          >
            <Calendar.Header>
              <Calendar.YearPickerTrigger>
                <Calendar.YearPickerTriggerHeading />
              </Calendar.YearPickerTrigger>
            </Calendar.Header>
          </Calendar>
        </LocalizedStringsProvider>
      </I18nProvider>
    );

    await expect
      .element(
        screen.getByRole("button", { name: "décembre 2025, choisir l'année" })
      )
      .toBeVisible();
  });

  it("gives way to a label passed in", async () => {
    const screen = await render(
      <I18nProvider locale="fr-FR">
        <LocalizedStringsProvider value={FRENCH}>
          <CloseButton aria-label="Fermer l'alerte" />
        </LocalizedStringsProvider>
      </I18nProvider>
    );

    await expect
      .element(screen.getByRole("button", { name: "Fermer l'alerte" }))
      .toBeVisible();
  });
});
