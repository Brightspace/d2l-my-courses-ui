/*
`d2l-my-courses-container`
Polymer-based web component for the my-courses widget that appears on the LE homepage.

Component for when the `d2l.Tools.MyCoursesWidget.UpdatedSortLogic` config variable is on, meaning the `updated-sort-logic` property is true.

*/

import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import 'd2l-tabs/d2l-tabs.js';
import './d2l-my-courses-content.js';
import './d2l-utility-behavior.js';
import './localize-behavior.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { entityFactory } from 'siren-sdk/src/es6/EntityFactory.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { PromotedSearchEntity } from 'siren-sdk/src/promotedSearch/PromotedSearchEntity.js';
import { UserSettingsEntity } from 'siren-sdk/src/userSettings/UserSettingsEntity';

class MyCoursesContainer extends mixinBehaviors([
	D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
	D2L.MyCourses.UtilityBehavior
], PolymerElement) {

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
			_pinnedTabAction: Object,
			_showGroupByTabs: {
				type: Boolean,
				value: false
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
			_promotedSearchEntity: Object,
			// Hides loading spinner and shows tabs when true
			_showContent: {
				type: Boolean,
				value: false
			}
		};
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
			<template is="dom-if" if="[[_showGroupByTabs]]">
				<div class="spinner-container">
					<d2l-loading-spinner hidden$="[[_showContent]]" size="100">
					</d2l-loading-spinner>
				</div>
				<d2l-tabs hidden$="[[!_showContent]]">
					<template items="[[_tabSearchActions]]" is="dom-repeat">
						<!-- item.name is an OrgUnitId, and querySelector does not work with components with ids that start with a number -->
						<d2l-tab-panel id="panel-[[item.name]]" text="[[item.title]]" selected="[[item.selected]]">
							<d2l-my-courses-content
								presentation-url="[[_presentationUrl]]"
								token="[[token]]"
								advanced-search-url="[[advancedSearchUrl]]"
								course-image-upload-cb="[[courseImageUploadCb]]"
								enrollments-search-action="[[item.enrollmentsSearchAction]]"
								image-catalog-location="[[imageCatalogLocation]]"
								standard-department-name="[[standardDepartmentName]]"
								standard-semester-name="[[standardSemesterName]]"
								org-unit-type-ids="[[orgUnitTypeIds]]"
								tab-search-actions="[[_tabSearchActions]]"
								tab-search-type="[[_tabSearchType]]"
								update-user-settings-action="[[_updateUserSettingsAction]]"
								changed-course-enrollment="[[_changedCourseEnrollment]]">
							</d2l-my-courses-content>
						</d2l-tab-panel>
					</template>
				</d2l-tabs>
			</template>
			<template is="dom-if" if="[[!_showGroupByTabs]]">
				<d2l-my-courses-content
					presentation-url="[[_presentationUrl]]"
					token="[[token]]"
					advanced-search-url="[[advancedSearchUrl]]"
					org-unit-type-ids="[[orgUnitTypeIds]]"
					course-image-upload-cb="[[courseImageUploadCb]]"
					enrollments-search-action="[[_enrollmentsSearchAction]]"
					image-catalog-location="[[imageCatalogLocation]]"
					standard-department-name="[[standardDepartmentName]]"
					standard-semester-name="[[standardSemesterName]]">
				</d2l-my-courses-content>
			</template>`;
	}

	connectedCallback() {
		super.connectedCallback();
		afterNextRender(this, () => {
			this.addEventListener('d2l-course-enrollment-change', this._onCourseEnrollmentChange);
			this.addEventListener('d2l-tab-changed', this._tabSelectedChanged);
		});

		if (!this.enrollmentsUrl || !this.userSettingsUrl) {
			return;
		}

		this._setEnrollmentCollectionEntity(this.enrollmentsUrl);
		this._setUserSettingsEntity(this.userSettingsUrl);
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

		this._showGroupByTabs = !!(this.promotedSearches || (this._enrollmentsSearchAction && this._pinnedTabAction));
		this._fetchTabSearchActions();
	}
	_onPromotedSearchEntityChange() {
		if (!this._promotedSearchEntity || !this._userSettingsEntity) {
			return;
		}
		const promotedSearchesEntity = this._promotedSearchEntity;
		const userSettingsEntity = this._userSettingsEntity;

		this._tabSearchActions = [];

		this._showContent = true;
		if (!promotedSearchesEntity.actions()) {
			if ((this._enrollmentsSearchAction && this._pinnedTabAction)) {
				this._tabSearchActions = this._getPinTabAndAllTabActions(lastEnrollmentsSearchName);
			} else {
				this._showGroupByTabs = false;
			}
			return;
		}

		if (promotedSearchesEntity.userEnrollmentsSearchType()) {
			this._tabSearchType = promotedSearchesEntity.userEnrollmentsSearchType();
		}

		const lastEnrollmentsSearchName = userSettingsEntity.mostRecentEnrollmentsSearchName();

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
		this._changedCourseEnrollment = {
			orgUnitId: e.detail.orgUnitId,
			isPinned: e.detail.isPinned
		};
	}
	_tabSelectedChanged(e) {
		this._currentTabId = `panel-${e.detail.tabId}`;
	}
	courseImageUploadCompleted(success) {
		return this._fetchContentComponent().courseImageUploadCompleted(success);
	}
	getLastOrgUnitId() {
		return this._fetchContentComponent().getLastOrgUnitId();
	}
	_fetchContentComponent() {
		return this._showGroupByTabs === false || !this._currentTabId
			? this.shadowRoot.querySelector('d2l-my-courses-content')
			: this.shadowRoot.querySelector(`#${this._currentTabId} d2l-my-courses-content`);
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

		if (this._pinnedTabAction) {
			actions.push({
				name: this._pinnedTabAction.name,
				title: this.localize('pinnedCourses'),
				selected: this._pinnedTabAction.name === lastEnrollmentsSearchName,
				enrollmentsSearchAction: this._pinnedTabAction
			});
		}

		return actions;
	}
	_fetchTabSearchActions() {
		if (!this.userSettingsUrl) {
			return;
		}

		if (!this.promotedSearches && this._enrollmentsSearchAction && this._pinnedTabAction) {
			const lastEnrollmentsSearchName = this._userSettingsEntity.mostRecentEnrollmentsSearchName();
			this._tabSearchActions = this._getPinTabAndAllTabActions(lastEnrollmentsSearchName);
			this._showContent = true;
			return;
		}

		return this._setPromotedSearchEntity(this.promotedSearches);
	}
}

window.customElements.define(MyCoursesContainer.is, MyCoursesContainer);
