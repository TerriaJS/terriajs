## TerriaJS Contributor's Guide


All code modifications should be made via GitHub pull requests.  Please do not commit code directly to `master`, even if GitHub allows you to do so.  Pull requests may be merged by anyone with commit access to the repo and who feels qualified to review the changes.  Developers should not merge their own pull requests.

Before merging a pull request:
* Verify the code builds successfully and there are no jshint warnings (run `gulp`).
* Check basic functionality of the map, such as enabling data sources in both 2D and 3D.
* Verify that all specs pass.  If anything you did might be browser-dependent, you should run the specs in all the major supported browsers.
* Review the code itself for quality of implementation and consistency with coding conventions.  Until we have our own coding conventions, we can [use Cesium's](https://github.com/AnalyticalGraphicsInc/cesium/wiki/JavaScript-Coding-Conventions).

Reviewers are welcome to make minor edits to a pull request (e.g. fixing typos) before merging it.  If a reviewer makes larger changes, someone else - maybe the original author of the pull request - should take a look at the changes before the entire pull request is merged.

After you merge a pull request, delete the associated branch if you can.  You will see an option for this on the GitHub pull request page.
