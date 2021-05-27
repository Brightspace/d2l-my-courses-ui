/*
`d2l-my-courses-container`
Polymer-based web component for the my-courses widget that appears on the LE homepage.

Component for when the `d2l.Tools.MyCoursesWidget.UpdatedSortLogic` config variable is on, meaning the `updated-sort-logic` property is true.

*/

import '@brightspace-ui/core/components/dialog/dialog-fullscreen.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/tabs/tabs.js';
import '@brightspace-ui/core/components/tabs/tab-panel.js';
import '@polymer/iron-scroll-threshold/iron-scroll-threshold.js';
import 'd2l-image-selector/d2l-basic-image-selector.js';
import './d2l-all-courses.js';
import './d2l-my-courses-content.js';
import { createActionUrl, getEntityIdentifier, getOrgUnitIdFromHref, parseEntity } from './d2l-utility-helpers.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { entityFactory } from 'siren-sdk/src/es6/EntityFactory.js';
import { MyCoursesLocalizeBehavior } from './localize-behavior.js';
import { PromotedSearchEntity } from 'siren-sdk/src/promotedSearch/PromotedSearchEntity.js';
import { UserSettingsEntity } from 'siren-sdk/src/userSettings/UserSettingsEntity';

class MyCoursesContainer extends MyCoursesLocalizeBehavior(PolymerElement) {

	static get is() { return 'd2l-my-courses-container'; }

	static get properties() {
		return {
			// URL that directs to the advanced search page
			advancedSearchUrl: String,
			// URL that is called by the widget to fetch enrollments
			enrollmentsUrl: String,
			// URL that is called by the widget to fetch results from the course image catalog
			imageCatalogLocation: String,
			// Configuration value passed in to toggle Learning Paths code
			orgUnitTypeIds: String,
			// Standard Semester OU Type name to be displayed in the all-courses filter dropdown
			standardDepartmentName: String,
			// Standard Department OU Type name to be displayed in the all-courses filter dropdown
			standardSemesterName: String,
			// Callback for upload in image-selector
			courseImageUploadCb: Function,
			// URL to fetch promoted searches for tabs
			promotedSearches: String,
			// URL to fetch a user's settings (e.g. default tab to select)
			userSettingsUrl: String,
			// Token JWT Token for brightspace | a function that returns a JWT token for brightspace
			token: String,
			// URL to fetch widget settings
			_presentationUrl: String,
			_currentTabId: String,
			_enrollmentsSearchAction: Object,
			// Array form of orgUnitTypeIds
			_orgUnitTypeIds: Array,
			_pinnedTabAction: Object,
			_tabSearchActions: {
				type: Array,
				value: []
			},
			_tabSearchType: String,
			// Keep a record of the last changed course enrollment
			_changedCourseEnrollment: Object,
			_updateUserSettingsAction: Object,
			_enrollmentCollectionEntity: Object,
			_userSettingsEntity: Object,
			_promotedSearchEntity: Object,
			// The organization which the user is changing the course image of
			_setImageOrg: {
				type: Object,
				value: function() { return {}; }
			},
			// Hides loading spinner and shows tabs when true
			_showContent: {
				type: Boolean,
				value: false
			},
			// Set by the image-selector, controls whether to show a course image update error
			_showImageError: {
				type: Boolean,
				value: false
			}
		};
	}

	static get observers() {
		return [
			'_tokenChanged(token, enrollmentsUrl, userSettingsUrl)'
		];
	}

