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

This will start a local server using polyserve

The demos can be found at:
> http://localhost:8080/components/d2l-my-courses/demo/index.html

## Components

`d2l-my-courses` is made up of several web components all working together. The
intent behind this design is that each component can be used more or less
independently. If there is a need, these components could be broken out into
their own repositories/release schedule, but for now they are all contained
within this repo.

### d2l-alert

The `d2l-alert` is intended to be used for highlighted blocks of informational
text.

Properties:

- `visible`: Defines whether alert is visible. Can be a truthy value, or a
function that returns a truthy value.

### d2l-simple-overlay

The `d2l-simple-overlay` is a popover window that can be used to display any
content. It uses [iron-overlay](https://github.com/PolymerElements/iron-overlay-behavior)
and various [neon](https://elements.polymer-project.org/browse?package=neon-elements)
behaviours and elements. The overlay supports using different animations
and transitions for desktop and mobile.

Properties:

- `title` _String_: Title that appears at the top of the overlay
- `animationConfig` _function_: Defines transformations for open/close
animations. See the `neon` docs for more information.

### d2l-touch-menu

The `d2l-touch-menu` is simply a container for `d2l-touch-menu-item`s. See the
`d2l-touch-menu-item` demo for usage.

Properties:

- `enabled` _Boolean_: if true (default), touch menu is enabled

### d2l-touch-menu-item

The `d2l-touch-menu` is a long-press menu that is used on mobile, and can
contain one or more `d2l-touch-menu-item`s.

Properties:

- `actionDescription` _String_: used for A11Y offscreen description
- `backgroundImage` _String_: an icon to use for the menu item
- `text` _String_: Text to display on menu item
- `selectionEvent` _String_: Name of event that will be fired when menu item selected
- `hoverEvent` _String_: Name of event that will be fired when menu item is hovered

## `user-info-api` Integration

The My Courses widget pulls data from an instance of the User Info Service to
get the enrollments for a user. This is intended as a temporary solution, and
will be changed in the future.

## Local Testing

Testing from within LMS:

1. Checkout brightspace/d2l-my-courses-ui and brightspace/brightspace-integration

2. In brightspace-integration project, ensure you're in the correct branch (c12i12)

3. In d2l-my-courses-ui directory, run
	```shell
	bower link
	```
to allow it to be linked from brightspace-integration

4. In brightspace-integration directory, run
	```shell
	bower link d2l-my-courses-ui
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
