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

import '@brightspace-ui/core/components/menu/menu.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import './d2l-filter-list-item-role.js';
import '../d2l-utility-behavior.js';
import { Actions } from 'd2l-hypermedia-constants';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-filter-menu-tab-roles">
	<template strip-whitespace="">
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
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
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
		D2L.MyCourses.UtilityBehavior
	],
	listeners: {
		'd2l-menu-item-change': '_onMenuItemChange'
	},

	clear: function() {
		const items = this.shadowRoot.querySelector('d2l-menu').querySelectorAll('d2l-filter-list-item-role');
		for (let i = 0; i < items.length; i++) {
			items[i].selected = false;
		}

		// This should instead use a `clear-role-filters` action from the API
		// (which would do effectively the same thing), but it doesn't exist yet
		const myEnrollmentsEntity = this.parseEntity(this.myEnrollmentsEntity);
		const actionName = Actions.enrollments.setRoleFilters;
		if (!myEnrollmentsEntity.hasActionByName(actionName)) {
			return;
		}
		const setRoleFiltersAction = myEnrollmentsEntity.getActionByName(actionName);
		const clearRoleFiltersUrl = this.createActionUrl(setRoleFiltersAction, {
			include: ''
		});

		return this._fetchFilterItems(clearRoleFiltersUrl);
	},
	resize: function() {
		this.shadowRoot.querySelector('d2l-menu').resize();

		setTimeout(() => {
			// DE24225 - force dropdown to resize after opening
			window.dispatchEvent(new Event('resize'));
		}, 200);
	},

	_computeShowContent: function(filtersLength) {
		return filtersLength > 0;
	},
	_myEnrollmentsEntityChanged: function(myEnrollmentsEntity) {
		myEnrollmentsEntity = this.parseEntity(myEnrollmentsEntity);
		const actionName = Actions.enrollments.setRoleFilters;
		if (!myEnrollmentsEntity.hasActionByName(actionName)) {
			return;
		}

		const setRoleFiltersAction = myEnrollmentsEntity.getActionByName(actionName);
		const setRoleFiltersUrl = this.createActionUrl(setRoleFiltersAction);

		this._fetchFilterItems(setRoleFiltersUrl);
	},
	_onMenuItemChange: function(e) {
		let actionName;
		if (e.detail.selected) {
			actionName = Actions.enrollments.roleFilters.addFilter;
		} else {
			actionName = Actions.enrollments.roleFilters.removeFilter;
		}

		const filterTitle = e.detail.value;

		const filter = this._findNextFilter(this._roleFiltersEntity.entities, filterTitle, actionName);
		const action = filter.getActionByName(actionName);
		const url = this.createActionUrl(action);
		let request = this.fetchSirenEntity(url);

		for (let i = 1; i < this._roleFiltersEntity.entities.length; i++) {
			request = request.then((updatedFilters) => {
				const filter = this._findNextFilter(updatedFilters.entities, filterTitle, actionName);
				// If there aren't any more "off" filters with the desired title, skip through to end
				if (!filter) {
					return Promise.resolve(updatedFilters);
				}

				// Create the URL to enable the next correctly-titled, "off" filter
				const action = filter.getActionByName(actionName);
				const url = this.createActionUrl(action);
				return this.fetchSirenEntity(url);
			});
		}

		return request
			.then(this._parseFilterItems.bind(this))
			.then(this._applyRoleFilters.bind(this));
	},
	_findNextFilter: function(array, title, actionName) {
		// This could easily be replaced with Array.prototype.find, but... IE.
		for (let i = 0; i < array.length; i++) {
			const filter = array[i];
			if (filter.title === title && filter.hasActionByName(actionName)) {
				return filter;
			}
		}
	},
	_applyRoleFilters: function() {
		// Use the apply-role-filters action to create the new searchUrl
		const applyAction = this._roleFiltersEntity.getActionByName(
			Actions.enrollments.roleFilters.applyRoleFilters
		);
		const searchUrl = this.createActionUrl(applyAction);
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
		const uniqueTitles = [];
		this._roleFiltersEntity.entities.forEach((filterEntity) => {
			if (uniqueTitles.indexOf(filterEntity.title) === -1) {
				uniqueTitles.push(filterEntity.title);
			}
		});
		this._filterTitles = uniqueTitles;

		this._showContent = this._roleFiltersEntity.entities.length > 0;
	}
});
