# d2l-my-courses-ui

The UI for the My Courses homepage widget in the LE.

![widget view](/images/widget.png?raw=true)

## Building

Install dependencies via NPM:
```shell
npm install
```

Install the Polymer client globally if you haven't already:
```shell
npm i -g polymer-cli
```

## Local Development

### Using the demo pages

For simple changes like layout adjustments, you may be able to use the demo pages.  They have fake data setup, but do not have functionality like pinning, filtering, sorting, etc.

To host the demo pages, run:
```shell
polymer serve
```
Then navigate to `http://localhost:<port>/components/d2l-my-courses/demo/`.

### Testing from within the LMS

To test your changes in the LMS, you'll need to host a local BSI (`brightspace-integration`):
1. [Running a Local BSI](https://github.com/Brightspace/brightspace-integration#development-build)
2. [Configuring the LMS](https://github.com/Brightspace/brightspace-integration#using-the-configuration-file)

After completing the steps above, you can modify the files in BSI's `node_modules/d2l-my-courses` folder directly, or setup npm linking.  Changes to the files are picked up immediately, so no need to restart BSI each time - just refresh the browser.

### Testing with LMS data in the demo pages

Another option is to use the demo pages, but pull in real data from the LMS to allow for pinning, filtering, etc.

You can do this by visiting a quad site with the user whose course setup you'd like to test with, and inspecting the `d2l-my-courses` web component in the browser.  You can copy over the attributes to the component in `demo/d2l-my-courses/d2l-my-courses.html`, and grab a token from a HM network call.  You'll need to remove the code that cancels the PUT call, and replace the token when it expires.

## Unit Tests

The unit tests are built and run using [web-component-tester](https://github.com/Polymer/web-component-tester).

To lint and run unit tests, run:

```shell
npm test
```

You can also see the tests run in a browser by running:
```shell
polymer serve
```
Then navigate to `http://localhost:<port>/components/d2l-my-courses/test/index.all.html`.

## Performance Timings

For details on the performance profile of my-courses and the various timings which are collected, see [Performance Timings](performance-timing.md).

## Versioning & Releasing

> TL;DR: Commits prefixed with `fix:` and `feat:` will trigger patch and minor releases when merged to `master`. Read on for more details...

The [sematic-release GitHub Action](https://github.com/BrightspaceUI/actions/tree/master/semantic-release) is called from the `release.yml` GitHub Action workflow to handle version changes and releasing.

### Version Changes

All version changes should obey [semantic versioning](https://semver.org/) rules:
1. **MAJOR** version when you make incompatible API changes,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

The next version number will be determined from the commit messages since the previous release. Our semantic-release configuration uses the [Angular convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) when analyzing commits:
* Commits which are prefixed with `fix:` or `perf:` will trigger a `patch` release. Example: `fix: validate input before using`
* Commits which are prefixed with `feat:` will trigger a `minor` release. Example: `feat: add toggle() method`
* To trigger a MAJOR release, include `BREAKING CHANGE:` with a space or two newlines in the footer of the commit message
* Other suggested prefixes which will **NOT** trigger a release: `build:`, `ci:`, `docs:`, `style:`, `refactor:` and `test:`. Example: `docs: adding README for new component`

To revert a change, add the `revert:` prefix to the original commit message. This will cause the reverted change to be omitted from the release notes. Example: `revert: fix: validate input before using`.

### Releases

When a release is triggered, it will:
* Update the version in `package.json`
* Tag the commit
* Create a GitHub release (including release notes)

### Releasing from Maintenance Branches

Occasionally you'll want to backport a feature or bug fix to an older release. `semantic-release` refers to these as [maintenance branches](https://semantic-release.gitbook.io/semantic-release/usage/workflow-configuration#maintenance-branches).

Maintenance branch names should be of the form: `+([0-9])?(.{+([0-9]),x}).x`.

Regular expressions are complicated, but this essentially means branch names should look like:
* `1.15.x` for patch releases on top of the `1.15` release (after version `1.16` exists)
* `2.x` for feature releases on top of the `2` release (after version `3` exists)

