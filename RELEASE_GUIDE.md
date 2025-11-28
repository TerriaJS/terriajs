# Release guide

## Publishing TerriaJS

### From `main` using GitHub Actions (preferred method):

- Checkout and pull `main` branch of `terriajs`, run `yarn install` if necessary.
- Bump the version number in `package.json`.
- Review and edit CHANGES.md.
  - Ensure that entries for new changes are written in the right section by diffing against the last version. Make sure the section name matches the version you set in `package.json` above.
  - e.g. `git diff 8.2.25 HEAD -- CHANGES.md` (where `8.2.25` is the previous published version)
  - Or using GitHub web interface https://github.com/TerriaJS/terriajs/compare/8.2.25...main (change the version and master/next to match the previous release and branch)
  - Finalise the heading of the version to be released with version number and date.
  - Add a heading above for upcoming changes to be documented under.
- Update code attibutions using `yarn gulp code-attribution`
- Commit and push your changes on a branch and make a PR to `main` branch.
- Get someone to review and merge the PR.
- Wait for slack notification of successful/failed publish.
- 😄

### Publishing to npm without the GitHub Action (not for standard releases):

This method should not be used to publish versions at the tip of `main` or another branch that is often used for releases. To publish a new version of TerriaJS to npm with this method, you'll need to be listed as a collaborator [here](https://www.npmjs.com/package/terriajs). Existing collaborators can add new ones. Then:

- Checkout and pull the branch of `terriajs` to be deployed, run `yarn install` if necessary.
- Bump the version number in `package.json`. Follow [semver](http://semver.org/).
- Appropriately update CHANGES.md, ensuring that changes are listed in their correct sections.
- Commit and push your changes and make a PR to the branch to be deployed.
- Get someone to review and merge the PR.
- Fetch and checkout the merge commit made by merging the PR.
- `rm -rf wwwroot/build`
- Make sure you don't have any changes in your working directory.
- `gulp lint release`
- `npm publish --tag your-tag` (for a release not at the tip of `main` a tag must be set, and it must not be `latest` or `next`. For releases on old versions you could use e.g. 6-5-x or 6-x-x as a tag, for upcoming features a short name could be used)
- Ensure that CHANGES.md on `main` is also updated to list the release and clearly note the nature and reason for release.

The above will publish a new version to npm and also tag that version on GitHub.