	static get template() {
		return html`
			<style>
				.spinner-container {
					display: flex;
					justify-content: center;
					align-items: center;
				}
				d2l-tabs[hidden] {
					display: none;
				}
			</style>

			<div class="spinner-container">
				<d2l-loading-spinner hidden$="[[_showContent]]" size="100">
				</d2l-loading-spinner>
			</div>
			<d2l-tabs hidden$="[[!_showContent]]" on-d2l-tab-panel-selected="_tabSelectedChanged">
				<template items="[[_tabSearchActions]]" is="dom-repeat">
					<!-- item.name is an OrgUnitId, and querySelector does not work with components with ids that start with a number -->
					<d2l-tab-panel id="panel-[[item.name]]" text="[[item.title]]" selected="[[item.selected]]">
						<d2l-my-courses-content
							on-d2l-my-courses-content-open-all-courses="_openAllCoursesOverlay"
							presentation-url="[[_presentationUrl]]"
							show-image-error="[[_showImageError]]"
							token="[[token]]"
							enrollments-search-action="[[item.enrollmentsSearchAction]]"
							org-unit-type-ids="[[_orgUnitTypeIds]]"
							tab-search-type="[[_tabSearchType]]"
							update-user-settings-action="[[_updateUserSettingsAction]]">
						</d2l-my-courses-content>
					</d2l-tab-panel>
				</template>
			</d2l-tabs>

			<d2l-all-courses
				on-d2l-all-courses-close="_onAllCoursesClose"
				advanced-search-url="[[advancedSearchUrl]]"
				filter-standard-department-name="[[standardDepartmentName]]"
				filter-standard-semester-name="[[standardSemesterName]]"
				org-unit-type-ids="[[_orgUnitTypeIds]]"
				presentation-url="[[_presentationUrl]]"
				show-image-error="[[_showImageError]]"
				tab-search-type="[[_tabSearchType]]"
				token="[[token]]">
			</d2l-all-courses>
			
			<d2l-dialog-fullscreen id="basic-image-selector-overlay"
				title-text="[[localize('changeImage')]]">
				<iron-scroll-threshold
					id="image-selector-threshold"
					on-lower-threshold="_onChangeImageLowerThreshold">
				</iron-scroll-threshold>
				<d2l-basic-image-selector
					image-catalog-location="[[imageCatalogLocation]]"
					organization="[[_setImageOrg]]"
					course-image-upload-cb="[[courseImageUploadCb]]">
				</d2l-basic-image-selector>
			</d2l-dialog-fullscreen>`;
	}

	constructor() {
		super();
		this._onCourseEnrollmentChange = this._onCourseEnrollmentChange.bind(this);
	}

	connectedCallback() {
		super.connectedCallback();

		this.addEventListener('open-change-image-view', this._onOpenChangeImageView);
		this.addEventListener('set-course-image', this._onSetCourseImage);
		this.addEventListener('clear-image-scroll-threshold', this._onClearImageScrollThreshold);

		document.body.addEventListener('d2l-course-pinned-change', this._onCourseEnrollmentChange);

		this.$['image-selector-threshold'].scrollTarget = this.$['basic-image-selector-overlay'].scrollRegion;

		let ouTypeIds = []; // default value
		try {
			ouTypeIds = JSON.parse(this.orgUnitTypeIds).value;
		} catch (e) {
			// default value used
		}

		this._orgUnitTypeIds = ouTypeIds;
	}

	disconnectedCallback() {
		document.body.removeEventListener('d2l-course-pinned-change', this._onCourseEnrollmentChange);
		super.disconnectedCallback();
	}

	// This is called by the LE, but only when it's a user-uploaded image
	// If it's a catalog image this is handled by the enrollment card
	courseImageUploadCompleted(success) {
		if (success) {
			this._setDialogOpen(false);

			const contentComponent = this._getContentComponent();
			if (contentComponent) {
				contentComponent.refreshCardGridImages(this._setImageOrg);
			}
			this._getAllCoursesComponent().refreshCardGridImages(this._setImageOrg);
		}
	}
	// This is called by the LE, but only when it's a user-uploaded image
	getLastOrgUnitId() {
		if (!this._setImageOrg.links) {
			return;
		}
		return getOrgUnitIdFromHref(getEntityIdentifier(this._setImageOrg));
	}

