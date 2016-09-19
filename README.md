# d2l-my-courses-ui

The UI for the My Courses homepage widget in the LE.

## Building

Install dependencies via NPM:

```shell
npm install
```

## Running Locally

To run the application locally, run the following from within the project:

```shell
npm run serve
```

This will start a local server `polymer-cli` which you can use to explore the
docs and demos for the components.

## Components

`d2l-my-courses` is made up of several web components all working together. The
intent behind this design is that each component can be used more or less
independently. If there is a need, these components could be broken out into
their own repositories/release schedule, but for now they are all contained
within this repo. See the docs for information about each of them.

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

> Note: To contribute, please create a branch in this repo instead of a fork.
We are using [Sauce Labs](https://saucelabs.com/) in our CI builds which don't
work in PRs from forks. Thanks!

### Code Style

This repository is configured with [EditorConfig](http://editorconfig.org) rules and
contributions should make use of them.
