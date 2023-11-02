## Contributing to TerriaJS

Thank you for getting involved with TerriaJS! We love pull requests. We strive to promptly review them, provide feedback, and merge.

A pull request MUST:

- pass all tests
- pass lint
- follow code style (4-space indents, maximum semicolons, single-quoted strings etc)
- update CHANGES.md (add a new version at the top if needed)
- be submitted by someone who has signed the [Contributor Licence Agreement](https://cla-assistant.io/TerriaJS/terriajs).
- be a named branch (not master) which merges cleanly with master

It SHOULD:

- be as small in scope as possible. Tightly defined enhancements or fixes are much quicker to review than wide-ranging slabs of code out of nowhere.
- add new tests
- address an issue in the issue tracker
- have JS-doc comments for public functions

It SHOULD NOT:

- bring in new libraries without discussion first
- change the version number in package.json

Consider also:

- adding test data into wwwroot/test that demonstrates new or improved features

### How we do pull requests

The three key rules:

1. All code modifications MUST be made via GitHub pull requests. No one ever commits directly to `master`.
2. Every pull request be reviewed by another developer with commit access to the repo. They will either merge it, or provide feedback on issues to be addressed. They may add additional commits to the pull request.
3. Developers should not merge their own pull requests except in unusual circumstances.

Please get involved in code review. It's a great way to expand your knowledge of the code base. Before merging a pull request:

- Verify the code builds successfully and there are no lint warnings (run `gulp`).
- Check basic functionality of the map, such as enabling data sources in both 2D and 3D.
- Verify that all specs pass. If anything you did might be browser-dependent, you should run the specs in all the major supported browsers.
- Review the code itself for quality of implementation and consistency with coding conventions. Until we have our own coding conventions, we can [use Cesium's](https://github.com/AnalyticalGraphicsInc/cesium/wiki/JavaScript-Coding-Conventions).

Reviewers are welcome to make minor edits to a pull request (e.g. fixing typos) before merging it. If a reviewer makes larger changes, someone else - maybe the original author of the pull request - should take a look at the changes before the entire pull request is merged.

After you merge a pull request, delete the associated branch if you can. You will see an option for this on the GitHub pull request page.

More information in the [Contributor's Guide](https://terria.io/Documentation/guide/contributing/)

## License

We use the [Apache 2.0 License](LICENSE.md). Before we can merge a pull request, we require a signed Contributor License Agreement (CLA). The CLA ensures you retain copyright to your contributions, and we have the right to use them and incorporate them into TerriaJS. You can read and sign the CLA here: https://cla-assistant.io/TerriaJS/terriajs.