	/*
	* Changing Course Image Functions
	*/
	_onChangeImageLowerThreshold() {
		this.shadowRoot.querySelector('d2l-basic-image-selector').loadMore(this.$['image-selector-threshold']);
	}
	_onClearImageScrollThreshold() {
		this.$['image-selector-threshold'].clearTriggers();
	}
	_onOpenChangeImageView(e) {
		if (e.detail.organization) {
			this._setImageOrg = parseEntity(e.detail.organization);
		}

		this._setDialogOpen(true);
	}
	_onSetCourseImage(e) {
		this._setDialogOpen(false);
		this._showImageError = false;
		if (e && e.detail) {
			if (e.detail.status === 'failure') {
				setTimeout(() => {
					this._showImageError = true;
				}, 1000); // delay until the tile fail icon animation begins to kick in (1 sec delay)
			}
		}
	}

	_setDialogOpen(open) {
		const dialog = this.shadowRoot.querySelector('d2l-dialog-fullscreen');
		dialog.opened = open;
		const imageSelector = this.shadowRoot.querySelector('d2l-basic-image-selector');
		open ? imageSelector.initializeSearch() : imageSelector.clearSearch();
	}

	_getContentComponent() {
		return this.shadowRoot.querySelector(`#${this._currentTabId} d2l-my-courses-content`);
	}
	_getAllCoursesComponent() {
		return this.shadowRoot.querySelector('d2l-all-courses');
	}

	_openAllCoursesOverlay() {
		const allCourses = this._getAllCoursesComponent();
		// Make a deep copy of the tabSearchActions so we can modify it to remember All Courses's last selected tab
		// without affecting the selected tab on the main widget view
		const tabSearchActionsCopy = this._tabSearchActions.map(action => Object.assign({}, action));
		allCourses.tabSearchActions = tabSearchActionsCopy;
		allCourses.open();

		this._showImageError = false; // Clear image error when opening and closing the all courses overlay
	}
	_onAllCoursesClose() {
		this._showImageError = false; // Clear image error when opening and closing the all courses overlay
		const contentComponent = this._getContentComponent();
		if (contentComponent) {
			contentComponent.allCoursesOverlayClosed();
		}
	}

