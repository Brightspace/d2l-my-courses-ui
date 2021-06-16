/*
`d2l-all-courses`
Polymer-based web component for the all courses overlay.
*/

import '@polymer/iron-scroll-threshold/iron-scroll-threshold.js';
import '@brightspace-ui/core/components/alert/alert.js';
import '@brightspace-ui/core/components/dialog/dialog-fullscreen.js';
import '@brightspace-ui/core/components/link/link.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/tabs/tabs.js';
import '@brightspace-ui/core/components/tabs/tab-panel.js';
import '@brightspace-ui-labs/facet-filter-sort/components/sort-by-dropdown/sort-by-dropdown.js';
import '@brightspace-ui-labs/facet-filter-sort/components/sort-by-dropdown/sort-by-dropdown-option.js';
import './d2l-my-courses-card-grid.js';
import './search-filter/d2l-my-courses-search.js';
import { createActionUrl, fetchSirenEntity } from './d2l-utility-helpers.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { Actions } from 'd2l-hypermedia-constants';
import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { entityFactory } from 'siren-sdk/src/es6/EntityFactory.js';
import { MyCoursesFilterCategory } from './search-filter/d2l-my-courses-filter.js';
import { MyCoursesLocalizeBehavior } from './localize-behavior.js';

class AllCourses extends MyCoursesLocalizeBehavior(PolymerElement) {

	static get is() { return 'd2l-all-courses'; }

	static get properties() {
		return {
			// URL that directs to the advanced search page
			advancedSearchUrl: String,
			// Standard Department OU Type name to be displayed in the filter dropdown
			filterStandardDepartmentName: String,
			// Standard Semester OU Type name to be displayed in the filter dropdown
			filterStandardSemesterName: String,
			// Configuration value passed in to toggle Learning Paths code
			orgUnitTypeIds: {
				type: Array,
				observer: '_onOrgUnitTypeIdsChange'
			},
			// URL to fetch widget settings
			presentationUrl: String,
			// Set by the image selector when it experiences an error trying to set a new course image
			showImageError: {
				type: Boolean,
				value: false
			},
			// Siren Actions corresponding to each tab that is displayed
			tabSearchActions: {
				type: Array,
				value: function() { return []; }
			},
			// Type of tabs being displayed (BySemester, ByDepartment, ByRoleAlias)
			tabSearchType: String,
			// Token JWT Token for brightspace | a function that returns a JWT token for brightspace
			token: String,

			// Action params to keep filtering/sorting/searching options between tab changes
			_actionParams: Object,
			_bustCacheToken: Number,
			// Current tab's search-my-enrollments Action
			_enrollmentsSearchAction: Object,
			// Info about filter categories and options to pass down to the filter component
			_filterCategories: {
				type: Array,
				value: function() { return []; }
			},
			// Used to set the correct message when no courses are shown and to handle tab loads
			_filterCounts: {
				type: Object,
				value: function() {
					return {
						departments: 0,
						semesters: 0,
						roles: 0
					};
				}
			},
			_hasEnrollmentsChanged: {
				type: Boolean,
				value: false
			},
			// True when there are more enrollments to fetch (i.e. current page of enrollments has a `next` link)
			_hasMoreEnrollments: {
				type: Boolean,
				computed: '_computeHasMoreEnrollments(_lastEnrollmentCollectionResponse, _showTabContent)'
			},
			_infoMessageText: {
				type: String,
				value: null
			},
			// Used to set the correct message when no courses are shown
			_isSearched: Boolean,
			// Object containing the last response from an enrollments fetch
			_lastEnrollmentCollectionResponse: Object,
			// URL to fetch enrollments, set by filtering, sorting, searching, and selecting a tab
			_searchUrl: {
				type: String,
				observer: '_fetchEnrollments'
			},
			_selectedTabId: String,
			_showAdvancedSearchLink: {
				type: Boolean,
				value: false,
				computed: '_computeShowAdvancedSearchLink(advancedSearchUrl)'
			},
			_showContent: {
				type: Boolean,
				value: false
			},
			_showTabContent: {
				type: Boolean,
				value: false
			},
			_sortMap: {
				type: Object,
				value: function() {
					return {
						Default: {
							action: 'Current',
							promotePins: true
						},
						OrgUnitName: {
							action: 'OrgUnitName,OrgUnitId',
							promotePins: false
						},
						OrgUnitCode: {
							action: 'OrgUnitCode,OrgUnitId',
							promotePins: false
						},
						PinDate: {
							action: '-PinDate,OrgUnitId',
							promotePins: true
						},
						LastAccessed: {
							action: 'LastAccessed',
							promotePins: false
						},
						EnrollmentDate: {
							action: '-LastModifiedDate,OrgUnitId',
							promotePins: false
						}
					};
				}
			}
		};
	}

