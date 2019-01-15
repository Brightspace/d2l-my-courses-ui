/*
`d2l-filter-menu-tab`
Polymer-based web component for the filter menu tabs.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-hypermedia-constants/d2l-hm-constants-behavior.js';
import 'd2l-menu/d2l-menu.js';
import 'd2l-search-widget/d2l-search-widget.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import '../d2l-utility-behavior.js';
import '../localize-behavior.js';
import './d2l-filter-list-item.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
		<style>
			:host {
				display: flex;
				flex-direction: column;
			}
			d2l-search-widget {
				--d2l-search-widget-height: 45px;
				margin: 10px 20px;
			}
			.no-items-text {
				@apply --d2l-body-compact-text;
				margin: 10px;
			}
		</style>

		<div hidden$="[[!_showContent]]">
			<d2l-search-widget placeholder-text="[[searchPlaceholderText]]" search-button-label="[[localize('search')]]" clear-button-label="[[localize('search.clearSearch')]]" search-action="[[searchAction]]" search-field-name="search">
			</d2l-search-widget>

			<d2l-menu label="[[menuLabelText]]">
				<template is="dom-repeat" items="[[_allFilters]]">
					<d2l-filter-list-item enrollment-entity="[[item]]" selected="[[_checkSelected(item)]]">
					</d2l-filter-list-item>
				</template>
			</d2l-menu>

			<div class="no-items-text" hidden$="[[_hasSearchResults]]">[[localize('noSearchResults')]]</div>
		</div>

		<div class="no-items-text" hidden$="[[_showContent]]">[[noFiltersText]]</div>
`,

  is: 'd2l-filter-menu-tab',

  properties: {
	  selectedFilters: {
		  type: Array,
		  value: function() { return []; },
		  notify: true
	  },
	  menuLabelText: String,
	  noFiltersText: String,
	  searchAction: Object,
	  searchPlaceholderText: String,
	  _hasSearchResults: {
		  type: Boolean,
		  value: false,
		  computed: '_computeHasSearchResults(_allFilters.length)'
	  },
	  _allFilters: {
		  type: Array,
		  value: function() { return []; }
	  },
	  _showContent: {
		  type: Boolean,
		  value: false
	  }
  },

  behaviors: [
	  window.D2L.Hypermedia.HMConstantsBehavior,
	  D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
	  D2L.MyCourses.UtilityBehavior
  ],

  listeners: {
	  'd2l-search-widget-results-changed': '_onSearchWidgetResultsChanged',
	  'd2l-menu-item-change': '_onMenuItemChange'
  },

  load: function() {
	  if (!this.searchAction) {
		  return;
	  }

	  if (this._allFilters.length > 0) {
		  // We've already loaded, don't load again
		  this.$$('d2l-search-widget').clear();
		  return Promise.resolve();
	  }

	  return this.fetchSirenEntity(this.searchAction.href)
		  .then(function(resultsEntity) {
			  this.set('_allFilters', resultsEntity.entities || []);
			  this.$$('d2l-search-widget').search();
			  this._showContent = this._allFilters.length > 0;
		  }.bind(this));
  },

  clear: function() {
	  var items = this.$$('d2l-menu').querySelectorAll('d2l-filter-list-item');
	  for (var i = 0; i < items.length; i++) {
		  items[i].selected = false;
	  }

	  this.$$('d2l-search-widget').clear();
	  this.selectedFilters = [];
  },

  resize: function() {
	  this.$$('d2l-menu').resize();

	  setTimeout(function() {
		  // DE24225 - force dropdown to resize after opening
		  window.dispatchEvent(new Event('resize'));
	  }.bind(this), 200);
  },

  _checkSelected: function(entity) {
	  // Checks if the given entity should be "selected" - used when search results change
	  var id = entity.href || entity.getLinkByRel(this.HypermediaRels.organization).href;
	  return this.selectedFilters.indexOf(id) > -1;
  },

  _computeHasSearchResults: function(allFiltersLength) {
	  return allFiltersLength > 0;
  },

  _onMenuItemChange: function(e) {
	  if (e.detail.selected) {
		  this.push('selectedFilters', e.detail.value);
	  } else {
		  var index = this.selectedFilters.indexOf(e.detail.value);
		  this.splice('selectedFilters', index, 1);
	  }
	  this.fire('selected-filters-changed');
  },

  _onSearchWidgetResultsChanged: function(e) {
	  this.set('_allFilters', e.detail.entities || []);
	  this.resize();
  }
});