	_onEnrollmentAndUserSettingsEntityChange() {
		if (!this._enrollmentCollectionEntity || !this._userSettingsEntity) {
			return;
		}
		const enrollmentsRootEntity = this._enrollmentCollectionEntity;
		const userSettingsEntity = this._userSettingsEntity;

		if (enrollmentsRootEntity.searchMyEnrollmentsAction()) {
			this._enrollmentsSearchAction = enrollmentsRootEntity.searchMyEnrollmentsAction();
		}

		if (enrollmentsRootEntity.searchMyPinnedEnrollmentsAction()) {
			this._pinnedTabAction = enrollmentsRootEntity.searchMyPinnedEnrollmentsAction();
		}

		if (userSettingsEntity.userSettingsHref()) {
			// We need to bust the cache so the entity store will refetch the presentation details after widget settings are updated
			const url = userSettingsEntity.userSettingsHref();
			this._presentationUrl = `${url}${(url.indexOf('?') !== -1 ? '&' : '?')}bustCache=${Math.random()}`;
		}

		this._updateUserSettingsAction = userSettingsEntity.userSettingsAction();

		this._fetchTabSearchActions();
	}
	_onPromotedSearchEntityChange() {
		if (!this._promotedSearchEntity || !this._userSettingsEntity) {
			return;
		}
		const promotedSearchesEntity = this._promotedSearchEntity;
		const userSettingsEntity = this._userSettingsEntity;
		const lastEnrollmentsSearchName = userSettingsEntity.mostRecentEnrollmentsSearchName();

		this._tabSearchActions = [];

		this._showContent = true;
		if (!promotedSearchesEntity.actions()) {
			this._tabSearchActions = this._getPinTabAndAllTabActions(lastEnrollmentsSearchName);
			return;
		}

		if (promotedSearchesEntity.userEnrollmentsSearchType()) {
			this._tabSearchType = promotedSearchesEntity.userEnrollmentsSearchType();
		}

		// DE36672 - need to check here if there's only one semester/department/etc but you have
		// some courses that are not in any semester/department
		if (promotedSearchesEntity.actions().length > 1) {
			this._tabSearchActions = promotedSearchesEntity.actions().map((action) => {
				return {
					name: action.name,
					title: action.title,
					selected: action.name === lastEnrollmentsSearchName,
					enrollmentsSearchAction: action
				};
			});
		}

		if (!this._enrollmentsSearchAction) {
			return;
		}

		const actions = this._getPinTabAndAllTabActions(lastEnrollmentsSearchName);
		this._tabSearchActions = actions.concat(this._tabSearchActions);
	}
	_setEnrollmentCollectionEntity(url) {
		return entityFactory(EnrollmentCollectionEntity, url, this.token, entity => {
			this._enrollmentCollectionEntity = entity;
			return this._onEnrollmentAndUserSettingsEntityChange();
		});
	}
	_setUserSettingsEntity(url) {
		return entityFactory(UserSettingsEntity, url, this.token, entity => {
			this._userSettingsEntity = entity;
			return this._onEnrollmentAndUserSettingsEntityChange();
		});
	}
	_setPromotedSearchEntity(url) {
		return entityFactory(PromotedSearchEntity, url, this.token, entity => {
			this._promotedSearchEntity = entity;
			return this._onPromotedSearchEntityChange();
		});
	}
	_onCourseEnrollmentChange(e) {
		let orgUnitId;
		if (e.detail.orgUnitId) { // Pinning was done in the Course Selector
			orgUnitId = e.detail.orgUnitId;
		} else { // Pinning was done in the My Courses widget
			orgUnitId = getOrgUnitIdFromHref(e.detail.enrollment.organizationHref());
		}

		// Only update if something has changed
		// US117414 - Should investigate why we get the same event multiple times so we can remove this._changedCourseEnrollment altogether
		if (!this._changedCourseEnrollment || this._changedCourseEnrollment.orgUnitId !== orgUnitId || this._changedCourseEnrollment.isPinned !== e.detail.isPinned) {
			this._changedCourseEnrollment = {
				orgUnitId: orgUnitId,
				isPinned: e.detail.isPinned
			};

			const contents = this.shadowRoot.querySelectorAll('d2l-my-courses-content');
			contents.forEach(content => {
				content.courseEnrollmentChanged(this._changedCourseEnrollment);
			});

			this._getAllCoursesComponent().courseEnrollmentChanged(this._changedCourseEnrollment);

			if (this._pinnedTabAction) {
				if (e.detail.isPinned) {
					// We need to check if we need to add the pinned tab
					this._addPinnedTab();
				} else {
					// We need to check if we've removed the last pinned course and if so, remove the pinned tab
					this._verifyPinnedTab(this._pinnedTabAction);
				}
			}
		}
	}
	_tabSelectedChanged(e) {
		e.stopPropagation();
		this._currentTabId = e.composedPath()[0].id;

		let actionName;
		const contents = this.shadowRoot.querySelectorAll('d2l-my-courses-content');
		contents.forEach(content => {
			const name = content.newTabSelected(this._currentTabId);
			if (name) {
				actionName = name;
			}
		});

		// Whenever the selected tab changes, update tabSearchActions so
		// All Courses will have the same tab selected when it opens
		this._tabSearchActions = this._tabSearchActions.map((action) => {
			return Object.assign({}, action, {
				selected: action.name === actionName
			});
		});
	}
	_tokenChanged(token, enrollmentsUrl, userSettingsUrl) {
		if (token && enrollmentsUrl && userSettingsUrl) {
			this._setEnrollmentCollectionEntity(enrollmentsUrl);
			this._setUserSettingsEntity(userSettingsUrl);
		}
	}
	_getPinTabAndAllTabActions(lastEnrollmentsSearchName) {
		const actions = [];

		if (this._enrollmentsSearchAction) {
			actions.push({
				name: this._enrollmentsSearchAction.name,
				title: this.localize('allTab'),
				selected: this._enrollmentsSearchAction.name === lastEnrollmentsSearchName,
				enrollmentsSearchAction: this._enrollmentsSearchAction
			});
		}

		if (!this._pinnedTabAction) {
			return actions;
		}

		// Check cache to get our best guess about showing/hiding the pinned tab
		const pinnedTabCache = this._tryGetItemLocalStorage('myCourses.pinnedTab');

		if (pinnedTabCache && pinnedTabCache.previouslyShown) {
			actions.push(this._getPinnedTabAction(lastEnrollmentsSearchName));
		} else {
			// Do not add the pinned action
		}

		// Check actual value asynchronously
		this._verifyPinnedTab(this._pinnedTabAction);

		return actions;
	}
	_getPinnedTabAction(lastEnrollmentsSearchName) {
		return {
			name: this._pinnedTabAction.name,
			title: this.localize('pinnedCourses'),
			selected: this._pinnedTabAction.name === lastEnrollmentsSearchName,
			enrollmentsSearchAction: this._pinnedTabAction
		};
	}
	_fetchTabSearchActions() {
		if (!this.userSettingsUrl) {
			return;
		}

		if (!this.promotedSearches) {
			const lastEnrollmentsSearchName = this._userSettingsEntity.mostRecentEnrollmentsSearchName();
			this._tabSearchActions = this._getPinTabAndAllTabActions(lastEnrollmentsSearchName);
			this._showContent = true;
			return;
		}

		return this._setPromotedSearchEntity(this.promotedSearches);
	}
	_verifyPinnedTab(pinnedTabAction) {
		let pinnedSearchUrl = createActionUrl(pinnedTabAction);
		if (pinnedSearchUrl && pinnedSearchUrl.indexOf('?') > -1) {
			// pinnedSearchUrl already has some query params, append ours
			pinnedSearchUrl += `&bustCache=${Math.random()}`;
		} else {
			pinnedSearchUrl += `?bustCache=${Math.random()}`;
		}

		entityFactory(EnrollmentCollectionEntity, pinnedSearchUrl, this.token, entity => {
			if (!entity) {
				return;
			}

			const enrollmentEntities = entity.getEnrollmentEntities();
			if (enrollmentEntities && enrollmentEntities.length > 0) {
				this._addPinnedTab();
			} else {
				this._removePinnedTab();
			}
		});
	}
	_addPinnedTab() {
		const pinnedTabIndex = this._tabSearchActions.findIndex(action => action.name === this._pinnedTabAction.name);
		if (pinnedTabIndex === -1) {
			this.splice('_tabSearchActions', 1, 0, this._getPinnedTabAction());

			const allCourses = this._getAllCoursesComponent();
			if (allCourses.tabSearchActions && allCourses.tabSearchActions.length > 0) {
				allCourses.splice('tabSearchActions', 1, 0, this._getPinnedTabAction());
			}

			const contents = this.shadowRoot.querySelectorAll('d2l-my-courses-content');
			contents.forEach(content => {
				content.requestRefresh();
			});
		}
		this._trySetItemLocalStorage('myCourses.pinnedTab', { 'previouslyShown': true });
	}
	_removePinnedTab() {
		const pinnedTabIndex = this._tabSearchActions.findIndex(action => action.name === this._pinnedTabAction.name);
		if (pinnedTabIndex !== -1) {
			this.splice('_tabSearchActions', pinnedTabIndex, 1);

			const allCourses = this._getAllCoursesComponent();
			if (allCourses.tabSearchActions && allCourses.tabSearchActions.length > 0) {
				allCourses.splice('tabSearchActions', pinnedTabIndex, 1);
			}

			const contents = this.shadowRoot.querySelectorAll('d2l-my-courses-content');
			contents.forEach(content => {
				content.requestRefresh();
			});
		}
		this._trySetItemLocalStorage('myCourses.pinnedTab', { 'previouslyShown': false });
	}
	_tryGetItemLocalStorage(itemName) {
		try {
			return JSON.parse(localStorage.getItem(itemName));
		} catch (_) {
			//noop if local storage isn't available or has bad data
			return;
		}
	}
	_trySetItemLocalStorage(itemName, value) {
		try {
			const itemCopied = JSON.parse(JSON.stringify(value));
			localStorage.setItem(itemName, JSON.stringify(itemCopied));
		} catch (_) {
			//noop we don't want to blow up if we exceed a quota or are in safari private browsing mode
		}
	}
}

window.customElements.define(MyCoursesContainer.is, MyCoursesContainer);