	static get template() {
		return html`
			<style>
				:host {
					display: block;
				}
				d2l-alert {
					margin-bottom: 20px;
				}
				d2l-loading-spinner {
					margin-bottom: 30px;
					padding-bottom: 30px;
					margin: auto;
					width: 100%;
				}
				#search-and-filter {
					display: flex;
					flex-wrap: wrap;
					justify-content: space-between;
					margin-bottom: 1rem;
					margin-top: -0.5rem;
				}
				.advanced-search-link {
					font-size: 0.8rem;
					margin-top: 3px;
				}
				.advanced-search-link[hidden] {
					display: none;
				}
				d2l-my-courses-search {
					min-width: 300px;
					width: 100%;
				}
				#search-and-link,
				#filter-and-sort {
					display: flex;
					margin-top: 0.5rem;
				}
				#search-and-link {
					flex: 1;
					flex-direction: row;
					flex-wrap: wrap;
				}
				#filter-and-sort {
					flex: 1.4;
					justify-content: flex-end;
				}
				d2l-my-courses-filter,
				d2l-labs-sort-by-dropdown {
					margin-left: 0.5rem;
				}
				:host(:dir(rtl)) d2l-my-courses-filter,
				:host(:dir(rtl)) d2l-labs-sort-by-dropdown {
					margin-left: 0;
					margin-right: 0.5rem;
				}
				#infoMessage {
					padding-bottom: 20px;
				}
			</style>

			<d2l-dialog-fullscreen
				id="all-courses"
				title-text="[[localize('allCourses')]]"
				on-d2l-dialog-open="_onDialogOpening"
     			on-d2l-dialog-close="_onDialogClosed">

				<div hidden$="[[!_showContent]]">
					<iron-scroll-threshold id="all-courses-scroll-threshold" on-lower-threshold="_onAllCoursesLowerThreshold">
					</iron-scroll-threshold>

					<div id="search-and-filter">
						<div id="search-and-link">
							<d2l-my-courses-search
								on-d2l-my-courses-search-change="_onSearchChange">
							</d2l-my-courses-search>
							<d2l-link class="advanced-search-link" hidden$="[[!_showAdvancedSearchLink]]" href$="[[advancedSearchUrl]]">[[localize('advancedSearch')]]</d2l-link>
						</div>

						<div id="filter-and-sort">
							<d2l-my-courses-filter
								on-d2l-my-courses-filter-change="_onFilterChange"
								on-d2l-my-courses-filter-clear="_onFilterClear"
								filter-categories="[[_filterCategories]]">
							</d2l-my-courses-filter>

							<d2l-labs-sort-by-dropdown align="end" label="[[localize('sorting.sortBy')]]" value="Default" on-d2l-labs-sort-by-dropdown-change="_onSortOrderChanged">
								<d2l-labs-sort-by-dropdown-option value="Default" text="[[localize('sorting.sortDefault')]]"></d2l-labs-sort-by-dropdown-option>
								<d2l-labs-sort-by-dropdown-option value="OrgUnitName" text="[[localize('sorting.sortCourseName')]]"></d2l-labs-sort-by-dropdown-option>
								<d2l-labs-sort-by-dropdown-option value="OrgUnitCode" text="[[localize('sorting.sortCourseCode')]]"></d2l-labs-sort-by-dropdown-option>
								<d2l-labs-sort-by-dropdown-option value="PinDate" text="[[localize('sorting.sortDatePinned')]]"></d2l-labs-sort-by-dropdown-option>
								<d2l-labs-sort-by-dropdown-option value="LastAccessed" text="[[localize('sorting.sortLastAccessed')]]"></d2l-labs-sort-by-dropdown-option>
								<d2l-labs-sort-by-dropdown-option value="EnrollmentDate" text="[[localize('sorting.sortEnrollmentDate')]]"></d2l-labs-sort-by-dropdown-option>
							</d2l-labs-sort-by-dropdown>
						</div>
					</div>

					<d2l-alert hidden$="[[!showImageError]]" type="warning">
						[[localize('error.settingImage')]]
					</d2l-alert>

					<d2l-tabs on-d2l-tab-panel-selected="_onTabSelected">
						<template items="[[tabSearchActions]]" is="dom-repeat">
							<d2l-tab-panel id="all-courses-tab-[[item.name]]" text="[[item.title]]" selected="[[item.selected]]">
								<d2l-my-courses-card-grid loading="[[!_showTabContent]]" token="[[token]]" presentation-url="[[presentationUrl]]">
									<span id="infoMessage" hidden$="[[!_infoMessageText]]">
										[[_infoMessageText]]
									</span>
								</d2l-my-courses-card-grid>
							</d2l-tab-panel>
						</template>
					</d2l-tabs>

					<d2l-loading-spinner
					id="lazyLoadSpinner"
					 hidden$="[[!_hasMoreEnrollments]]"
					 size="100">
					</d2l-loading-spinner>
				</div>
				<d2l-loading-spinner hidden$="[[_showContent]]" size="100">
				</d2l-loading-spinner>
			</d2l-dialog-fullscreen>`;
	}

