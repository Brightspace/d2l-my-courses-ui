/*
`d2l-filter-menu-tab-roles`
Polymer-based web component for the filter menu tab roles.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-hypermedia-constants/d2l-hm-constants-behavior.js';
import 'd2l-menu/d2l-menu.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import '../d2l-utility-behavior.js';
import './d2l-filter-list-item-role.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
		<style>
			:host {
				display: flex;
				flex-direction: column;
			}
			.no-items-text {
				@apply --d2l-body-compact-text;
				margin: 10px;
			}
		</style>

		<div hidden$="[[!_showContent]]">
			<d2l-menu label="[[menuLabelText]]">
				<template is="dom-repeat" items="[[_filterTitles]]">
					<d2l-filter-list-item-role text="[[item]]" value="[[item]]">
					</d2l-filter-list-item-role>
				</template>
			</d2l-menu>
		</div>

		<div class="no-items-text" hidden$="[[_showContent]]">[[noFiltersText]]</div>
`,

  is: 'd2l-filter-menu-tab-roles',

  properties: {
	  myEnrollmentsEntity: {
		  type: Object,
		  observer: '_myEnrollmentsEntityChanged'
	  },
	  menuLabelText: String,
	  noFiltersText: String,
	  _roleFiltersEntity: Object,
	  _filterTitles: {
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
	  D2L.MyCourses.UtilityBehavior
  ],

  listeners: {
	  'd2l-menu-item-change': '_onMenuItemChange'
  },

  clear: function() {
	  var items = this.$$('d2l-menu').querySelectorAll('d2l-filter-list-item-role');
	  for (var i = 0; i < items.length; i++) {
		  items[i].selected = false;
	  }

	  // This should instead use a `clear-role-filters` action from the API
	  // (which would do effectively the same thing), but it doesn't exist yet
	  var myEnrollmentsEntity = this.parseEntity(this.myEnrollmentsEntity);
	  var actionName = this.HypermediaActions.enrollments.setRoleFilters;
	  if (!myEnrollmentsEntity.hasActionByName(actionName)) {
		  return;
	  }
	  var setRoleFiltersAction = myEnrollmentsEntity.getActionByName(actionName);
	  var clearRoleFiltersUrl = this.createActionUrl(setRoleFiltersAction, {
		  include: ''
	  });

	  return this._fetchFilterItems(clearRoleFiltersUrl);
  },

  resize: function() {
	  this.$$('d2l-menu').resize();

	  setTimeout(function() {
		  // DE24225 - force dropdown to resize after opening
		  window.dispatchEvent(new Event('resize'));
	  }.bind(this), 200);
  },

  _computeShowContent: function(filtersLength) {
	  return filtersLength > 0;
  },

  _myEnrollmentsEntityChanged: function(myEnrollmentsEntity) {
	  myEnrollmentsEntity = this.parseEntity(myEnrollmentsEntity);
	  var actionName = this.HypermediaActions.enrollments.setRoleFilters;
	  if (!myEnrollmentsEntity.hasActionByName(actionName)) {
		  return;
	  }

	  var setRoleFiltersAction = myEnrollmentsEntity.getActionByName(actionName);
	  var setRoleFiltersUrl = this.createActionUrl(setRoleFiltersAction);

	  this._fetchFilterItems(setRoleFiltersUrl);
  },

  _onMenuItemChange: function(e) {
	  var actionName;
	  if (e.detail.selected) {
		  actionName = this.HypermediaActions.enrollments.roleFilters.addFilter;
	  } else {
		  actionName = this.HypermediaActions.enrollments.roleFilters.removeFilter;
	  }

	  var filterTitle = e.detail.value;

	  var filter = this._findNextFilter(this._roleFiltersEntity.entities, filterTitle, actionName);
	  var action = filter.getActionByName(actionName);
	  var url = this.createActionUrl(action);
	  var request = this.fetchSirenEntity(url);

	  for (var i = 1; i < this._roleFiltersEntity.entities.length; i++) {
		  request = request.then(function(updatedFilters) {
			  var filter = this._findNextFilter(updatedFilters.entities, filterTitle, actionName);
			  // If there aren't any more "off" filters with the desired title, skip through to end
			  if (!filter) {
				  return Promise.resolve(updatedFilters);
			  }

			  // Create the URL to enable the next correctly-titled, "off" filter
			  var action = filter.getActionByName(actionName);
			  var url = this.createActionUrl(action);
			  return this.fetchSirenEntity(url);
		  }.bind(this));
	  }

	  return request
		  .then(this._parseFilterItems.bind(this))
		  .then(this._applyRoleFilters.bind(this));
  },

  _findNextFilter: function(array, title, actionName) {
	  // This could easily be replaced with Array.prototype.find, but... IE.
	  for (var i = 0; i < array.length; i++) {
		  var filter = array[i];
		  if (filter.title === title && filter.hasActionByName(actionName)) {
			  return filter;
		  }
	  }
  },

  _applyRoleFilters: function() {
	  // Use the apply-role-filters action to create the new searchUrl
	  var applyAction = this._roleFiltersEntity.getActionByName(
		  this.HypermediaActions.enrollments.roleFilters.applyRoleFilters
	  );
	  var searchUrl = this.createActionUrl(applyAction);
	  this.fire('role-filters-changed', {
		  url: searchUrl,
		  filterCount: this.querySelectorAll('d2l-filter-list-item-role[selected]').length
	  });
  },

  _fetchFilterItems: function(url) {
	  return this.fetchSirenEntity(url)
		  .then(this._parseFilterItems.bind(this));
  },

  _parseFilterItems: function(roleFiltersEntity) {
	  this._roleFiltersEntity = roleFiltersEntity;
	  this._roleFiltersEntity.entities = this._roleFiltersEntity.entities || [];

	  // DE27982 - Filters with the same title should be combined into one item
	  var uniqueTitles = [];
	  this._roleFiltersEntity.entities.forEach(function(filterEntity) {
		  if (uniqueTitles.indexOf(filterEntity.title) === -1) {
			  uniqueTitles.push(filterEntity.title);
		  }
	  });
	  this._filterTitles = uniqueTitles;

	  this._showContent = this._roleFiltersEntity.entities.length > 0;
  }
});
