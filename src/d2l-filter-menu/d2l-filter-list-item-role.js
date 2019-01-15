/*
`d2l-filter-list-item-role`
Polymer-based web component for the filter list item role.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-icons/d2l-icons.js';
import 'd2l-menu/d2l-menu-item-selectable-behavior.js';
import './d2l-filter-list-item-styles.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
		<style include="d2l-filter-list-item-styles"></style>

		<d2l-icon class="icon-checked" icon="d2l-tier2:check-box" aria-hidden="true"></d2l-icon>
		<d2l-icon class="icon-unchecked" icon="d2l-tier2:check-box-unchecked" aria-hidden="true"></d2l-icon>

		[[text]]
`,

  is: 'd2l-filter-list-item-role',

  behaviors: [
	  D2L.PolymerBehaviors.MenuItemSelectableBehavior
  ],

  listeners: {
	  'd2l-menu-item-select': '_onSelect'
  },

  _onSelect: function(e) {
	  this.set('selected', !this.selected);
	  this.__onSelect(e);
  }
});