	ready() {
		super.ready();
		this._actionParams = {
			autoPinCourses: false,
			embedDepth: 0,
			orgUnitTypeId: this.orgUnitTypeIds,
			pageSize: 20,
			promotePins: this._sortMap.Default.promotePins,
			search: '',
			sort: this._sortMap.Default.action
		};
	}

	/*
	* Public API methods
	*/

	courseEnrollmentChanged(newValue) {
		// Only bust the cache and reload the pinned tab if the tabs have been set (ie the overlay has been opened)
		if (this.tabSearchActions.length > 0) {
			this._bustCacheToken = Math.random();
			const actionName = this._selectedTabId.replace('all-courses-tab-', '');
			if (!newValue.isPinned && actionName === Actions.enrollments.searchMyPinnedEnrollments && this._searchUrl) {
				this._searchUrl = this._appendOrUpdateBustCacheQueryString(this._searchUrl);
			}
		}

		this._hasEnrollmentsChanged = true;
	}

	open() {
		// Initially hide the content, until we have some data to show
		// (triggered by _onTabSelected and set back to true in _handleNewEnrollmentsEntity).
		// The exception to this is when the overlay is closed then reopened - we want
		// to immediately show the already-loaded content.
		this._showContent = !!this._searchUrl;

		this.shadowRoot.querySelector('#all-courses').open();

		this.$['all-courses-scroll-threshold'].scrollTarget = this.$['all-courses'].scrollRegion;
		this.$['all-courses-scroll-threshold'].clearTriggers();
	}

	// After a user-uploaded image is set, this is called to try to update the image
	refreshCardGridImages(organization) {
		const cardGrid = this._getCardGrid();
		if (cardGrid) {
			cardGrid.refreshCardGridImages(organization);
		}
	}

	_getCardGrid() {
		return this.shadowRoot.querySelector(`#${this._selectedTabId} d2l-my-courses-card-grid`);
	}

	/*
	* Listeners
	*/

	_onAllCoursesLowerThreshold() {
		if (this.$['all-courses'].opened && this._lastEnrollmentCollectionResponse) {
			const nextHref = this._lastEnrollmentCollectionResponse.getNextEnrollmentHref();

			if (nextHref) {
				this.$.lazyLoadSpinner.scrollIntoView();
				entityFactory(EnrollmentCollectionEntity, nextHref, this.token, entity => {
					if (entity) {
						this._updateFilteredEnrollments(entity, true);
					}
				});
			}
		}
	}

