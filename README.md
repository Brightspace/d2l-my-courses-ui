[![Build Status](https://travis-ci.org/Brightspace/d2l-my-courses-ui.svg?branch=master)](https://travis-ci.org/Brightspace/d2l-my-courses-ui)

# d2l-my-courses-ui

The UI for the My Courses homepage widget in the LE.

## Building

Install dependencies via NPM:

```shell
npm install
```

## Components

`d2l-my-courses` is made up of several web components all working together. The
intent behind this design is that each component can be used more or less
independently. If there is a need, these components could be broken out into
their own repositories/release schedule, but for now they are all contained
within this repo.

- `<d2l-all-courses>` displays both pinned and unpinned courses
- `<d2l-course-tile-grid>` is the wrapper that contains several `<d2l-course-tile>` elements
- `<d2l-course-tile>` is a clickable, interactable tile that represents a course
- `<d2l-my-courses>` is the main component for My Courses widget
- `<d2l-touch-menu>` is a menu intended for use with mobile interfaces
- `<d2l-touch-menu-item>` is the element that populates a `d2l-touch-menu`

There are other components as well, but they are mostly intended to be used
within this widget (i.e. not very likely candidates for being broken out into
their own repos).

## Local Testing

Testing from within LMS:

1. Checkout brightspace/d2l-my-courses-ui and brightspace/brightspace-integration

2. In brightspace-integration project, ensure you're in the correct branch (master)

3. In d2l-my-courses-ui directory, run
	```shell
	bower link
	```
to allow it to be linked from brightspace-integration

4. In brightspace-integration directory, run
	```shell
	bower link d2l-my-courses
	```
to link to the local d2l-my-courses-ui project

5. Build and run brightspace-integration (will have to be rebuilt on any changes to d2l-my-courses-ui)
 * Note: If on Windows, you must remove the tmp directory manually prior to building, if it exists.

## Unit Tests

The unit tests are built and run using [web-component-tester](https://github.com/Polymer/web-component-tester).

To lint and run unit tests, run:

```shell
npm test
```

## Publishing & Releasing

To publish a numbered "release" version, use the "Draft a new release" tool on GitHub.

## Contributing
Contributions are welcome, please submit a pull request!

In the description of your pull request, please include the following information:
1. The associated user story number, if applicable

2. The acceptance criteria for this feature

3. Areas of risk that should be addressed during testing

Before your PR is merged, it should be tested thoroughly, and the person who does this testing should describe their test steps in detail in a comment. These steps should then be reviewed by the developer and assessed for gaps before the PR gets merged.

> Note: To contribute, please create a branch in this repo instead of a fork.
We are using [Sauce Labs](https://saucelabs.com/) in our CI builds which don't
work in PRs from forks. Thanks!

### Code Style

This repository is configured with [EditorConfig](http://editorconfig.org) rules and
contributions should make use of them.
