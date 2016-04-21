We love pull requests.  We strive to promptly review them, provide feedback, and merge.  

A pull request MUST:

- pass all tests
- pass lint
- follow code style (4-space indents, maximum semicolons, single-quoted strings etc)
- update CHANGES.md (add a new version at the top if needed)
- be submitted by someone who has signed the [Contributor Licence Agreement](cla-assistant.io/TerriaJS/terria).
- be a named branch (not master) which merges cleanly with master

It SHOULD:

- add new tests
- address an issue in the issue tracker
- have JS-doc comments for public functions 

Consider also:

- adding test data into wwwroot/test that demonstrates new or improved features

### How we do pull requests

All code modifications should be made via GitHub pull requests.  Please do not commit code directly to `master`, even if GitHub allows you to do so.  Pull requests may be merged by anyone with commit access to the repo and who feels qualified to review the changes.  Developers should not merge their own pull requests.

Before merging a pull request:
* Verify the code builds successfully and there are no jshint warnings (run `gulp`).
* Check basic functionality of the map, such as enabling data sources in both 2D and 3D.
* Verify that all specs pass.  If anything you did might be browser-dependent, you should run the specs in all the major supported browsers.
* Review the code itself for quality of implementation and consistency with coding conventions.  Until we have our own coding conventions, we can [use Cesium's](https://github.com/AnalyticalGraphicsInc/cesium/wiki/JavaScript-Coding-Conventions).

Reviewers are welcome to make minor edits to a pull request (e.g. fixing typos) before merging it.  If a reviewer makes larger changes, someone else - maybe the original author of the pull request - should take a look at the changes before the entire pull request is merged.

After you merge a pull request, delete the associated branch if you can.  You will see an option for this on the GitHub pull request page.


More information in the [Contributor's Guide](Documentation/Contributors)

## License

We use the [Apache 2.0 License](LICENSE.md).  Before we can merge a pull request, we require a signed Contributor License Agreement (CLA).  The CLA ensures you retain copyright to your contributions, and we have the right to use them and incorporate them into TerriaJS.  You can read and sign the CLA here: https://cla-assistant.io/TerriaJS/terriajs.