	_onOrgUnitTypeIdsChange(newValue) {
		if (this._actionParams) {
			this._actionParams.orgUnitTypeId = newValue;
		}
	}

	_onSortOrderChanged(e) {
		const sortData = this._sortMap[e.detail.value] || this._sortMap.Default;

		this._actionParams.sort = sortData.action;
		this._actionParams.promotePins = sortData.promotePins;

		this._searchUrl = this._appendOrUpdateBustCacheQueryString(
			createActionUrl(this._enrollmentsSearchAction, this._actionParams)
		);
	}

	_onSearchChange(e) {
		this._isSearched = !!e.detail.value;

		this._actionParams.search = encodeURIComponent(e.detail.value);
		this._searchUrl = this._appendOrUpdateBustCacheQueryString(
			createActionUrl(this._enrollmentsSearchAction, this._actionParams)
		);
	}

	_onFilterChange(e) {
		const departmentFilters = e.detail.selectedFilters.find(filter => filter.key === 'departments');
		const semesterFilters = e.detail.selectedFilters.find(filter => filter.key === 'semesters');
		const roleFilters = e.detail.selectedFilters.find(filter => filter.key === 'roles');

		this._filterCounts = {
			departments: departmentFilters ? departmentFilters.selectedOptions.length : 0,
			semesters: semesterFilters ? semesterFilters.selectedOptions.length : 0,
			roles: roleFilters ? roleFilters.selectedOptions.length : 0
		};

		if (roleFilters && e.detail.categoryChanged === 'roles') {
			this._handleRolesFilterChange(roleFilters.selectedOptions);
		} else if ((semesterFilters && e.detail.categoryChanged === 'semesters') || (departmentFilters && e.detail.categoryChanged === 'departments')) {
			const selectedSemesters = semesterFilters ? semesterFilters.selectedOptions : [];
			const selectedDepartments = departmentFilters ? departmentFilters.selectedOptions : [];
			const semesterDepartmentFilters = selectedSemesters.concat(selectedDepartments);

			this._actionParams.parentOrganizations = semesterDepartmentFilters.join(',');
			this._searchUrl = this._appendOrUpdateBustCacheQueryString(
				createActionUrl(this._enrollmentsSearchAction, this._actionParams)
			);
		}
	}

	async _handleRolesFilterChange(selectedRoles) {
		/* The role filter works by applying a single state change and then re-fetching,
		 * so we need to wait for the request to return and use the new entity for
		 * every filter that needs to be flipped to a different value
		 */
		let newEntity = this._roleFiltersEntity;
		for (let i = 0; i < this._roleFiltersEntity.entities.length; i++) {
			const roleFilter = newEntity.entities[i];
			const isSelected = selectedRoles.find(role => role === roleFilter.title);
			if (isSelected && roleFilter.hasActionByName(Actions.enrollments.roleFilters.addFilter)) {
				const actionUrl = createActionUrl(roleFilter.getActionByName(Actions.enrollments.roleFilters.addFilter));
				newEntity = await fetchSirenEntity(actionUrl);
			} else if (!isSelected && roleFilter.hasActionByName(Actions.enrollments.roleFilters.removeFilter)) {
				const actionUrl = createActionUrl(roleFilter.getActionByName(Actions.enrollments.roleFilters.removeFilter));
				newEntity = await fetchSirenEntity(actionUrl);
			}
		}

		this._roleFiltersEntity = newEntity;

		// Use the apply-role-filters action to create the new searchUrl
		const applyAction = this._roleFiltersEntity.getActionByName(
			Actions.enrollments.roleFilters.applyRoleFilters
		);

		const actionUrl = createActionUrl(applyAction);
		this._actionParams.roles = applyAction.getFieldByName('roles').value;
		this._searchUrl = this._appendOrUpdateBustCacheQueryString(actionUrl);
	}

	_onFilterClear() {
		this._filterCounts = {
			departments: 0,
			semesters: 0,
			roles: 0
		};

		this._clearParentOrganizationsAndRolesParams();

		this._searchUrl = this._appendOrUpdateBustCacheQueryString(
			createActionUrl(this._enrollmentsSearchAction, this._actionParams)
		);
	}

