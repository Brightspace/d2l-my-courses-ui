/*
`d2l-filter-menu`
Polymer-based web component for the filter menu.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import '@brightspace-ui/core/components/colors/colors.js';
import { Actions } from 'd2l-hypermedia-constants';
import 'd2l-typography/d2l-typography-shared-styles.js';
import '@polymer/iron-pages/iron-pages.js';
import '../d2l-utility-behavior.js';
import '../localize-behavior.js';
import './d2l-filter-menu-tab.js';
import './d2l-filter-menu-tab-roles.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-filter-menu">
	<template strip-whitespace="">
		<style>
			:host {
				display: flex;
				flex-direction: column;
			}
			button:hover,
			button:focus {
				text-decoration: underline;
				color: var(--d2l-color-celestine);
			}
			.dropdown-content-header {
				box-sizing: border-box;
				display: flex;
				justify-content: space-between;
				border-bottom: 1px solid var(--d2l-color-mica);
				width: 100%;
				padding: 20px;
			}
			.clear-button {
				@apply --d2l-body-small-text;
				color: var(--d2l-color-celestine);
				background: none;
				border: none;
				cursor: pointer;
				margin: 0 !important;
				padding: 0;
			}
			.dropdown-content-tabs {
				display: flex;
				align-items: center;
			}
			.dropdown-content-tab {
				flex: 1;
			}
			.dropdown-content-tab-button {
				@apply --d2l-body-small-text;
				color: var(--d2l-color-ferrite);
				background: none;
				border: none;
				padding: 10px;
				cursor: pointer;
				display: inherit;
				font-family: inherit;
			}
			.dropdown-content-tab-highlight {
				background-color: var(--d2l-color-celestine);
				border-bottom-left-radius: 4px;
				border-bottom-right-radius: 4px;
				height: 4px;
				width: 80%;
				margin: auto;
			}
			#contentView {
				background: linear-gradient(to top, white, var(--d2l-color-regolith));
			}
		</style>

		<div class="dropdown-content-header">
			<span>[[localize('filtering.filterBy')]]</span>
			<button hidden$="[[!_hasFilters]]" class="clear-button" on-tap="clearFilters">[[localize('filtering.clear')]]</button>
		</div>

		<div id="contentView">
			<div class="dropdown-content-tabs" role="tablist">
				<div class="dropdown-content-tab" role="tab" aria-controls="semestersTab" hidden$="[[_semestersTabHidden]]">
					<div class="dropdown-content-tab-highlight" hidden$="[[!_semestersTabSelected]]"></div>
					<button id="semestersTabButton" class="dropdown-content-tab-button" on-tap="_selectTab" data-tab-name="semesters" aria-pressed="true">[[_semestersTabText]]</button>
				</div>
				<div class="dropdown-content-tab" role="tab" aria-controls="departmentsTab" hidden$="[[_departmentsTabHidden]]">
					<div class="dropdown-content-tab-highlight" hidden$="[[!_departmentsTabSelected]]"></div>
					<button id="departmentsTabButton" class="dropdown-content-tab-button" on-tap="_selectTab" data-tab-name="departments" aria-pressed="false">[[_departmentsTabText]]</button>
				</div>
				<div class="dropdown-content-tab" role="tab" aria-controls="rolesTab" hidden$="[[_rolesTabHidden]]">
					<div class="dropdown-content-tab-highlight" hidden$="[[!_rolesTabSelected]]"></div>
					<button id="rolesTabButton" class="dropdown-content-tab-button" on-tap="_selectTab" data-tab-name="roles" aria-pressed="false">[[_rolesTabText]]</button>
				</div>
			</div>
		</div>

		<iron-pages attr-for-selected="data-tab-name" selected="semesters" fallback-selection="semesters">
			<d2l-filter-menu-tab id="semestersTab" data-tab-name="semesters" aria-labelledby="semestersTabButton" menu-label-text="[[filterStandardSemesterName]]" no-filters-text="[[localize('filtering.noSemesters', 'semester', filterStandardSemesterName)]]" search-action="[[_searchSemestersAction]]" search-placeholder-text="[[_semestersSearchPlaceholderText]]" selected-filters="{{_semesterFilters}}" hidden$="[[_semestersTabHidden]]">
			</d2l-filter-menu-tab>

			<d2l-filter-menu-tab id="departmentsTab" data-tab-name="departments" aria-labelledby="departmentsTabButton" menu-label-text="[[filterStandardDepartmentName]]" no-filters-text="[[localize('filtering.noDepartments', 'department', filterStandardDepartmentName)]]" search-action="[[_searchDepartmentsAction]]" search-placeholder-text="[[_departmentsSearchPlaceholderText]]" selected-filters="{{_departmentFilters}}" hidden$="[[_departmentsTabHidden]]">
			</d2l-filter-menu-tab>

			<d2l-filter-menu-tab-roles id="rolesTab" data-tab-name="roles" aria-labelledby="rolesTabButton" no-filters-text="[[localize('filtering.noRoles')]]" my-enrollments-entity="[[myEnrollmentsEntity]]" hidden$="[[_rolesTabHidden]]">
			</d2l-filter-menu-tab-roles>
		</iron-pages>
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-filter-menu',
	properties: {
		filterStandardDepartmentName: String,
		filterStandardSemesterName: String,
		filterRolesName: String,
		myEnrollmentsEntity: {
			type: Object,
			observer: '_myEnrollmentsEntityChanged'
		},
		tabSearchType: {
			type: String,
			observer: '_tabSearchTypeChanged'
		},
		_departmentFilters: {
			type: Array,
			value: function() { return []; }
		},
		_semesterFilters: {
			type: Array,
			value: function() { return []; }
		},
		_roleFiltersCount: {
			type: Number,
			value: 0
		},
		_searchDepartmentsAction: Object,
		_searchSemestersAction: Object,
		_searchMyEnrollmentsAction: Object,
		_semestersTabSelected: {
			type: Boolean,
			value: false
		},
		_departmentsTabSelected: {
			type: Boolean,
			value: false
		},
		_rolesTabSelected: {
			type: Boolean,
			value: false
		},
		_hasFilters: {
			type: Boolean,
			value: false,
			computed: '_computeHasFilters(_departmentFilters.length, _semesterFilters.length, _roleFiltersCount)'
		},
		_semestersTabText: {
			type: String,
			computed: '_computeTabText(filterStandardSemesterName, _semesterFilters.length)'
		},
		_departmentsTabText: {
			type: String,
			computed: '_computeTabText(filterStandardDepartmentName, _departmentFilters.length)'
		},
		_rolesTabText: {
			type: String,
			computed: '_computeTabText(filterRolesName, _roleFiltersCount)'
		},
		_semestersSearchPlaceholderText: {
			type: String,
			computed: '_computeSearchPlaceholderText(filterStandardSemesterName)'
		},
		_departmentsSearchPlaceholderText: {
			type: String,
			computed: '_computeSearchPlaceholderText(filterStandardDepartmentName)'
		},
		_rolesTabHidden: {
			type: Boolean,
			value: false
		},
		_semestersTabHidden: {
			type: Boolean,
			value: false
		},
		_departmentsTabHidden: {
			type: Boolean,
			value: false
		}
	},
	behaviors: [
		D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
		D2L.MyCourses.UtilityBehavior
	],
	listeners: {
		'role-filters-changed': '_onRoleFiltersChanged',
		'selected-filters-changed': '_onDepartmentOrSemesterFiltersChanged'
	},
	attached: function() {
		this.filterRolesName = this.localize('filtering.roles');
	},

	open: function() {

		var defaultTab = !this._semestersTabHidden
			? 'semesters'
			: !this._departmentsTabHidden ? 'departments' : 'roles';

		this._selectTab({ target: { dataset: { tabName: defaultTab }}});

		return Promise.all([
			this.$.semestersTab.load(),
			this.$.departmentsTab.load()
		]);
	},
	clearFilters: function() {
		this.$.semestersTab.clear();
		this.$.departmentsTab.clear();
		this.$.rolesTab.clear();

		this._roleFiltersCount = 0;

		// Clear button is removed via dom-if, so need to manually set focus to next element
		if (this._semestersTabSelected) {
			this.$.semestersTabButton.focus();
		} else if (this._departmentsTabSelected) {
			this.$.departmentsTabButton.focus();
		} else {
			this.$.rolesTabButton.focus();
		}

		if (!this._searchMyEnrollmentsAction) {
			// When initially loading, everything is already cleared anyway
			return;
		}

		var params = {};
		if (!this._semestersTabHidden || !this._departmentsTabHidden) {
			// Only clear semesters/departments when My Courses is grouped by role
			params.parentOrganizations = '';
		}
		if (!this._rolesTabHidden) {
			// Only clear roles when My Courses is grouped by semester/department
			params.roles = '';
		}

		var searchUrl = this.createActionUrl(this._searchMyEnrollmentsAction, params);

		this.fire('d2l-filter-menu-change', {
			url: searchUrl,
			filterCounts: {
				departments: 0,
				semesters: 0,
				roles: 0
			}
		});
	},

	_onRoleFiltersChanged: function(e) {
		this._roleFiltersCount = e.detail.filterCount;

		this.fire('d2l-filter-menu-change', {
			url: e.detail.url,
			filterCounts: {
				departments: this._departmentFilters.length,
				semesters: this._semesterFilters.length,
				roles: this._roleFiltersCount
			}
		});
	},
	_onDepartmentOrSemesterFiltersChanged: function() {
		if (!this._semesterFilters || !this._departmentFilters || !this._searchMyEnrollmentsAction) {
			return;
		}

		var departmentSemesterFilters = this._semesterFilters.concat(this._departmentFilters);

		var searchUrl = this.createActionUrl(this._searchMyEnrollmentsAction, {
			orgUnitTypeId: this.orgUnitTypeIds,
			parentOrganizations: departmentSemesterFilters.join(',')
		});

		this.fire('d2l-filter-menu-change', {
			url: searchUrl,
			filterCounts: {
				departments: this._departmentFilters.length,
				semesters: this._semesterFilters.length,
				roles: this._roleFiltersCount
			}
		});
	},
	_myEnrollmentsEntityChanged: function(myEnrollmentsEntity) {
		myEnrollmentsEntity = this.parseEntity(myEnrollmentsEntity);

		if (myEnrollmentsEntity.hasActionByName(Actions.enrollments.searchMySemesters)) {
			this._searchSemestersAction = myEnrollmentsEntity.getActionByName(Actions.enrollments.searchMySemesters);
		}

		if (myEnrollmentsEntity.hasActionByName(Actions.enrollments.searchMyDepartments)) {
			this._searchDepartmentsAction = myEnrollmentsEntity.getActionByName(Actions.enrollments.searchMyDepartments);
		}

		if (myEnrollmentsEntity.hasActionByName(Actions.enrollments.searchMyEnrollments)) {
			this._searchMyEnrollmentsAction = myEnrollmentsEntity.getActionByName(Actions.enrollments.searchMyEnrollments);
		}

		this._hideInvalidSearchTabs();
	},
	_selectTab: function(e) {
		var tabName = e.target.dataset.tabName;

		this.$$('iron-pages').select(tabName);

		this._semestersTabSelected = tabName === 'semesters';
		this._departmentsTabSelected = tabName === 'departments';
		this._rolesTabSelected = tabName === 'roles';

		this.$.semestersTab.resize();
		this.$.departmentsTab.resize();
		this.$.rolesTab.resize();

		this.$.semestersTabButton.setAttribute('aria-pressed', this._semestersTabSelected);
		this.$.departmentsTabButton.setAttribute('aria-pressed', this._departmentsTabSelected);
		this.$.rolesTabButton.setAttribute('aria-pressed', this._rolesTabSelected);
	},
	_tabSearchTypeChanged: function() {
		this._hideInvalidSearchTabs();
	},
	_hideInvalidSearchTabs: function() {
		// If My Courses is grouped by semesters/departments, don't show either of these tabs
		var semesterOrDepartmentGrouping = this.tabSearchType === 'BySemester' || this.tabSearchType === 'ByDepartment';
		this._semestersTabHidden = semesterOrDepartmentGrouping || !this._searchSemestersAction;
		this._departmentsTabHidden = semesterOrDepartmentGrouping || !this._searchDepartmentsAction;
		// If My Courses is grouped by role alias, don't show the Role tab
		this._rolesTabHidden = this.tabSearchType === 'ByRoleAlias';
	},
	_computeHasFilters: function(departmentFiltersLength, semesterFiltersLength, roleFiltersCount) {
		return departmentFiltersLength + semesterFiltersLength + roleFiltersCount > 0;
	},
	_computeTabText: function(filterLabel, num) {
		return this.localize('filtering.filterLabel', 'filterLabel', filterLabel, 'num', num);
	},
	_computeSearchPlaceholderText: function(name) {
		return this.localize('filtering.searchBy', 'filter', name);
	}
});
