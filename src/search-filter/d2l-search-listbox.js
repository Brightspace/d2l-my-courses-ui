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

import '@brightspace-ui/core/components/colors/colors.js';
import { IronA11yKeysBehavior } from '@polymer/iron-a11y-keys-behavior/iron-a11y-keys-behavior.js';
import { IronMenuBehavior } from '@polymer/iron-menu-behavior/iron-menu-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-search-listbox">
	<template strip-whitespace="">
		<style>
			:host {
				box-sizing: border-box;
				display: block;
				width: 100%;
			}

			::slotted(div) {
				box-sizing: border-box;
				border-top: 1px solid transparent;
				border-bottom: 1px solid var(--d2l-color-gypsum);
				list-style-type: none;
				width: calc(100% - 2px);
				padding: 0.75rem 1.5rem;
				cursor: pointer;
				outline: none;
			}

			::slotted(div:last-of-type) {
				border-bottom-color: transparent;
			}

			::slotted(*:not([disabled]):focus),
			::slotted(*:not([disabled]):hover) {
				background-color: var(--d2l-color-celestine-plus-2);
				border-top-color: var(--d2l-color-celestine);
				border-bottom-color: var(--d2l-color-celestine);
				color: var(--d2l-color-celestine-minus-1);
			}

			::slotted([data-list-title]) {
				padding-top: 1rem;
				padding-bottom: 1rem;
				margin: 0 !important;
				cursor: default;
				border-bottom-color: var(--d2l-color-mica);
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
		const selectableItems = this.items.filter((item) => {
			if (item.hasAttribute('role') &&
				item.getAttribute('role') === 'option' &&
				!item.hasAttribute('disabled')) {
				return true;
			}
		});
		return selectableItems.length > 0;
	},

	focusLast: function() {
		const length = this.items.length;

		for (let i = length - 1; i >= 0; i--) {
			const item = this.items[i];
			if (!item.hasAttribute('disabled')) {
				this._setFocusedItem(item);
				return;
			}
		}
	},

	// Override IronMenuBehavior._focusPrevious so that the listbox owner can be focused
	_focusPrevious: function() {
		const length = this.items.length;
		const curFocusIndex = this.indexOf(this.focusedItem);

		for (let i = 1; i < length + 1; i++) {
			const newItemIndex = (curFocusIndex - i + length) % length;
			const item = this.items[newItemIndex];

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
		const length = this.items.length;
		const curFocusIndex = this.indexOf(this.focusedItem);

		for (let i = 1; i < length + 1; i++) {
			const newItemIndex = (curFocusIndex + i) % length;
			const item = this.items[newItemIndex];

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
		if (e.detail.event === 'keydown' && (this.keyboardEventMatchesKeys(e, 'space') || this.keyboardEventMatchesKeys(e, 'enter'))) {
			e.preventDefault();
			if (this.focusedItem && !this.focusedItem.hasAttribute('disabled')) {
				this.fire('iron-activate', { item: this.focusedItem });
			}
		}
	},

	// Override IronMenuBehavior._resetTabindices to disable tab focus of all items
	_resetTabindices: function() {
		for (let i = 0; i < this.items.length; i++) {
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
		'enter' : '_onKeydown',  // DE40947 - Adding enter because there is an issue with space in Firefox
		'space' : '_onKeydown'
	}

});