	_onDialogOpening() {
		if (this._hasEnrollmentsChanged) {
			this._hasEnrollmentsChanged = false;
			this._bustCacheToken = Math.random();
			if (this._searchUrl) {
				this._searchUrl = this._appendOrUpdateBustCacheQueryString(this._searchUrl);
			}
		}
	}

	_onDialogClosed() {
		this._actionParams.search = '';
		this._actionParams.sort = this._sortMap.Default.action;
		this._actionParams.promotePins = this._sortMap.Default.promotePins;

		this._clearParentOrganizationsAndRolesParams();

		this.shadowRoot.querySelector('d2l-my-courses-search').clear();
		this.shadowRoot.querySelector('d2l-my-courses-filter').clear();
		this.shadowRoot.querySelector('d2l-labs-sort-by-dropdown-option[value=Default]').click();

		this.dispatchEvent(new CustomEvent('d2l-all-courses-close'));
	}

	_clearParentOrganizationsAndRolesParams() {
		// Only clear if My Courses is not grouped by semesters/departments
		if (this.tabSearchType !== 'BySemester' && this.tabSearchType !== 'ByDepartment' && this._actionParams.parentOrganizations) {
			this._actionParams.parentOrganizations = '';
		}
		// Only clear if My Courses is not grouped by role
		if (this.tabSearchType !== 'ByRoleAlias' && this._actionParams.roles) {
			this._actionParams.roles = '';
		}
	}

	// Triggered when the tabs are first rendered, which then fetches the enrollment data by setting _searchUrl
	_onTabSelected(e) {
		e.stopPropagation();

		this._selectedTabId = e.composedPath()[0].id;
		const actionName = this._selectedTabId.replace('all-courses-tab-', '');
		let tabAction;
		for (let i = 0; i < this.tabSearchActions.length; i++) {
			if (this.tabSearchActions[i].name === actionName) {
				this.tabSearchActions[i].selected = true;
				tabAction = this.tabSearchActions[i];
			} else {
				this.tabSearchActions[i].selected = false;
			}
		}

		if (!tabAction) {
			return;
		}

		this._showTabContent = false;

		this._searchUrl = this._appendOrUpdateBustCacheQueryString(
			createActionUrl(tabAction.enrollmentsSearchAction, this._actionParams)
		);
	}

	_fetchEnrollments(url) {
		entityFactory(EnrollmentCollectionEntity, url, this.token, entity => {
			if (entity) {
				this._handleNewEnrollmentsEntity(entity);
			}
		});
	}

	_handleNewEnrollmentsEntity(enrollmentsEntity) {
		this._updateFilteredEnrollments(enrollmentsEntity, false);

		this._enrollmentsSearchAction = enrollmentsEntity.getSearchEnrollmentsActions();

		const entity = enrollmentsEntity._entity;
		if (entity.hasActionByName(Actions.enrollments.setRoleFilters)) {
			const href = createActionUrl(entity.getActionByName(Actions.enrollments.setRoleFilters));
			fetchSirenEntity(href).then(entity => {
				this._roleFiltersEntity = entity;
			});
		}

		// We only need to make the filter categories once
		if (this._filterCategories.length === 0) {
			this._createFilterCategories(entity);
		}

		this._showContent = true;
		this._showTabContent = true;

		setTimeout(() => {
			// Triggers the course tiles to resize after switching tab
			window.dispatchEvent(new Event('resize'));
		}, 10);
	}

