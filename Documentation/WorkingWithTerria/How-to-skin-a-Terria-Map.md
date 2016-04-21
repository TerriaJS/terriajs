## How to skin a Terria Map

After deploying and building, you will want to make some changes to make various labels and logos visually identify your project.

## index.js

Warning: this section is out of date!

```
var terria = new Terria({
    appName: 'My first TerriaMap',
    supportEmail: 'nospam@example.com',
```

`terria.appName` is used in many places, such as dialog prompts.

```
     BrandBarViewModel.create({
         container: ui,
         elements: [
            '<a target="_blank" href="about.html"><img src="images/NationalMap_Logo_RGB72dpi_REV_Blue text_BETA.png" height="50" alt="National Map" title="Version: ' + version + '" /></a>',
            '<a target="_blank" href="http://www.gov.au/"><img src="images/AG-Rvsd-Stacked-Press.png" height="45" alt="Australian Government" /></a>'
```

This controls the banner at the top of the left hand pane. The last item is right-aligned. Logos should generally go in `wwwroot/images`. Use `<span class="brand-bar-name">` for text without a logo.

`<title>My first Terria Map</title>`

##Catalog

1. Create a new catalog file, "myproject.json" in `wwwroot/init`
2. Modify config.json:

```
    "initializationUrls" : [
        "myproject"
    ],
```

##Styling

Add override styles to `index.less`.

##Build

Run `gulp watch` to continually rebuild in response to your changes.