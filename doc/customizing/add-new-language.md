TerriaJS supports localization using [i18next framework](https://www.i18next.com/) with two available languages by default, English and Arabic. But any **Left-to-Right (LTR)** or **Right-to-Left (RTL)** language can be added.

If you want to add another language, you may follow the following steps:

1. Check the list of popular [languages with their codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) to find the code of the language that you want to add.
2. Add the language to the `languages.js` file located at `lib/Language` directory. Like that:
```
export const LANGUAGES = [
  {
    id: 1,
    title: "English",
    code: "en"
  },
  {
    id: 2,
    title: "Arabic",
    code: "ar"
  },
];
```
3. Prepare the translation file that contains the objects that should be translated. For instance, you can find [one file](https://github.com/TerriaJS/terriajs/blob/master/lib/Language/en/translation.json) for each available language in the directory `lib/Language`. So, create a folder with the name of the language then inside it, create the translation file as JSON and add the appropriate translations according to the language.
4. After creating the translation file, import it inside the [`i18n.js`](https://github.com/TerriaJS/terriajs/blob/master/lib/Models/i18n.js) file located at `lib/Models`. Then, add it to the `resources` object like that:
```
import translationEN from "../Language/en/translation.json";
import translationAR from "../Language/ar/translation.json";

const resources = {
  en: {
    translation: translationEN
  },
  ar: {
    translation: translationAR
  }
};
```
5. Rebuild the app after the previous changes with:

```bash
npm run gulp
```

Now, if you start up the app, you should see the language is added successfully and can be selected easily.
