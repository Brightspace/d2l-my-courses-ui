/*
`d2l-search-listbox`
Polymer-based web component for the search listbox.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/iron-a11y-keys/iron-a11y-keys.js';
import { IronMenuBehavior } from '@polymer/iron-menu-behavior/iron-menu-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { IronA11yKeysBehavior } from '@polymer/iron-a11y-keys-behavior/iron-a11y-keys-behavior.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-search-listbox">
	<template strip-whitespace="">
		<style>
			:host {
				box-sizing: border-box;
				display: block;
				width: 100%;
			}

			::slotted(*) {
				box-sizing: border-box;
				border-top: 1px solid transparent;
				border-bottom: 1px solid var(--d2l-color-gypsum);
				list-style-type: none;
				width: calc(100% - 2px);
				padding: 0.75rem 1.5rem;
				cursor: pointer;
			}

			::slotted(div:last-of-type) {
				border-bottom-color: transparent;
			}

			::slotted(*:not([disabled]):focus),
			::slotted(*:not([disabled]):hover) {
				background-color: var(--d2l-color-celestine-light-1);
				border-top-color: var(--d2l-color-celestine-light-2);
				border-bottom-color: var(--d2l-color-celestine-light-2);
				color: var(--d2l-color-celestine);
			}

			::slotted([data-list-title]) {
				padding-top: 1rem;
				padding-bottom: 1rem;
				margin: 0 !important;
				cursor: default;
				border-bottom-color: var(--d2l-color-titanius);
			}

			::slotted([data-list-title]+div) {
				background: -moz-linear-gradient(to top, white, var(--d2l-color-regolith));
				background: -webkit-linear-gradient(to top, white, var(--d2l-color-regolith));
				background: linear-gradient(to top, white, var(--d2l-color-regolith));
			}
		</style>
		<slot></slot>
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-search-listbox',

	properties: {
		// The associated input element if this is part of a combobox; for control wrapping
		owner: Object
	},

	hostAttributes: {
		'role': 'listbox',
		'tabindex': -1
	},

	behaviors: [
		IronMenuBehavior,
		IronA11yKeysBehavior
	],

	hasItems: function() {
		var selectableItems = this.items.filter(function(item) {
			if (item.hasAttribute('role') &&
				item.getAttribute('role') === 'option' &&
				!item.hasAttribute('disabled')) {
				return true;
			}
		});
		return selectableItems.length > 0;
	},

	focusLast: function() {
		var length = this.items.length;

		for (var i = length - 1; i >= 0; i--) {
			var item = this.items[i];
			if (!item.hasAttribute('disabled')) {
				this._setFocusedItem(item);
				return;
			}
		}
	},

	// Override IronMenuBehavior._focusPrevious so that the listbox owner can be focused
	_focusPrevious: function() {
		var length = this.items.length;
		var curFocusIndex = this.indexOf(this.focusedItem);

		for (var i = 1; i < length + 1; i++) {
			var newItemIndex = (curFocusIndex - i + length) % length;
			var item = this.items[newItemIndex];

			if (this.owner && newItemIndex === length - 1) {
				this._setFocusedItem(null);
				this.owner.focus();
				return;
			} else if (!item.hasAttribute('disabled')) {
				this._setFocusedItem(item);
				return;
			}
		}
	},

	// Override IronMenuBehavior._focusNext so that the listbox owner can be focused
	_focusNext: function() {
		var length = this.items.length;
		var curFocusIndex = this.indexOf(this.focusedItem);

		for (var i = 1; i < length + 1; i++) {
			var newItemIndex = (curFocusIndex + i) % length;
			var item = this.items[newItemIndex];

			if (this.owner && (curFocusIndex > newItemIndex) && (newItemIndex === 0)) {
				this._setFocusedItem(null);
				this.owner.focus();
				return;
			} else if (!item.hasAttribute('disabled')) {
				this._setFocusedItem(item);
				return;
			}
		}
	},

	// Handle keyboard selection of listbox items, as IronMenuBehavior leaves it to the item to handle
	_onKeydown: function(e) {
		if (e.detail.event === 'keydown' && this.keyboardEventMatchesKeys(e, 'space')) {
			e.preventDefault();
			if (this.focusedItem && !this.focusedItem.hasAttribute('disabled')) {
				this.fire('iron-activate', {item: this.focusedItem});
			}
		}
	},

	// Override IronMenuBehavior._resetTabindices to disable tab focus of all items
	_resetTabindices: function() {
		for (var i = 0; i < this.items.length; i++) {
			this.items[i].setAttribute('tabindex', -1);
		}
	},

	// Override IronMenuBehavior._focusedItemChanged to do nothing but focus the desired item
	_focusedItemChanged: function(focusedItem) {
		if (focusedItem) {
			focusedItem.focus();
		}
	},

	keyBindings: {
		'space' : '_onKeydown'
	}

});