	_createFilterCategories(enrollmentsEntity) {
		if (!enrollmentsEntity) {
			return;
		}

		let searchSemestersAction,
			searchDepartmentsAction,
			roleFiltersAction;

		if (enrollmentsEntity.hasActionByName(Actions.enrollments.searchMySemesters)) {
			searchSemestersAction = enrollmentsEntity.getActionByName(Actions.enrollments.searchMySemesters);
		}
		if (enrollmentsEntity.hasActionByName(Actions.enrollments.searchMyDepartments)) {
			searchDepartmentsAction = enrollmentsEntity.getActionByName(Actions.enrollments.searchMyDepartments);
		}
		if (enrollmentsEntity.hasActionByName(Actions.enrollments.setRoleFilters)) {
			roleFiltersAction = enrollmentsEntity.getActionByName(Actions.enrollments.setRoleFilters);
		}

		const filterCategories = [];

		// If My Courses is grouped by semesters/departments, don't show either of these tabs
		if (this.tabSearchType !== 'BySemester' && this.tabSearchType !== 'ByDepartment' && searchSemestersAction) {
			filterCategories.push(new MyCoursesFilterCategory(
				'semesters',
				this.filterStandardSemesterName,
				this.localize('filtering.noSemesters', 'semester', this.filterStandardSemesterName),
				searchSemestersAction
			));
		}
		if (this.tabSearchType !== 'BySemester' && this.tabSearchType !== 'ByDepartment' && searchDepartmentsAction) {
			filterCategories.push(new MyCoursesFilterCategory(
				'departments',
				this.filterStandardDepartmentName,
				this.localize('filtering.noDepartments', 'department', this.filterStandardDepartmentName),
				searchDepartmentsAction
			));
		}

		// If My Courses is grouped by role alias, don't show the Role tab
		if (this.tabSearchType !== 'ByRoleAlias') {
			filterCategories.push(new MyCoursesFilterCategory(
				'roles',
				this.localize('filtering.roles'),
				this.localize('filtering.noRoles'),
				roleFiltersAction
			));
		}

		this._filterCategories = filterCategories;
	}

	/*
	* Utility/helper functions
	*/

	_appendOrUpdateBustCacheQueryString(url) {
		if (!url) {
			return null;
		}

		const bustCacheStr = 'bustCache=';
		let index = url.indexOf(bustCacheStr);
		if (index === -1) {
			return `${url}${(url.indexOf('?') !== -1 ? '&' : '?')}bustCache=${this._bustCacheToken || ''}`;
		}

		index += bustCacheStr.length;
		const prefix = url.substring(0, index);
		let suffix = url.substring(index, url.length);
		index = suffix.indexOf('&');
		suffix = index === -1 ? '' : suffix.substring(index, suffix.length);
		return prefix + this._bustCacheToken + suffix;
	}

	_computeHasMoreEnrollments(lastResponse, showTabContent) {
		if (!showTabContent) {
			return false;
		}

		return lastResponse.hasMoreEnrollments();
	}

	_computeShowAdvancedSearchLink(link) {
		return !!link;
	}

	_updateFilteredEnrollments(enrollmentsEntity, append) {
		this._lastEnrollmentCollectionResponse = enrollmentsEntity;
		const gridEntities = enrollmentsEntity.enrollmentsHref();

		const cardGrid = this._getCardGrid();
		if (append) {
			cardGrid.filteredEnrollments = cardGrid.filteredEnrollments.concat(gridEntities);
		} else {
			cardGrid.filteredEnrollments = gridEntities;
		}

		this._updateInfoMessage(cardGrid.filteredEnrollments.length);

		requestAnimationFrame(() => {
			window.dispatchEvent(new Event('resize')); // doing this older edge browser will get ms-grid style assigned
			this.$['all-courses-scroll-threshold'].clearTriggers();
		});
	}

	_updateInfoMessage(enrollmentLength) {
		this._infoMessageText = null;

		if (enrollmentLength === 0) {
			if (this._isSearched) {
				this._infoMessageText = this.localize('noCoursesInSearch');
				return;
			}
			const totalFilterCount = this._filterCounts.departments + this._filterCounts.semesters + this._filterCounts.roles;
			if (totalFilterCount === 1) {
				if (this._filterCounts.departments === 1) {
					this._infoMessageText = this.localize('noCoursesInDepartment');
				} else if (this._filterCounts.semesters === 1) {
					this._infoMessageText = this.localize('noCoursesInSemester');
				} else if (this._filterCounts.roles === 1) {
					this._infoMessageText = this.localize('noCoursesInRole');
				}
				return;
			}
			if (totalFilterCount > 1) {
				this._infoMessageText = this.localize('noCoursesInSelection');
				return;
			}
		}
	}
}

window.customElements.define(AllCourses.is, AllCourses);
