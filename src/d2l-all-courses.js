/*
`d2l-all-courses`
Polymer-based web component for the all courses overlay.
*/

import '@polymer/iron-scroll-threshold/iron-scroll-threshold.js';
import '@brightspace-ui/core/components/alert/alert.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/dropdown/dropdown.js';
import '@brightspace-ui/core/components/dropdown/dropdown-content.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/link/link.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item-radio.js';
import '@brightspace-ui/core/components/tabs/tabs.js';
import '@brightspace-ui/core/components/tabs/tab-panel.js';
import 'd2l-organization-hm-behavior/d2l-organization-hm-behavior.js';
import 'd2l-simple-overlay/d2l-simple-overlay.js';
import './d2l-my-courses-card-grid.js';
import './d2l-utility-behavior.js';
import './search-filter/d2l-filter-menu.js';
import './search-filter/d2l-search-widget-custom.js';
import { Actions, Classes } from 'd2l-hypermedia-constants';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { entityFactory } from 'siren-sdk/src/es6/EntityFactory.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { MyCoursesLocalizeBehavior } from './localize-behavior.js';
import SirenParse from 'siren-parser';

class AllCourses extends mixinBehaviors([
	D2L.PolymerBehaviors.Hypermedia.OrganizationHMBehavior,
	D2L.MyCourses.UtilityBehavior
], MyCoursesLocalizeBehavior(PolymerElement)) {

	static get is() { return 'd2l-all-courses'; }

	static get properties() {
		return {
			/*
			* Public Polymer properties
			*/

			// URL that directs to the advanced search page
			advancedSearchUrl: String,
			// Standard Department OU Type name to be displayed in the filter dropdown
			filterStandardDepartmentName: String,
			// Standard Semester OU Type name to be displayed in the filter dropdown
			filterStandardSemesterName: String,
			// Object containing the last response from an enrollments search request
			_lastEnrollmentsSearchResponse: Object,
			// Entity returned from my-enrollments Link from the enrollments root
			_myEnrollmentsEntity: {
				type: Object,
				value: function() { return {}; },
				observer: '_myEnrollmentsEntityChanged'
			},
			orgUnitTypeIds: Array,
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
			// Initial search action, should combine with _enrollmentsSearchAction
			enrollmentsSearchAction: Object,

			/*
			* Private Polymer properties
			*/

			// search-my-enrollments Action
			_enrollmentsSearchAction: Object,
			// Filter dropdown opener text
			_filterText: String,
			_hasEnrollmentsChanged: {
				type: Boolean,
				value: false
			},
			// True when there are more enrollments to fetch (i.e. current page of enrollments has a `next` link)
			_hasMoreEnrollments: {
				type: Boolean,
				computed: '_computeHasMoreEnrollments(_lastEnrollmentsSearchResponse, _showTabContent)'
			},
			// URL passed to search widget, called for searching
			_searchUrl: String,
			_showAdvancedSearchLink: {
				type: Boolean,
				value: false,
				computed: '_computeShowAdvancedSearchLink(advancedSearchUrl)'
			},
			_showContent: {
				type: Boolean,
				value: false
			},
			_showGroupByTabs: {
				type: Boolean,
				computed: '_computeShowGroupByTabs(tabSearchActions.length)'
			},
			_showTabContent: {
				type: Boolean,
				value: false
			},
			// Number of filters currently selected; used to change opener text when menu closes
			_totalFilterCount: {
				type: Number,
				value: 0
			},
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
			_isSearched: Boolean,
			_bustCacheToken: Number,
			_selectedTabId: String,
			_infoMessageText: {
				type: String,
				value: null
			},
			_sortMap: {
				type: Object,
				value: function() {
					return [
						{
							name: 'Default',
							action: 'Current',
							langterm: 'sorting.sortDefault',
							promotePins: true
						},
						{
							name: 'OrgUnitName',
							action: 'OrgUnitName,OrgUnitId',
							langterm: 'sorting.sortCourseName',
							promotePins: false
						},
						{
							name: 'OrgUnitCode',
							action: 'OrgUnitCode,OrgUnitId',
							langterm: 'sorting.sortCourseCode',
							promotePins: false
						},
						{
							name: 'PinDate',
							action: '-PinDate,OrgUnitId',
							langterm: 'sorting.sortDatePinned',
							promotePins: true
						},
						{
							name: 'LastAccessed',
							action: 'LastAccessed',
							langterm: 'sorting.sortLastAccessed',
							promotePins: false
						},
						{
							name: 'EnrollmentDate',
							action: '-LastModifiedDate,OrgUnitId',
							langterm: 'sorting.sortEnrollmentDate',
							promotePins: false
						}
					];
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
				d2l-icon {
					--d2l-icon-height: 15px;
					--d2l-icon-width: 15px;
					margin-top: -0.35rem;
				}
				d2l-loading-spinner {
					margin-bottom: 30px;
					padding-bottom: 30px;
					margin: auto;
					width: 100%;
				}
				#search-and-filter {
					margin-bottom: 50px;
				}
				.search-and-filter-row {
					display: flex;
					justify-content: space-between;
				}
				.advanced-search-link {
					font-size: 0.8rem;
					margin-top: 3px;
					flex: 1;
				}
				.advanced-search-link[hidden] {
					display: none;
				}
				d2l-search-widget-custom {
					flex: 1;
				}
				#filterAndSort {
					flex: 1.4;
					display: flex;
					justify-content: flex-end;
					align-items: center;
				}
				@media screen and (max-width: 767px) {
					#filterAndSort {
						display: none;
					}
					.advanced-search-link {
						text-align: right;
						margin-top: 5px;
					}
				}
				.dropdown-opener-text {
					font-size: 0.95rem;
					font-family: Lato;
					cursor: pointer;
					padding: 0;
					margin-left: 1rem;
				}
				.dropdown-button {
					background: none;
					border: none;
					cursor: pointer;
					padding: 0;
					color: var(--d2l-color-ferrite);
				}
				.dropdown-button > d2l-icon {
					margin-left: 4px;
				}
				.dropdown-content-header {
					box-sizing: border-box;
					display: flex;
					align-items: center;
					justify-content: space-between;
					border-bottom: 1px solid var(--d2l-color-mica);
					width: 100%;
					padding: 20px;
				}
				.dropdown-content-gradient {
					background: linear-gradient(to top, white, var(--d2l-color-regolith));
				}
				button[aria-pressed="true"] {
					color: var(--d2l-color-celestine);
				}
				button:focus > d2l-icon,
				button:hover > d2l-icon,
				button:focus > span,
				button:hover > span,
				.focus {
					text-decoration: underline;
					color: var(--d2l-color-celestine);
				}

				#infoMessage {
					padding-bottom: 20px;
				}
			</style>

			<d2l-simple-overlay
				id="all-courses"
				on-d2l-simple-overlay-opening="_onSimpleOverlayOpening"
				on-d2l-simple-overlay-closed="_onSimpleOverlayClosed"
				close-simple-overlay-alt-text="[[localize('closeSimpleOverlayAltText')]]"
				restore-focus-on-close
				title-name="[[localize('allCourses')]]"
				with-backdrop>

				<div hidden$="[[!_showContent]]">
					<iron-scroll-threshold id="all-courses-scroll-threshold" on-lower-threshold="_onAllCoursesLowerThreshold">
					</iron-scroll-threshold>

					<div id="search-and-filter">
						<div class="search-and-filter-row">
							<d2l-search-widget-custom
								id="search-widget"
								on-d2l-search-widget-results-changed="_onSearchResultsChanged"
								org-unit-type-ids="[[orgUnitTypeIds]]"
								search-action="[[_enrollmentsSearchAction]]"
								search-url="[[_searchUrl]]">
							</d2l-search-widget-custom>

							<div id="filterAndSort">
								<d2l-dropdown id="filterDropdown">
									<button class="d2l-dropdown-opener dropdown-button" aria-labelledby="filterText">
										<span id="filterText" class="dropdown-opener-text">[[_filterText]]</span>
										<d2l-icon icon="tier1:chevron-down" aria-hidden="true"></d2l-icon>
									</button>
									<d2l-dropdown-content
										id="filterDropdownContent"
										on-d2l-dropdown-open="_onFilterDropdownOpen"
										on-d2l-dropdown-close="_onFilterDropdownClose"
										no-padding
										min-width="350"
										render-content>

										<d2l-filter-menu
											id="filterMenu"
											on-d2l-filter-menu-change="_onFilterChanged"
											tab-search-type="[[tabSearchType]]"
											org-unit-type-ids="[[orgUnitTypeIds]]"
											my-enrollments-entity="[[_myEnrollmentsEntity]]"
											filter-standard-semester-name="[[filterStandardSemesterName]]"
											filter-standard-department-name="[[filterStandardDepartmentName]]">
										</d2l-filter-menu>
									</d2l-dropdown-content>
								</d2l-dropdown>

								<d2l-dropdown id="sortDropdown" on-d2l-menu-item-change="_onSortOrderChanged">
									<button class="d2l-dropdown-opener dropdown-button" aria-labelledby="sortText">
										<span id="sortText" class="dropdown-opener-text">[[localize('sorting.sortDefault')]]</span>
										<d2l-icon icon="tier1:chevron-down" aria-hidden="true"></d2l-icon>
									</button>
									<d2l-dropdown-menu no-padding="" min-width="350">
										<d2l-menu id="sortDropdownMenu" label="[[localize('sorting.sortBy')]]">
											<div class="dropdown-content-header">
												<span>[[localize('sorting.sortBy')]]</span>
											</div>
											<d2l-menu-item-radio class="dropdown-content-gradient" value="Default" text="[[localize('sorting.sortDefault')]]"></d2l-menu-item-radio>
											<d2l-menu-item-radio value="OrgUnitName" text="[[localize('sorting.sortCourseName')]]"></d2l-menu-item-radio>
											<d2l-menu-item-radio value="OrgUnitCode" text="[[localize('sorting.sortCourseCode')]]"></d2l-menu-item-radio>
											<d2l-menu-item-radio value="PinDate" text="[[localize('sorting.sortDatePinned')]]"></d2l-menu-item-radio>
											<d2l-menu-item-radio value="LastAccessed" text="[[localize('sorting.sortLastAccessed')]]"></d2l-menu-item-radio>
											<d2l-menu-item-radio value="EnrollmentDate" text="[[localize('sorting.sortEnrollmentDate')]]"></d2l-menu-item-radio>
										</d2l-menu>
									</d2l-dropdown-menu>
								</d2l-dropdown>
							</div>
						</div>
						<div class="search-and-filter-row advanced-search-link" hidden$="[[!_showAdvancedSearchLink]]">
							<d2l-link href$="[[advancedSearchUrl]]">[[localize('advancedSearch')]]</d2l-link>
						</div>
					</div>

					<d2l-alert hidden$="[[!showImageError]]" type="warning">
						[[localize('error.settingImage')]]
					</d2l-alert>

					<template is="dom-if" if="[[_showGroupByTabs]]">
						<d2l-tabs>
							<template items="[[tabSearchActions]]" is="dom-repeat">
								<d2l-tab-panel id="all-courses-tab-[[item.name]]" text="[[item.title]]" selected="[[item.selected]]">
									<div hidden$="[[!_showTabContent]]">
										<d2l-my-courses-card-grid token="[[token]]" presentation-url="[[presentationUrl]]">
											<span id="infoMessage" hidden$="[[!_infoMessageText]]">
												[[_infoMessageText]]
											</span>
										</d2l-my-courses-card-grid>
									</div>
									<d2l-loading-spinner hidden$="[[_showTabContent]]" size="100">
									</d2l-loading-spinner>
								</d2l-tab-panel>
							</template>
						</d2l-tabs>
					</template>
					<template is="dom-if" if="[[!_showGroupByTabs]]">
						<d2l-my-courses-card-grid token="[[token]]" presentation-url="[[presentationUrl]]">
							<span id="infoMessage" hidden$="[[!_infoMessageText]]">
								[[_infoMessageText]]
							</span>
						</d2l-my-courses-card-grid>
					</template>
					<d2l-loading-spinner id="lazyLoadSpinner" hidden$="[[!_hasMoreEnrollments]]" size="100">
					</d2l-loading-spinner>
				</div>
				<d2l-loading-spinner hidden$="[[_showContent]]" size="100">
				</d2l-loading-spinner>
			</d2l-simple-overlay>`;
	}

	connectedCallback() {
		super.connectedCallback();

		this.addEventListener('d2l-tab-panel-selected', this._onTabSelected);
		this._filterText = this.localize('filtering.filter');
	}

	/*
	* Public API methods
	*/

	courseEnrollmentChanged(newValue) {
		if (this._showGroupByTabs) {
			this._bustCacheToken = Math.random();
			const actionName = this._selectedTabId.replace('all-courses-tab-', '');
			if (!newValue.isPinned && actionName === Actions.enrollments.searchMyPinnedEnrollments && this._searchUrl) {
				this._searchUrl = this._appendOrUpdateBustCacheQueryString(this._searchUrl);
			}
		}

		this._hasEnrollmentsChanged = true;
	}

	load() {
		this.$['all-courses-scroll-threshold'].scrollTarget = this.$['all-courses'].scrollRegion;
		this.$['all-courses-scroll-threshold'].clearTriggers();
		if (this._showGroupByTabs) {
			return;
		}
		this._showTabContent = true;

		if (!this.enrollmentsSearchAction) {
			return;
		}

		this._searchUrl = this._appendOrUpdateBustCacheQueryString(
			this.createActionUrl(this.enrollmentsSearchAction, {
				autoPinCourses: false,
				orgUnitTypeId: this.orgUnitTypeIds,
				embedDepth: 0,
				sort: this._sortMap[0].action,
				promotePins: this._sortMap[0].promotePins
			})
		);
	}

	open() {
		// Initially hide the content, until we have some data to show
		// (set back to true in _onSearchResultsChanged). The exception
		// to this is when the overlay is closed then reopened - we want
		// to immediately show the already-loaded content.
		this._showContent = !!this._searchUrl;

		this.shadowRoot.querySelector('#all-courses').open();
		this.load();
	}

	// After a user-uploaded image is set, this is called to try to update the image
	refreshCardGridImages(organization) {
		this._getCardGrid().refreshCardGridImages(organization);
	}

	_getCardGrid() {
		return this._showGroupByTabs
			? this.shadowRoot.querySelector(`#${this._selectedTabId} d2l-my-courses-card-grid`)
			: this.shadowRoot.querySelector('d2l-my-courses-card-grid');
	}

	/*
	* Listeners
	*/

	_onAllCoursesLowerThreshold() {
		if (this.$['all-courses'].opened && this._lastEnrollmentsSearchResponse) {
			const lastResponseEntity = this._lastEnrollmentsSearchResponse;
			if (!lastResponseEntity._entity) {
				if (lastResponseEntity && lastResponseEntity.hasLinkByRel('next')) {
					const url = lastResponseEntity.getLinkByRel('next').href;
					this.$.lazyLoadSpinner.scrollIntoView();
					entityFactory(EnrollmentCollectionEntity, url, this.token, entity => {
						if (entity) {
							this._updateFilteredEnrollments(entity, true);
						}
					});
				}
			}
			else {
				if (lastResponseEntity && lastResponseEntity._entity.hasLinkByRel('next')) {
					const url = lastResponseEntity._entity.getLinkByRel('next').href;
					this.$.lazyLoadSpinner.scrollIntoView();
					entityFactory(EnrollmentCollectionEntity, url, this.token, entity => {
						if (entity) {
							this._updateFilteredEnrollments(entity, true);
						}
					});
				}
			}
		}
	}

	_onFilterChanged(e) {
		this._searchUrl = this._appendOrUpdateBustCacheQueryString(e.detail.url);
		this._filterCounts = e.detail.filterCounts;
		this._totalFilterCount = this._filterCounts.departments + this._filterCounts.semesters + this._filterCounts.roles;
	}

	_onFilterDropdownClose() {
		let text;
		if (this._totalFilterCount === 0) {
			text = this.localize('filtering.filter');
		} else if (this._totalFilterCount === 1) {
			text = this.localize('filtering.filterSingle');
		} else {
			text = this.localize('filtering.filterMultiple', 'num', this._totalFilterCount);
		}
		this.set('_filterText', text);
	}

	_onFilterDropdownOpen() {
		this.set('_filterText', this.localize('filtering.filter'));
		return this.$.filterMenu.open();
	}

	_onSortOrderChanged(e) {
		const sortData = this._mapSortOption(e.detail.value, 'name');

		this._searchUrl = this._appendOrUpdateBustCacheQueryString(
			this.createActionUrl(this._enrollmentsSearchAction, {
				sort: sortData.action,
				orgUnitTypeId: this.orgUnitTypeIds,
				promotePins: sortData.promotePins
			})
		);

		this.$.sortText.textContent = this.localize(sortData.langterm || '');
		this.$.sortDropdown.toggleOpen();
	}

	_onSearchResultsChanged(e) {
		this._isSearched = !!e.detail.searchValue;
		this._updateFilteredEnrollments(e.detail.searchResponse, false);
		this._myEnrollmentsEntity = e.detail.searchResponse;

		this._showContent = true;
		this._showTabContent = true;

		setTimeout(() => {
			// Triggers the course tiles to resize after switching tab
			window.dispatchEvent(new Event('resize'));
		}, 10);
	}

	_onSimpleOverlayOpening() {
		if (this._hasEnrollmentsChanged) {
			this._hasEnrollmentsChanged = false;
			this._bustCacheToken = Math.random();
			if (this._searchUrl) {
				this._searchUrl = this._appendOrUpdateBustCacheQueryString(this._searchUrl);
			}
		}
	}

	_onSimpleOverlayClosed() {
		if (this._enrollmentsSearchAction && this._enrollmentsSearchAction.hasFieldByName) {
			if (this._enrollmentsSearchAction.hasFieldByName('search')) {
				this._enrollmentsSearchAction.getFieldByName('search').value = '';
			}
			if (this._enrollmentsSearchAction.hasFieldByName('sort')) {
				this._enrollmentsSearchAction.getFieldByName('sort').value = this._sortMap[0].action;
			}
			if (this._enrollmentsSearchAction.hasFieldByName('promotePins')) {
				this._enrollmentsSearchAction.getFieldByName('promotePins').value = this._sortMap[0].promotePins;
			}
		}

		this._clearSearchWidget();
		this.$.filterMenu.clearFilters();
		this._filterText = this.localize('filtering.filter');
		this._resetSortDropdown();
	}

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

		const search = this._enrollmentsSearchAction && this._enrollmentsSearchAction.getFieldByName('search') ?
			this._enrollmentsSearchAction.getFieldByName('search').value : '';

		const sort = this._enrollmentsSearchAction && this._enrollmentsSearchAction.getFieldByName('sort') ?
			this._enrollmentsSearchAction.getFieldByName('sort').value : this._sortMap[0].action;

		const sortData = this._mapSortOption(sort, 'action');

		this._showTabContent = false;
		const params = {
			search: search,
			orgUnitTypeId: this.orgUnitTypeIds,
			autoPinCourses: false,
			sort: sortData.action,
			embedDepth: 0,
			promotePins: sortData.promotePins
		};
		if ((this._filterCounts.departments > 0 || this._filterCounts.semesters > 0) && this._enrollmentsSearchAction && this._enrollmentsSearchAction.getFieldByName('parentOrganizations')) {
			params.parentOrganizations =  this._enrollmentsSearchAction.getFieldByName('parentOrganizations').value;
		}
		if (this._filterCounts.roles > 0 && this._enrollmentsSearchAction && this._enrollmentsSearchAction.getFieldByName('roles')) {
			params.roles =  this._enrollmentsSearchAction.getFieldByName('roles').value;
		}

		this._searchUrl = this._appendOrUpdateBustCacheQueryString(
			this.createActionUrl(tabAction.enrollmentsSearchAction, params)
		);
	}

	/*
	* Observers
	*/

	_myEnrollmentsEntityChanged(entity) {
		const myEnrollmentsEntity = SirenParse(entity);
		if (!myEnrollmentsEntity.hasActionByName(Actions.enrollments.searchMyEnrollments)) {
			return;
		}

		const searchAction = myEnrollmentsEntity.getActionByName(Actions.enrollments.searchMyEnrollments);
		this._enrollmentsSearchAction = searchAction;

		if (searchAction && searchAction.hasFieldByName('sort')) {
			const sortParameter = searchAction.getFieldByName('sort').value;
			if (!sortParameter) {
				return;
			}

			const sortData = this._mapSortOption(sortParameter, 'action');

			this.$.sortText.textContent = this.localize(sortData.langterm || '');
			this._selectSortOption(sortData.name);
		}
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
			return `${url}${(url.indexOf('?') !== -1 ? '&' : '?')}bustCache=${this._bustCacheToken}`;
		}

		index += bustCacheStr.length;
		const prefix = url.substring(0, index);
		let suffix = url.substring(index, url.length);
		index = suffix.indexOf('&');
		suffix = index === -1 ? '' : suffix.substring(index, suffix.length);
		return prefix + this._bustCacheToken + suffix;
	}

	_clearSearchWidget() {
		this.$['search-widget'].clear();
	}

	_computeHasMoreEnrollments(lastResponse, showTabContent) {
		if (!showTabContent) {
			return false;
		}

		lastResponse = SirenParse(lastResponse);
		return lastResponse.hasLinkByRel('next');
	}

	_computeShowAdvancedSearchLink(link) {
		return !!link;
	}

	_computeShowGroupByTabs(tabLength) {
		return tabLength > 0;
	}

	_mapSortOption(identifier, identifierName) {
		let i = 0;
		for (i = 0; i < this._sortMap.length; i += 1) {
			if (this._sortMap[i][identifierName] === identifier) {
				return this._sortMap[i];
			}
		}

		return this._sortMap[0];
	}

	_resetSortDropdown() {
		this._selectSortOption(this._sortMap[0].name);

		const content = this.$.sortDropdown.__getContentElement();
		if (content) {
			content.close();
		}
	}

	_selectSortOption(sortName) {
		const items = this.$.sortDropdownMenu.querySelectorAll('d2l-menu-item-radio');
		for (let i = 0; i < items.length; i++) {
			items[i].selected = false;
		}

		this.$.sortDropdownMenu.querySelector(`d2l-menu-item-radio[value=${sortName}]`).selected = true;
	}

	_updateFilteredEnrollments(enrollments, append) {
		let gridEntities;
		if (!enrollments._entity) {
			const enrollmentEntities = enrollments.getSubEntitiesByClass(Classes.enrollments.enrollment);
			gridEntities = enrollmentEntities.map((value) => {
				return value.href;
			});
		}
		else {
			gridEntities = enrollments.enrollmentsHref();
		}

		const cardGrid = this._getCardGrid();
		if (append) {
			cardGrid.filteredEnrollments = cardGrid.filteredEnrollments.concat(gridEntities);
		} else {
			cardGrid.filteredEnrollments = gridEntities;
		}

		this._updateInfoMessage(cardGrid.filteredEnrollments.length);

		this._lastEnrollmentsSearchResponse = enrollments;
		requestAnimationFrame(() => {
			window.dispatchEvent(new Event('resize')); // doing this so ie11 and older edge browser will get ms-grid style assigned
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
			if (this._totalFilterCount === 1) {
				if (this._filterCounts.departments === 1) {
					this._infoMessageText = this.localize('noCoursesInDepartment');
				} else if (this._filterCounts.semesters === 1) {
					this._infoMessageText = this.localize('noCoursesInSemester');
				} else if (this._filterCounts.roles === 1) {
					this._infoMessageText = this.localize('noCoursesInRole');
				}
				return;
			}
			if (this._totalFilterCount > 1) {
				this._infoMessageText = this.localize('noCoursesInSelection');
				return;
			}
		}
	}
}

window.customElements.define(AllCourses.is, AllCourses);
