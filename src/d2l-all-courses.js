/*
`d2l-all-courses`
Polymer-based web component for the all courses overlay.
*/

import '@polymer/iron-scroll-threshold/iron-scroll-threshold.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/dropdown/dropdown.js';
import '@brightspace-ui/core/components/dropdown/dropdown-content.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/link/link.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item-radio.js';
import 'd2l-alert/d2l-alert.js';
import 'd2l-organization-hm-behavior/d2l-organization-hm-behavior.js';
import 'd2l-simple-overlay/d2l-simple-overlay.js';
import 'd2l-tabs/d2l-tabs.js';
import './card-grid/d2l-all-courses-content.js';
import './d2l-alert-behavior.js';
import './d2l-utility-behavior.js';
import './localize-behavior.js';
import './search-filter/d2l-filter-menu.js';
import './search-filter/d2l-search-widget-custom.js';
import { Actions, Classes } from 'd2l-hypermedia-constants';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { entityFactory } from 'siren-sdk/src/es6/EntityFactory.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import SirenParse from 'siren-parser';

class AllCourses extends mixinBehaviors([
	D2L.PolymerBehaviors.Hypermedia.OrganizationHMBehavior,
	D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
	D2L.MyCourses.AlertBehavior,
	D2L.MyCourses.UtilityBehavior
], PolymerElement) {

	static get is() { return 'd2l-all-courses'; }

	static get properties() {
		return {
			/*
			* Public Polymer properties
			*/
			showOrganizationCode: {
				type: Boolean,
				value: false
			},
			showSemesterName: {
				type: Boolean,
				value: false
			},
			hideCourseStartDate: {
				type: Boolean,
				value: false
			},
			hideCourseEndDate: {
				type: Boolean,
				value: false
			},
			showDropboxUnreadFeedback: {
				type: Boolean,
				value: false
			},
			showUnattemptedQuizzes: {
				type: Boolean,
				value: false
			},
			showUngradedQuizAttempts: {
				type: Boolean,
				value: false
			},
			showUnreadDiscussionMessages: {
				type: Boolean,
				value: false
			},
			showUnreadDropboxSubmissions: {
				type: Boolean,
				value: false
			},
			// URL that directs to the advanced search page
			advancedSearchUrl: String,
			// Default option in Sort menu
			_defaultSortValue: {
				type: String,
				value: 'Default'
			},
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
			// Siren Actions corresponding to each tab that is displayed
			tabSearchActions: {
				type: Array,
				value: function() { return []; }
			},
			// Type of tabs being displayed (BySemester, ByDepartment, ByRoleAlias)
			tabSearchType: String,
			hasEnrollmentsChanged: {
				type: Boolean,
				value: false
			},
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
				computed: '_computeShowGroupByTabs(tabSearchActions)'
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
			_selectedTabId: String
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
			</style>

			<d2l-simple-overlay
				id="all-courses"
				title-name="[[localize('allCourses')]]"
				close-simple-overlay-alt-text="[[localize('closeSimpleOverlayAltText')]]"
				with-backdrop=""
				restore-focus-on-close="">

				<div hidden$="[[!_showContent]]">
					<iron-scroll-threshold id="all-courses-scroll-threshold" on-lower-threshold="_onAllCoursesLowerThreshold">
					</iron-scroll-threshold>

					<div id="search-and-filter">
						<div class="search-and-filter-row">
							<d2l-search-widget-custom
								id="search-widget"
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
									<d2l-dropdown-content id="filterDropdownContent" no-padding="" min-width="350" render-content="">
										<d2l-filter-menu
											id="filterMenu"
											tab-search-type="[[tabSearchType]]"
											org-unit-type-ids="[[orgUnitTypeIds]]"
											my-enrollments-entity="[[_myEnrollmentsEntity]]"
											filter-standard-semester-name="[[filterStandardSemesterName]]"
											filter-standard-department-name="[[filterStandardDepartmentName]]">
										</d2l-filter-menu>
									</d2l-dropdown-content>
								</d2l-dropdown>

								<d2l-dropdown id="sortDropdown">
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

					<template is="dom-repeat" items="[[_alertsView]]">
						<d2l-alert type="[[item.alertType]]">
							[[item.alertMessage]]
						</d2l-alert>
					</template>

					<template is="dom-if" if="[[_showGroupByTabs]]">
						<d2l-tabs>
							<template items="[[tabSearchActions]]" is="dom-repeat">
								<d2l-tab-panel id="all-courses-tab-[[item.name]]" text="[[item.title]]" selected="[[item.selected]]">
									<div hidden$="[[!_showTabContent]]">
										<d2l-all-courses-content
											total-filter-count="[[_totalFilterCount]]"
											filter-counts="[[_filterCounts]]"
											is-searched="[[_isSearched]]"
											token="[[token]]"
											org-unit-type-ids="[[orgUnitTypeIds]]"
											show-organization-code="[[showOrganizationCode]]"
											show-semester-name="[[showSemesterName]]"
											show-dropbox-unread-feedback="[[showDropboxUnreadFeedback]]"
											show-unattempted-quizzes="[[showUnattemptedQuizzes]]"
											show-ungraded-quiz-attempts="[[showUngradedQuizAttempts]]"
											show-unread-discussion-messages="[[showUnreadDiscussionMessages]]"
											show-unread-dropbox-submissions="[[showUnreadDropboxSubmissions]]"
											hide-course-start-date="[[hideCourseStartDate]]"
											hide-course-end-date="[[hideCourseEndDate]]">
										</d2l-all-courses-content>
									</div>
									<d2l-loading-spinner hidden$="[[_showTabContent]]" size="100">
									</d2l-loading-spinner>
								</d2l-tab-panel>
							</template>
						</d2l-tabs>
					</template>
					<template is="dom-if" if="[[!_showGroupByTabs]]">
						<d2l-all-courses-content
							total-filter-count="[[_totalFilterCount]]"
							filter-counts="[[_filterCounts]]"
							is-searched="[[_isSearched]]"
							token="[[token]]"
							org-unit-type-ids="[[orgUnitTypeIds]]"
							show-organization-code="[[showOrganizationCode]]"
							show-semester-name="[[showSemesterName]]"
							show-dropbox-unread-feedback="[[showDropboxUnreadFeedback]]"
							show-unattempted-quizzes="[[showUnattemptedQuizzes]]"
							show-ungraded-quiz-attempts="[[showUngradedQuizAttempts]]"
							show-unread-discussion-messages="[[showUnreadDiscussionMessages]]"
							show-unread-dropbox-submissions="[[showUnreadDropboxSubmissions]]"
							hide-course-start-date="[[hideCourseStartDate]]"
							hide-course-end-date="[[hideCourseEndDate]]">
						</d2l-all-courses-content>
					</template>
					<d2l-loading-spinner id="lazyLoadSpinner" hidden$="[[!_hasMoreEnrollments]]" size="100">
					</d2l-loading-spinner>
				</div>
				<d2l-loading-spinner hidden$="[[_showContent]]" size="100">
				</d2l-loading-spinner>
			</d2l-simple-overlay>`;
	}

	ready() {
		super.ready();
		this._onSortOrderChanged = this._onSortOrderChanged.bind(this);
		this._onFilterDropdownOpen = this._onFilterDropdownOpen.bind(this);
		this._onFilterDropdownClose = this._onFilterDropdownClose.bind(this);
		this._onFilterChanged = this._onFilterChanged.bind(this);
		this._onSearchResultsChanged = this._onSearchResultsChanged.bind(this);
		this._onSetCourseImage = this._onSetCourseImage.bind(this);
	}

	connectedCallback() {
		super.connectedCallback();
		afterNextRender(this, () => {
			this.addEventListener('d2l-simple-overlay-opening', this._onSimpleOverlayOpening);
			this.addEventListener('d2l-tab-panel-selected', this._onTabSelected);
			this.addEventListener('d2l-course-pinned-change', this._onEnrollmentPinned);

			this.shadowRoot.querySelector('#sortDropdown').addEventListener('d2l-menu-item-change', this._onSortOrderChanged);
			this.shadowRoot.querySelector('#filterDropdownContent').addEventListener('d2l-dropdown-open', this._onFilterDropdownOpen);
			this.shadowRoot.querySelector('#filterDropdownContent').addEventListener('d2l-dropdown-close', this._onFilterDropdownClose);
			this.shadowRoot.querySelector('#filterMenu').addEventListener('d2l-filter-menu-change', this._onFilterChanged);
			this.shadowRoot.querySelector('#search-widget').addEventListener('d2l-search-widget-results-changed', this._onSearchResultsChanged);

			document.body.addEventListener('set-course-image', this._onSetCourseImage);
		});
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		document.body.removeEventListener('set-course-image', this._onSetCourseImage);
	}

	/*
	* Public API methods
	*/

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
				sort: this._sortParameter || 'Current'
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

	_onSetCourseImage(details) {
		this._removeAlert('setCourseImageFailure');

		if (details && details.detail) {
			if (details.detail.status === 'failure') {
				setTimeout(() => {
					this._addAlert('warning', 'setCourseImageFailure', this.localize('error.settingImage'));
				}, 1000); // delay until the tile fail icon animation begins to kick in (1 sec delay)
			}
		}
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
		let sortParameter, langterm;
		let promotePins = false;

		switch (e.detail.value) {
			case 'OrgUnitName':
				langterm = 'sorting.sortCourseName';
				sortParameter = 'OrgUnitName,OrgUnitId';
				break;
			case 'OrgUnitCode':
				langterm = 'sorting.sortCourseCode';
				sortParameter = 'OrgUnitCode,OrgUnitId';
				break;
			case 'PinDate':
				langterm = 'sorting.sortDatePinned';
				sortParameter = '-PinDate,OrgUnitId';
				promotePins = true;
				break;
			case 'LastAccessed':
				langterm = 'sorting.sortLastAccessed';
				sortParameter = 'LastAccessed';
				break;
			case 'EnrollmentDate':
				langterm = 'sorting.sortEnrollmentDate';
				sortParameter = '-LastModifiedDate,OrgUnitId';
				break;
			case 'Default':
				langterm = 'sorting.sortDefault';
				sortParameter = 'Current';
				promotePins = true;
				break;
			default:
				langterm = 'sorting.sortDefault';
				sortParameter =  'Current';
				promotePins = true;
				break;
		}

		this._searchUrl = this._appendOrUpdateBustCacheQueryString(
			this.createActionUrl(this._enrollmentsSearchAction, {
				sort: sortParameter,
				orgUnitTypeId: this.orgUnitTypeIds,
				promotePins: promotePins
			})
		);

		this._sortParameter = sortParameter;
		this.$.sortText.textContent = this.localize(langterm || '');
		this.$.sortDropdown.toggleOpen();
	}

	_onSearchResultsChanged(e) {
		this._isSearched = !!e.detail.searchValue;
		this._updateFilteredEnrollments(e.detail.searchResponse, false);
		this._myEnrollmentsEntity = e.detail.searchResponse;
		this.fire('recalculate-columns');

		this._showContent = true;
		this._showTabContent = true;

		setTimeout(() => {
			// Triggers the course tiles to resize after switching tab
			window.dispatchEvent(new Event('resize'));
		}, 10);
	}

	_onSimpleOverlayOpening() {
		this._removeAlert('setCourseImageFailure');
		this._clearSearchWidget();
		this.$.filterMenu.clearFilters();
		this._filterText = this.localize('filtering.filter');
		this._resetSortDropdown();
		if (this.hasEnrollmentsChanged) {
			this._bustCacheToken = Math.random();
			this._searchUrl = this._appendOrUpdateBustCacheQueryString(this._searchUrl);
		}
	}

	_onTabSelected(e) {
		this._selectedTabId = e.composedPath()[0].id;
		const actionName = this._selectedTabId.replace('all-courses-tab-', '');
		let tabAction;
		for (let i = 0; i < this.tabSearchActions.length; i++) {
			if (this.tabSearchActions[i].name === actionName) {
				tabAction = this.tabSearchActions[i];
				break;
			}
		}
		const search = this._enrollmentsSearchAction && this._enrollmentsSearchAction.getFieldByName('search') ?
			this._enrollmentsSearchAction.getFieldByName('search').value : '';
		if (!tabAction) {
			return;
		}

		this._showTabContent = false;
		const params = {
			search: search,
			orgUnitTypeId: this.orgUnitTypeIds,
			autoPinCourses: false,
			sort: this._sortParameter || 'Current',
			embedDepth: 0
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

	_onEnrollmentPinned(e) {
		if (this._showGroupByTabs) {
			this._bustCacheToken = Math.random();
			const actionName = this._selectedTabId.replace('all-courses-tab-', '');
			if (!e.detail.isPinned &&  actionName === Actions.enrollments.searchMyPinnedEnrollments) {
				this._searchUrl = this._appendOrUpdateBustCacheQueryString(this._searchUrl);
			}
		}

		let orgUnitId;
		if (e.detail.orgUnitId) {
			orgUnitId = e.detail.orgUnitId;
		} else if (e.detail.organization) {
			orgUnitId = this._getOrgUnitIdFromHref(this.getEntityIdentifier(this.parseEntity(e.detail.organization)));
		} else if (e.detail.enrollment && e.detail.enrollment.organizationHref()) {
			orgUnitId = this._getOrgUnitIdFromHref(e.detail.enrollment.organizationHref());
		}

		this.dispatchEvent(new CustomEvent('d2l-course-enrollment-change', {
			bubbles: true,
			composed: true,
			detail: {
				orgUnitId: orgUnitId,
				isPinned: e.detail.isPinned
			}
		}));
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

			const sortMap = {
				'OrgUnitName,OrgUnitId': {
					name: 'OrgUnitName',
					langterm: 'sorting.sortCourseName'
				},
				'OrgUnitCode,OrgUnitId': {
					name: 'OrgUnitCode',
					langterm: 'sorting.sortCourseCode'
				},
				'-PinDate,OrgUnitId': {
					name: 'PinDate',
					langterm: 'sorting.sortDatePinned'
				},
				'LastAccessed': {
					name: 'LastAccessed',
					langterm: 'sorting.sortLastAccessed'
				},
				'-LastModifiedDate,OrgUnitId': {
					name: 'EnrollmentDate',
					langterm: 'sorting.sortEnrollmentDate'
				},
				'Current': {
					name: 'Default',
					langterm: 'sorting.sortDefault'
				}
			};

			const sort = sortMap[sortParameter];
			if (sort) {
				this.$.sortText.textContent = this.localize(sort.langterm || '');
				this._selectSortOption(sort.name);
				this._sortParameter = sortParameter;
			} else {
				this.$.sortText.textContent = this.localize('sorting.sortDefault');
				this._selectSortOption(this._defaultSortValue);
			}
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

	_computeShowGroupByTabs(groups) {
		return groups.length > 2 || (groups.length > 0 && !this._enrollmentsSearchAction);
	}

	_resetSortDropdown() {
		this._selectSortOption(this._defaultSortValue);

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
		let gridEntities, content;
		if (!enrollments._entity) {
			const enrollmentEntities = enrollments.getSubEntitiesByClass(Classes.enrollments.enrollment);
			gridEntities = enrollmentEntities.map((value) => {
				return value.href;
			});
			content = this._showGroupByTabs
				? this.shadowRoot.querySelector(`#${this._selectedTabId} d2l-all-courses-content`)
				: this.shadowRoot.querySelector('d2l-all-courses-content');
			if (append) {
				content.filteredEnrollments = content.filteredEnrollments.concat(gridEntities);
			} else {
				content.filteredEnrollments = gridEntities;
			}
		}
		else {
			gridEntities = enrollments.enrollmentsHref();
			content = this._showGroupByTabs
				? this.shadowRoot.querySelector(`#${this._selectedTabId} d2l-all-courses-content`)
				: this.shadowRoot.querySelector('d2l-all-courses-content');
			if (append) {
				content.filteredEnrollments = content.filteredEnrollments.concat(gridEntities);
			} else {
				content.filteredEnrollments = gridEntities;
			}
		}

		this._lastEnrollmentsSearchResponse = enrollments;
		requestAnimationFrame(() => {
			window.dispatchEvent(new Event('resize')); // doing this so ie11 and older edge browser will get ms-grid style assigned
			this.$['all-courses-scroll-threshold'].clearTriggers();
		});
	}

	_getOrgUnitIdFromHref(organizationHref) {
		const match = /[0-9]+$/.exec(organizationHref);

		if (!match) {
			return;
		}
		return match[0];
	}

}

window.customElements.define(AllCourses.is, AllCourses);
