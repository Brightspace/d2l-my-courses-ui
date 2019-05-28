import '@polymer/polymer/polymer-legacy.js';
import 'd2l-polymer-siren-behaviors/store/entity-behavior.js';
import './d2l-utility-behavior.js';
import './localize-behavior.js';
import { UserSettingsEntity } from 'siren-sdk/src/userSettings/UserSettingsEntity';
import { PromotedSearchEntity } from 'siren-sdk/src/promotedSearch/PromotedSearchEntity.js';
import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { entityFactory } from 'siren-sdk/src/es6/EntityFactory.js';
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

/*
* TODO: This was a Common behavior shared between d2l-my-courses-container and d2l-my-courses-legacy.
* Now that the code path has been split, this can be merged back into d2l-my-courses-container.
*
* @polymerBehavior D2L.MyCourses.MyCoursesBehavior
*/
D2L.MyCourses.MyCoursesBehaviorImpl = {
	properties: {
		// URL that directs to the advanced search page
		advancedSearchUrl: String,
		// URL that is called by the widget to fetch enrollments
		enrollmentsUrl: String,
		// URL that is called by the widget to fetch results from the course image catalog
		imageCatalogLocation: String,
		// Configuration value passed in to toggle course code -- passed to animation tile
		showCourseCode: Boolean,
		// Configuration value passed in to toggle Learning Paths code
		orgUnitTypeIds: String,
		// Configuration value passed in to toggle semester on course tile -- passed to animation tile
		showSemester: Boolean,
		// Standard Semester OU Type name to be displayed in the all-courses filter dropdown
		standardDepartmentName: String,
		// Standard Department OU Type name to be displayed in the all-courses filter dropdown
		standardSemesterName: String,
		// Types of notifications to include in update count in course tile -- passed to animation tile
		courseUpdatesConfig: Object,
		// Callback for upload in image-selector
		courseImageUploadCb: Function,
		// URL to fetch promoted searches for tabs
		promotedSearches: String,
		// URL to fetch a user's settings (e.g. default tab to select)
		userSettingsUrl: String,
		// URL to fetch widget settings
		presentationUrl: String,
		currentTabId: String,
		_enrollmentsSearchAction: Object,
		_pinnedTabAction: Object,
		_showGroupByTabs: {
			type: Boolean,
			computed: '_computeShowGroupByTabs(_tabSearchActions)'
		},
		_tabSearchActions: {
			type: Array,
			value: []
		},
		_tabSearchType: String,
		_changedCourseEnrollment: Object,
		_updateUserSettingsAction: Object,
		_enrollmentCollectionEntity: Object,
		_userSettingsEntity: Object,
		_promotedSearch: Object
	},
	_computeShowGroupByTabs: function(groups) {
		return groups.length >= 2 || (groups.length > 0 && !this._enrollmentsSearchAction);
	},
	listeners: {
		'd2l-course-enrollment-change': '_onCourseEnrollmentChange',
		'd2l-tab-changed': '_tabSelectedChanged'
	},
	attached: function() {
		if (!this.enrollmentsUrl || !this.userSettingsUrl) {
			return;
		}

		this._setEnrollmentCollectionEntity(this.enrollmentsUrl);
		this._setUserSettingsEntity(this.userSettingsUrl);
	},

	_onEnrollmentAndUserSettingsEntityChange: function() {
		if (!this._enrollmentCollectionEntity || !this._userSettingsEntity) {
			return;
		}
		var enrollmentsRootEntity = this._enrollmentCollectionEntity;
		var userSettingsEntity = this._userSettingsEntity;

		if (enrollmentsRootEntity.searchMyEnrollmentsAction()) {
			this._enrollmentsSearchAction = enrollmentsRootEntity.searchMyEnrollmentsAction();
		}

		if (enrollmentsRootEntity.searchMyPinnedEnrollmentsAction()) {
			this._pinnedTabAction = enrollmentsRootEntity.searchMyPinnedEnrollmentsAction();
		}

		if (userSettingsEntity.userSettingsHref()) {
			this.presentationUrl = userSettingsEntity.userSettingsHref();
		}

		this._updateUserSettingsAction = userSettingsEntity.userSettingsAction();

		this._fetchTabSearchActions();
	},
	_onPromotedSeachEntityChange: function() {
		if (!this._promotedSearchEntity || !this._userSettingsEntity) {
			return;
		}
		var promotedSearchesEntity = this._promotedSearchEntity;
		var userSettingsEntity = this._userSettingsEntity;

		this._tabSearchActions = [];

		if (!promotedSearchesEntity) {
			return;
		}

		if (promotedSearchesEntity.userEnrollmentsSearchType()) {
			this._tabSearchType = promotedSearchesEntity.userEnrollmentsSearchType();
		}

		if (!promotedSearchesEntity.actions()) {
			return;
		}

		var lastEnrollmentsSearchName = userSettingsEntity.mostRecentEnrollmentsSearchName();

		if (promotedSearchesEntity.actions().length > 1) {
			this._tabSearchActions = promotedSearchesEntity.actions().map(function(action) {
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

		var actions = [{
			name: this._enrollmentsSearchAction.name,
			title: this.localize('allTab'),
			selected: this._enrollmentsSearchAction.name === lastEnrollmentsSearchName,
			enrollmentsSearchAction: this._enrollmentsSearchAction
		}];

		if (this._pinnedTabAction) {
			actions = actions.concat({
				name: this._pinnedTabAction.name,
				title: this.localize('pinnedCourses'),
				selected: this._pinnedTabAction.name === lastEnrollmentsSearchName,
				enrollmentsSearchAction: this._pinnedTabAction
			});
		}

		this._tabSearchActions = actions.concat(this._tabSearchActions);
	},
	_setEnrollmentCollectionEntity: function(url) {
		return entityFactory(EnrollmentCollectionEntity, url, this.token, entity => {
			this._enrollmentCollectionEntity = entity;
			return this._onEnrollmentAndUserSettingsEntityChange();
		});
	},
	_setUserSettingsEntity: function(url) {
		return entityFactory(UserSettingsEntity, url, this.token, entity => {
			this._userSettingsEntity = entity;
			return this._onEnrollmentAndUserSettingsEntityChange();
		});
	},
	_setPromotedSearchEntity: function(url) {
		return entityFactory(PromotedSearchEntity, url, this.token, entity => {
			this._promotedSearchEntity = entity;
			return this._onPromotedSeachEntityChange();
		});
	},
	_onCourseEnrollmentChange: function(e) {
		this._changedCourseEnrollment = {
			orgUnitId: e.detail.orgUnitId,
			isPinned: e.detail.isPinned
		};
	},
	_tabSelectedChanged: function(e) {
		this.currentTabId = `panel-${e.detail.tabId}`;
	},
	courseImageUploadCompleted: function(success) {
		return this._fetchContentComponent().courseImageUploadCompleted(success);
	},
	getLastOrgUnitId: function() {
		return this._fetchContentComponent().getLastOrgUnitId();
	},
	_fetchContentComponent: function() {
		return this._showGroupByTabs === false || !this.currentTabId
			? this.$$('d2l-my-courses-content')
			: this.$$(`#${this.currentTabId} d2l-my-courses-content`);
	},
	_fetchTabSearchActions: function() {
		if (!this.userSettingsUrl) {
			return;
		}

		if (!this.promotedSearches && this._enrollmentsSearchAction && this._pinnedTabAction) {
			var lastEnrollmentsSearchName = this._userSettingsEntity.mostRecentEnrollmentsSearchName();

			this._tabSearchActions = [{
				name: this._enrollmentsSearchAction.name,
				title: this.localize('allTab'),
				selected: this._enrollmentsSearchAction.name === lastEnrollmentsSearchName,
				enrollmentsSearchAction: this._enrollmentsSearchAction
			}, {
				name: this._pinnedTabAction.name,
				title: this.localize('pinnedCourses'),
				selected: this._pinnedTabAction.name === lastEnrollmentsSearchName,
				enrollmentsSearchAction: this._pinnedTabAction
			}];
			return;
		}

		return this._setPromotedSearchEntity(this.promotedSearches);
	},
};

/*
* @polymerBehavior D2L.MyCourses.MyCoursesBehavior
*/
D2L.MyCourses.MyCoursesBehavior = [
	D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
	D2L.PolymerBehaviors.Siren.EntityBehavior,
	D2L.MyCourses.UtilityBehavior,
	D2L.MyCourses.MyCoursesBehaviorImpl
];
