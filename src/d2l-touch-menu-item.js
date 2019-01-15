/*
`d2l-touch-menu-item`
Polymer-based web component for the touch menu item.

This can be removed when the `us90524-my-courses-css-grid-layout` LD flag and `d2l-touch-menu.html` are removed.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-icons/d2l-icons.js';
import 'd2l-offscreen/d2l-offscreen.js';
import './d2l-touch-menu-item-styles.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
		<style include="d2l-touch-menu-item-styles"></style>

		<div class="longpress-menu-item">
			<div class="longpress-menu-item-text">{{_displayText}}</div>

			<div class="longpress-menu-item-image-background">
				<d2l-icon class="longpress-menu-item-image" icon="{{_displayBackgroundImage}}" aria-hidden="true"></d2l-icon>
			</div>
		</div>

		<d2l-offscreen aria-live="polite">{{ariaMessage}}</d2l-offscreen>
`,

  is: 'd2l-touch-menu-item',

  properties: {
	  // Action description, read out for A11Y when action is completed
	  actionDescription: {
		  type: String
	  },
	  // Description of menu action, for A11Y purposes
	  ariaMessage: {
		  type: String,
		  readOnly: true
	  },
	  // URL of image to use for icon
	  backgroundImage: {
		  type: String,
		  observer: '_backgroundImageChanged'
	  },
	  // Whether the menu item is currently being hovered over
	  hoverState: {
		  type: Boolean,
		  observer: '_hoverStateChanged'
	  },
	  // Name of event that will be fired when menu item is hovered over
	  hoverEvent: {
		  type: String
	  },
	  // Offset of menu item - calculated by `d2l-touch-menu` based on number of items in the menu
	  offset: {
		  type: Object,
		  observer: '_offsetChanged'
	  },
	  // Name of event that will be fired when menu item is selected
	  selectionEvent: {
		  type: String
	  },
	  // Text displayed below icon in menu item
	  text: {
		  type: String,
		  observer: '_textChanged'
	  },
	  // Region that defines the "edges" of the menu item
	  touchRegion: {
		  type: Object
	  },
	  // Text displayed below icon in menu item
	  _displayText: {
		  type: String
	  },
	  // Icon for menu item
	  _displayBackgroundImage: {
		  type: String
	  },
	  // Whether menu item is currently in transition between hovered/not hovered
	  _inTransition: {
		  type: Boolean
	  },
	  // Stores the menu item for convenience
	  // TODO: Is the convenience really needed?
	  _menuItem: {
		  type: Object
	  },
	  // Padding (in px) around the menu item's `touchRegion`
	  _touchRadiusPadding: {
		  type: Number,
		  value: 30
	  },
	  // State of menu item, whether selected or not
	  _selected: {
		  type: Boolean
	  },
	  // Whether the menu item is visible or not
	  // TODO: Shouldn't this just be inherited from the `d2l-touch-menu`?
	  _visible: {
		  type: Boolean
	  }
  },

  ready: function() {
	  this._menuItem = this.$$('.longpress-menu-item');
	  this._updateDisplayData();
  },

  _menu: null,

  get height() {
	  return this._menuItem.clientHeight;
  },

  set selected(isSelected) {
	  this._selected = isSelected;
	  this.toggleClass('selected', isSelected, this._menuItem);

	  if (isSelected) {
		  this._inTransition = true;
		  this.listen(this._menuItem, 'transitionend', '_transitionendHandler');
	  } else {
		  // Not selected implied not visible
		  this.visible = false;
	  }
  },

  get selected() {
	  return this._selected;
  },

  set visible(isVisible) {
	  if (!this._selected) {
		  this._visible = isVisible;
		  this.toggleClass('visible', isVisible, this._menuItem);
	  }
  },

  get visible() {
	  return this._visible;
  },

  get width() {
	  return this._menuItem.clientWidth;
  },

  pointInTouchRegion: function(point) {
	  var rect = {
		  top: this.touchRegion.top - this._touchRadiusPadding,
		  bottom: this.touchRegion.top + this.height + this._touchRadiusPadding,
		  left: this.touchRegion.left - this._touchRadiusPadding,
		  right: this.touchRegion.left + this.width + this._touchRadiusPadding
	  };

	  return (
		  (point.y < rect.bottom)
		  && (point.y > rect.top)
		  && (point.x < rect.right)
		  && (point.x > rect.left)
	  );
  },

  _ariaAnnounce: function(message) {
	  this._setAriaMessage('');
	  this._setAriaMessage(message);
  },

  _backgroundImageChanged: function(newValue) {
	  if (!this._inTransition) {
		  this._displayBackgroundImage = newValue;
	  }
  },

  _hoverStateChanged: function(isHovered, wasHovered) {
	  this.toggleClass('longpress-menu-item-hover', isHovered, this._menuItem);

	  if (isHovered !== wasHovered) {
		  if (isHovered && this.actionDescription) {
			  this._ariaAnnounce(this.actionDescription);
		  } else {
			  this._ariaAnnounce('');
		  }

		  if (this.hoverEvent && !this.selected) {
			  var eventData = {
				  hoverState: isHovered,
				  element: this._menu._currentTarget
			  };

			  this.fire(this.hoverEvent, eventData);
		  }
	  }
  },

  _offsetChanged: function(newOffset) {
	  this.style.left = newOffset.x + 'px';
	  this.style.top = newOffset.y + 'px';
  },

  _textChanged: function(newValue) {
	  if (!this._inTransition) {
		  this._displayText = newValue;
	  }
  },

  _transitionendHandler: function() {
	  // Triggered by the end of the transition caused by adding 'selected' class
	  this._inTransition = false;
	  this.hoverState = false;
	  this.selected = false;
	  this.visible = false;
	  // Detach this event handler - otherwise the menu item's classes thrash
	  this.unlisten(this._menuItem, 'transitionend', '_transitionendHandler');

	  this._updateDisplayData();
  },

  _updateDisplayData: function() {
	  this._displayText = this.text;
	  this._displayBackgroundImage = this.backgroundImage;
  }
});
