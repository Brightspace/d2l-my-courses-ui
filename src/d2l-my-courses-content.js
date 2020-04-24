/*
`d2l-my-courses-content`
Polymer-based web component for the my-courses content.
*/

import '@polymer/iron-scroll-threshold/iron-scroll-threshold.js';
import '@brightspace-ui/core/components/link/link.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import 'd2l-alert/d2l-alert.js';
import 'd2l-enrollments/components/d2l-enrollment-card/d2l-enrollment-card.js';
import 'd2l-image-selector/d2l-basic-image-selector.js';
import 'd2l-simple-overlay/d2l-simple-overlay.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import './card-grid/d2l-card-grid-behavior.js';
import './card-grid/d2l-card-grid-styles.js';
import './d2l-alert-behavior.js';
import './d2l-all-courses.js';
import './d2l-utility-behavior.js';
import './localize-behavior.js';

import { entityFactory, updateEntity } from 'siren-sdk/src/es6/EntityFactory.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { Actions } from 'd2l-hypermedia-constants';

import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { performSirenAction } from 'siren-sdk/src/es6/SirenAction.js';
import { PresentationEntity } from 'siren-sdk/src/presentation/PresentationEntity.js';
import { StatusMixin } from 'd2l-enrollments/components/date-text-status-mixin';

class MyCoursesContent extends mixinBehaviors([
	D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
	D2L.MyCourses.AlertBehavior,
	D2L.MyCourses.UtilityBehavior,
	D2L.MyCourses.CardGridBehavior
], StatusMixin(PolymerElement)) {

	static get is() { return 'd2l-my-courses-content'; }

	static get properties() {
		return {
			/*
			* Public Polymer properties
			*/
			enrollmentsSearchAction: Object,
			tabSearchActions: {
				type: Array,
				value: function() { return []; }
			},
			tabSearchType: String,
			updateUserSettingsAction: Object,
			changedCourseEnrollment: Object,
			// URL that directs to the advanced search page
			advancedSearchUrl: String,
			// Callback for upload in image-selector
			courseImageUploadCb: Function,
			// URL that is called by the widget to fetch results from the course image catalog
			imageCatalogLocation: String,
			// Standard Semester OU Type name to be displayed in the all-courses filter dropdown
			standardDepartmentName: String,
			// Standard Department OU Type name to be displayed in the all-courses filter dropdown
			standardSemesterName: String,
			// Configuration value passed in to toggle Learning Paths code
			orgUnitTypeIds: String,
			// URL to fetch widget settings
			presentationUrl: String,
			// Token JWT Token for brightspace | a function that returns a JWT token for brightspace
			token: String,
			/*
			* Presentation Attributes
			*/
			_showOrganizationCode: {
				type: Boolean,
				value: false
			},
			_showSemesterName: {
				type: Boolean,
				value: false
			},
			_hideCourseStartDate: {
				type: Boolean,
				value: false
			},
			_hideCourseEndDate: {
				type: Boolean,
				value: false
			},
			_showDropboxUnreadFeedback: {
				type: Boolean,
				value: false
			},
			_showUnattemptedQuizzes: {
				type: Boolean,
				value: false
			},
			_showUngradedQuizAttempts: {
				type: Boolean,
				value: false
			},
			_showUnreadDiscussionMessages: {
				type: Boolean,
				value: false
			},
			_showUnreadDropboxSubmissions: {
				type: Boolean,
				value: false
			},

			// Alerts to display in widget, above course tiles
			_alertsView: {
				type: Array,
				value: function() { return []; }
			},
			_courseTileOrganizationEventCount: {
				type: Number,
				value: 0
			},
			// Array of enrollments being displayed by the widget
			_enrollments: {
				type: Array,
				value: function() { return []; }
			},
			// Object containing the IDs of previously loaded enrollments, to avoid duplicates
			_existingEnrollmentsMap: {
				type: Object,
				value: function() { return {}; }
			},
			// True when user has >1 page of enrollments
			_nextEnrollmentEntityUrl: {
				type: String,
				value: null
			},
			_hasOnlyPastCourses: {
				type: Boolean,
				value: false,
				computed: '_computeHasOnlyPastCourses(_courseTileOrganizationEventCount, _enrollments.length)'
			},
			// Lookup table of org unit ID -> enrollment, to avoid having to re-fetch enrollments
			_orgUnitIdMap: {
				type: Object,
				value: function() { return {}; }
			},
			_numberOfEnrollments: {
				type: Number,
				value: 0
			},
			_lastPinnedIndex: {
				type: Number,
				value: -1
			},
			// The organization which the user is selecting the image of
			_setImageOrg: {
				type: Object,
				value: function() { return {}; }
			},
			// Hides loading spinner and shows content when true
			_showContent: {
				type: Boolean,
				value: false
			},
			// Text to render for "View All Courses" link (includes enrollment count approximation)
			_viewAllCoursesText: {
				type: String,
				computed: '_getViewAllCoursesText(_nextEnrollmentEntityUrl, _numberOfEnrollments)'
			},
			// Whether or not to refetch the courses data
			_isRefetchNeeded: {
				type: Boolean,
				value: false
			},
			_isAllTab: {
				type: Boolean,
				computed: '_computeIsAllTab(enrollmentsSearchAction.name)'
			},
			_isPinnedTab: {
				type: Boolean,
				computed: '_computeIsPinnedTab(enrollmentsSearchAction.name)'
			},
			_hasEnrollmentsChanged: {
				type: Boolean,
				value: false
			},
			_rootTabSelected: {
				type: Boolean,
				value: false
			},
			_allCoursesCreated: {
				type: Boolean,
				value: false
			},
			_courseImagesLoadedEventCount: {
				type: Number,
				value: 0
			},
			_initiallyVisibleCourseTileCount: {
				type: Number,
				value: 0
			},
			_widgetMaxCardVisible: {
				type: Number,
				value: 12
			},
			_hidePastCourses: {
				type: Boolean,
				value: false
			}
		};
	}

	static get observers() {
		return [
			'_enrollmentsChanged(_enrollments.length, _numberOfEnrollments)',
			'_enrollmentSearchActionChanged(enrollmentsSearchAction)',
			'_onCourseEnrollmentChange(changedCourseEnrollment)',
			'_onPresentationEntityChange(presentationUrl)'
		];
	}

	static get template() {
		return html`
		<style include="d2l-card-grid-styles">
			:host {
				display: block;
			}
			@media not all and (hover: hover) {
				:host {
					-webkit-user-select: none;
					user-select: none;
				}
			}
			.spinner-container {
				display: flex;
				justify-content: center;
				align-items: center;
			}
			d2l-alert {
				margin-bottom: 20px;
				clear: both;
			}

			.course-card-grid d2l-enrollment-card:nth-of-type(n+13):not([pinned]),
			.course-card-grid[hide-past-courses] d2l-enrollment-card[closed]:not([pinned]) {
				display: none;
			}
			.d2l-body-standard {
				@apply --d2l-body-standard-text;
				margin: 0;
			}
		</style>

		<div class="spinner-container">
			<d2l-loading-spinner hidden$="[[_showContent]]" size="100">
			</d2l-loading-spinner>
		</div>

		<div hidden$="[[!_showContent]]" class="my-courses-content">
			<d2l-alert hidden$="[[!_hasOnlyPastCourses]]" type="call-to-action">
				[[localize('onlyPastCoursesMessage')]]
			</d2l-alert>

			<template is="dom-repeat" items="[[_alertsView]]">
				<d2l-alert type="[[item.alertType]]">
					[[item.alertMessage]]
				</d2l-alert>
			</template>
			<div class="course-card-grid">
				<template is="dom-repeat" items="[[_enrollments]]">
					<d2l-enrollment-card
						href="[[item]]"
						token="[[token]]"
						show-organization-code="[[_showOrganizationCode]]"
						show-semester-name="[[_showSemesterName]]"
						show-dropbox-unread-feedback="[[_showDropboxUnreadFeedback]]"
						show-unattempted-quizzes="[[_showUnattemptedQuizzes]]"
						show-ungraded-quiz-attempts="[[_showUngradedQuizAttempts]]"
						show-unread-discussion-messages="[[_showUnreadDiscussionMessages]]"
						show-unread-dropbox-submissions="[[_showUnreadDropboxSubmissions]]"
						hide-course-start-date="[[_hideCourseStartDate]]"
						hide-course-end-date="[[_hideCourseEndDate]]">
					</d2l-enrollment-card>
				</template>
			</div>
			<d2l-link id="viewAllCourses"
				hidden$="[[!_numberOfEnrollments]]"
				href="javascript:void(0);"
				on-tap="_openAllCoursesView"
				on-keypress="_keypressOpenAllCoursesView"
				on-mouseover="_createAllCourses"
				on-focus="_createAllCourses"
				tabindex="0">
				<h3 class="d2l-body-standard">[[_viewAllCoursesText]]</h3>
			</d2l-link>
		</div>

		<div id="allCoursesPlaceholder">
		</div>

		<d2l-simple-overlay id="basic-image-selector-overlay"
			title-name="[[localize('changeImage')]]"
			close-simple-overlay-alt-text="[[localize('closeSimpleOverlayAltText')]]"
			with-backdrop="">
			<iron-scroll-threshold
				id="image-selector-threshold"
				on-lower-threshold="_onChangeImageLowerThreshold">
			</iron-scroll-threshold>
			<d2l-basic-image-selector
				image-catalog-location="[[imageCatalogLocation]]"
				organization="[[_setImageOrg]]"
				course-image-upload-cb="[[courseImageUploadCb]]">
			</d2l-basic-image-selector>
		</d2l-simple-overlay>`;
	}

	ready() {
		super.ready();
		this._onEnrollmentPinnedMessage = this._onEnrollmentPinnedMessage.bind(this);
		this._onSetCourseImage = this._onSetCourseImage.bind(this);
		this._onTabSelected = this._onTabSelected.bind(this);
	}

	connectedCallback() {
		super.connectedCallback();
		this.performanceMark('d2l.my-courses.attached');

		document.body.addEventListener('d2l-course-pinned-change', this._onEnrollmentPinnedMessage, true);
		document.body.addEventListener('set-course-image', this._onSetCourseImage);
		document.body.addEventListener('d2l-tab-panel-selected', this._onTabSelected);

		this.addEventListener('clear-image-scroll-threshold', this._onClearImageScrollThreshold);
		this.addEventListener('course-tile-organization', this._onCourseTileOrganization);
		this.addEventListener('course-image-loaded', this._onCourseImageLoaded);
		this.addEventListener('d2l-enrollment-new', this._onD2lEnrollmentNew);
		this.addEventListener('d2l-simple-overlay-closed', this._onSimpleOverlayClosed);
		this.addEventListener('initially-visible-course-tile', this._onInitiallyVisibleCourseTile);
		this.addEventListener('open-change-image-view', this._onOpenChangeImageView);

		this.$['image-selector-threshold'].scrollTarget = this.$['basic-image-selector-overlay'].scrollRegion;

		let ouTypeIds = []; //default value
		try {
			ouTypeIds = JSON.parse(this.orgUnitTypeIds).value;
		} catch (e) {
			// default value used
		}

		this.orgUnitTypeIds = ouTypeIds;
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		document.body.removeEventListener('d2l-course-pinned-change', this._onEnrollmentPinnedMessage, true);
		document.body.removeEventListener('set-course-image', this._onSetCourseImage);
		document.body.removeEventListener('d2l-tab-panel-selected', this._onTabSelected);
	}

	/*
	* Public API functions
	*/

	courseImageUploadCompleted(success) {
		if (success) {
			this.$['basic-image-selector-overlay'].close();
			this._refreshTileGridImages();
		}
		this.focus();
	}
	focus() {
		if (this._getTileGrid().focus(this._setImageOrg)) {
			return;
		}
		this.$.viewAllCourses.focus();
	}
	getLastOrgUnitId() {
		if (!this._setImageOrg.links) {
			return;
		}
		return this._getOrgUnitIdFromHref(this.getEntityIdentifier(this._setImageOrg));
	}
	_enrollmentsChanged(viewAbleLength, totalLength) {
		this._removeAlert('noCourses');
		if (this._isRefetchNeeded) {
			return;
		}
		if (viewAbleLength <= 0) {
			this._clearAlerts();
		}
		if (totalLength === 0) {
			this._addAlert('call-to-action', 'noCourses', this.localize('noCoursesMessage'));
		}
	}
	_enrollmentSearchActionChanged() {
		if (!this.tabSearchActions.length) {
			// We only need to manually fetch if we're not using tabs;
			// otherwise, the fetch is initiated when a tab is selected.
			this._fetchRoot();
		}
	}
	_computeHasOnlyPastCourses() {
		return this._hidePastCourses
			&& this._numberOfEnrollments !== 0
			&& this._enrollments.length === 0;
	}
	_getTileGrid() {
		return this.shadowRoot.querySelector('.course-card-grid');
	}
	_refreshTileGridImages() {
		const courseTiles = this._getTileGrid().querySelectorAll('d2l-enrollment-card');
		for (let i = 0; i < courseTiles.length; i++) {
			courseTiles[i].refreshImage(this._setImageOrg);
		}
	}
	_insertToOrgUnitIdMap(url, enrollmentCollectionEntity) {
		if (!url || !enrollmentCollectionEntity) {
			return;
		}
		enrollmentCollectionEntity.onEnrollmentEntityChange(url, (enrollmentEntity) => {
			const orgUnitId = this._getOrgUnitIdFromHref(enrollmentEntity.organizationHref());
			this._orgUnitIdMap[orgUnitId] = url;
		});
	}
	_setEnrollmentCardStatus(enrollmentCardStatusDetails) {
		if (!enrollmentCardStatusDetails || !enrollmentCardStatusDetails.status
			|| !enrollmentCardStatusDetails.enrollmentUrl || enrollmentCardStatusDetails.status.completed) {
			return;
		}

		const hide = this._hidePastCourses && (enrollmentCardStatusDetails.status.closed);
		const index = this._enrollments.indexOf(enrollmentCardStatusDetails.enrollmentUrl);

		if (hide && index !== -1 && index > this._lastPinnedIndex) {
			this.splice('_enrollments', index, 1);
		}

		if (this._enrollments.length < this._widgetMaxCardVisible && this._nextEnrollmentEntityUrl) {
			this._onEnrollmentsEntityChange(this._nextEnrollmentEntityUrl);
		}

		this._onResize();
	}
	_fetchEnrollmentCardStatus(url, enrollmentCollectionEntity) {
		if (!url || !enrollmentCollectionEntity) {
			return;
		}

		enrollmentCollectionEntity.onEnrollmentEntityChange(url, (enrollmentEntity) => {
			enrollmentEntity.onUserActivityUsageChange((userActivityUsage) => {
				const cardStatus = this.enrollmentStatus(userActivityUsage.isCompletionDate(), userActivityUsage.date());
				const enrollmentCardStatusDetails = {
					status: {
						completed: cardStatus && cardStatus.status === 'completed' ? true : false
					},
					enrollmentUrl: url
				};
				this._setEnrollmentCardStatus(enrollmentCardStatusDetails);
			});

			enrollmentEntity.onOrganizationChange((org) => {
				const enrollmentDate = org.processedDate(this._hideCourseStartDate, this._hideCourseEndDate);
				const enrollmentCardStatusDetails = {
					status: {closed: enrollmentDate && enrollmentDate.afterEndDate},
					enrollmentUrl: url
				};
				this._setEnrollmentCardStatus(enrollmentCardStatusDetails);
			});
		});
	}

	/*
	* Listeners
	*/
	_onD2lEnrollmentNew() {
		if (this._hasAlert('newEnrollmentMultiple')) {
			return;
		}
		let message = 'newEnrollment';
		if (this._hasAlert(message)) {
			this._removeAlert(message);
			message = 'newEnrollmentMultiple';
		}
		this._addAlert('call-to-action', message, this.localize(message));
	}
	_onChangeImageLowerThreshold() {
		this.shadowRoot.querySelector('d2l-basic-image-selector').loadMore(this.$['image-selector-threshold']);
	}
	_onClearImageScrollThreshold() {
		this.$['image-selector-threshold'].clearTriggers();
	}
	_onCourseImageLoaded() {
		this._courseImagesLoadedEventCount++;

		if (this._courseImagesLoadedEventCount === this._initiallyVisibleCourseTileCount) {
			this.performanceMark('d2l.my-courses.visible-images-complete');
			this.performanceMeasure(
				'd2l.my-courses',
				'd2l.my-courses.attached',
				'd2l.my-courses.visible-images-complete'
			);
		}
	}
	_onCourseTileOrganization() {
		if (this._initiallyVisibleCourseTileCount === 0 && this._courseTileOrganizationEventCount === 0) {
			// If no course tiles are initially visible (widget is outside of initial viewport)
			// then we can say we're already finished loading the visible organizations and images
			this.performanceMark('d2l.my-courses.visible-organizations-complete');
			this.performanceMeasure(
				'd2l.my-courses.meaningful.visible',
				'd2l.my-courses.attached',
				'd2l.my-courses.visible-organizations-complete'
			);
			this.performanceMark('d2l.my-courses.visible-images-complete');
			this.performanceMeasure(
				'd2l.my-courses.hero',
				'd2l.my-courses.attached',
				'd2l.my-courses.visible-images-complete',
				true
			);
		}

		this._courseTileOrganizationEventCount++;

		if (this._courseTileOrganizationEventCount === this._initiallyVisibleCourseTileCount) {
			// Only show content once the last visible organization has loaded, to reduce jank
			this._showContent = true;
			this.performanceMark('d2l.my-courses.visible-organizations-complete');
			this.performanceMeasure(
				'd2l.my-courses.meaningful.visible',
				'd2l.my-courses.attached',
				'd2l.my-courses.visible-organizations-complete'
			);
		} else if (this._courseTileOrganizationEventCount === this._enrollments.length) {
			this.performanceMark('d2l.my-courses.all-organizations-complete');
			this.performanceMeasure(
				'd2l.my-courses.meaningful.all',
				'd2l.my-courses.attached',
				'd2l.my-courses.all-organizations-complete'
			);
		}
	}
	_onInitiallyVisibleCourseTile() {
		this._initiallyVisibleCourseTileCount++;
	}
	_onEnrollmentPinnedMessage(e) {
		if (e.composedPath()[0] === this) return;

		const isPinned = e.detail.isPinned;
		let orgUnitId;

		if (e.detail.orgUnitId) {
			orgUnitId = e.detail.orgUnitId;
			if (this._orgUnitIdMap[orgUnitId]) {
				const enrollmentHref = this._orgUnitIdMap[orgUnitId];
				updateEntity(enrollmentHref, this.token);
			}
		} else {
			orgUnitId = this._getOrgUnitIdFromHref(e.detail.enrollment.organizationHref());
		}
		// Only want to move pinned/unpinned enrollment if it exists in the panel
		const changedEnrollmentId = orgUnitId && this._orgUnitIdMap[orgUnitId];
		if (!changedEnrollmentId) {
			this._refetchEnrollments();
		}

		this.dispatchEvent(new CustomEvent('d2l-course-enrollment-change', {
			bubbles: true,
			composed: true,
			detail: {
				orgUnitId: orgUnitId,
				isPinned: isPinned
			}
		}));
		this._isRefetchNeeded = false;

		const removalIndex = this._enrollments.indexOf(changedEnrollmentId);
		let insertIndex = this._lastPinnedIndex + 1;

		if (!isPinned) {
			this._lastPinnedIndex--;
		}

		if (isPinned) {
			this._lastPinnedIndex++;
		}

		if (removalIndex === insertIndex) {
			this._onResize();
			return;
		}

		if (removalIndex !== -1) {
			this.splice('_enrollments', removalIndex, 1);

			if (removalIndex < insertIndex) {
				insertIndex--;
			}
		}

		if (this._isPinnedTab) {
			this._numberOfEnrollments--;
		} else {
			this.splice('_enrollments', insertIndex, 0, changedEnrollmentId);
		}

		this._onResize();
	}
	//This event handler is removed from handling `started-inactive` event, not referenced anywhere
	_onStartedInactiveAlert() {
		if (this.shadowRoot.querySelector('.course-card-grid d2l-enrollment-card[started-inactive]')) {
			this._addAlert('warning', 'startedInactiveCourses', this.localize('startedInactiveAlert'));
		}
	}
	_onTabSelected(e) {
		// Only handle if tab selected corresponds to this panel
		if (!this.parentElement || e.composedPath()[0].id !== this.parentElement.id) {
			document.body.removeEventListener('d2l-course-pinned-change', this._onEnrollmentPinnedMessage, true);
			return;
		}

		// Only listen to pin updates for the current tab
		document.body.addEventListener('d2l-course-pinned-change', this._onEnrollmentPinnedMessage, true);

		if (this._isRefetchNeeded) {
			this._handleEnrollmentsRefetch();
		} else if (this._numberOfEnrollments === 0) {
			this._rootTabSelected = true;
			this._fetchRoot();
		} else {
			setTimeout(() => {
				// Force redraw of course tiles.
				window.dispatchEvent(new Event('resize'));
			}, 10);
		}
		this._setLastSearchName(this.enrollmentsSearchAction.name);

		const tabChanged = new CustomEvent('d2l-tab-changed', {
			bubbles: true,
			composed: true,
			detail: {
				tabId: this.enrollmentsSearchAction.name
			}
		});
		this.dispatchEvent(tabChanged);
		// Whenever the selected tab changes, update tabSearchActions so
		// All Courses will have the same tab selected when it opens
		this.tabSearchActions = this.tabSearchActions.map((action) => {
			return {
				name: action.name,
				title: action.title,
				selected: action.name === this.enrollmentsSearchAction.name,
				enrollmentsSearchAction: action.enrollmentsSearchAction
			};
		});
	}
	_onSimpleOverlayClosed() {
		this._removeAlert('setCourseImageFailure');

		if (this._isRefetchNeeded) {
			this._handleEnrollmentsRefetch();
		}

		document.body.addEventListener('d2l-course-pinned-change', this._onEnrollmentPinnedMessage, true);
		this._hasEnrollmentsChanged = false;
	}
	_onOpenChangeImageView(e) {
		if (e.detail.organization) {
			this._setImageOrg = this.parseEntity(e.detail.organization);
		}

		this.$['basic-image-selector-overlay'].open();
	}
	_onSetCourseImage(e) {
		this.$['basic-image-selector-overlay'].close();
		this._removeAlert('setCourseImageFailure');
		if (e && e.detail) {
			if (e.detail.status === 'failure') {
				setTimeout(() => {
					this._addAlert('warning', 'setCourseImageFailure', this.localize('error.settingImage'));
				}, 1000); // delay until the tile fail icon animation begins to kick in (1 sec delay)
			}
		}
	}
	_onPresentationEntityChange(url) {
		entityFactory(PresentationEntity, url, this.token, entity => {
			this._hideCourseStartDate = entity.hideCourseStartDate();
			this._hideCourseEndDate = entity.hideCourseEndDate();
			this._showOrganizationCode = entity.showOrganizationCode();
			this._showSemesterName = entity.showSemesterName();
			this._showDropboxUnreadFeedback = entity.showDropboxUnreadFeedback();
			this._showUnattemptedQuizzes = entity.showUnattemptedQuizzes();
			this._showUngradedQuizAttempts = entity.showUngradedQuizAttempts();
			this._showUnreadDiscussionMessages = entity.showUnreadDiscussionMessages();
			this._showUnreadDropboxSubmissions = entity.showUnreadDropboxSubmissions();
		});
	}
	_onCourseEnrollmentChange(newValue) {
		if (!newValue) {
			return;
		}

		if (this._isAllTab || this._isPinnedTab || (newValue.orgUnitId && this._orgUnitIdMap[newValue.orgUnitId])) {
			this._isRefetchNeeded = true;
			this._hasEnrollmentsChanged = true;
		}
	}
	_computeIsAllTab(actionName) {
		return actionName === Actions.enrollments.searchMyEnrollments;
	}
	_computeIsPinnedTab(actionName) {
		return actionName === Actions.enrollments.searchMyPinnedEnrollments;
	}
	/*
	* Utility/helper functions
	*/
	_createFetchEnrollmentsUrl(bustCache) {

		const query = {
			pageSize: 20,
			sort: 'current',
			autoPinCourses: false,
			orgUnitTypeId: this.orgUnitTypeIds,
			promotePins: true,
			embedDepth: 0
		};
		let enrollmentsSearchUrl = this.createActionUrl(this.enrollmentsSearchAction, query);

		if (bustCache) {
			enrollmentsSearchUrl += `&bustCache=${Math.random()}`;
		}

		return enrollmentsSearchUrl;
	}
	_createAllCourses() {
		if (!this._allCoursesCreated) {
			const allCourses = document.createElement('d2l-all-courses');
			this.$.allCoursesPlaceholder.appendChild(allCourses);
			this._allCoursesCreated = true;
		}
	}
	_keypressOpenAllCoursesView(e) {
		if (e.code === 'Space' || e.code === 'Enter') {
			return this._openAllCoursesView(e);
		}
	}
	_fetchRoot() {
		if (!this.enrollmentsSearchAction) {
			return;
		}
		this.performanceMark('d2l.my-courses.root-enrollments.request');
		this._fetchEnrollments();
	}
	_fetchEnrollments() {
		this.performanceMark('d2l.my-courses.root-enrollments.response');
		this.performanceMeasure(
			'd2l.my-courses.root-enrollments',
			'd2l.my-courses.root-enrollments.request',
			'd2l.my-courses.root-enrollments.response'
		);

		const enrollmentsSearchUrl = this._createFetchEnrollmentsUrl();
		this.performanceMark('d2l.my-courses.search-enrollments.request');

		this._onEnrollmentsRootEntityChange(enrollmentsSearchUrl);
	}
	_enrollmentsResponsePerfMeasures(enrollmentsEntity) {
		this.performanceMark('d2l.my-courses.search-enrollments.response');
		this.performanceMeasure(
			'd2l.my-courses.search-enrollments',
			'd2l.my-courses.search-enrollments.request',
			'd2l.my-courses.search-enrollments.response'
		);

		this._enrollmentsRootResponse(enrollmentsEntity);
	}
	_getOrgUnitIdFromHref(organizationHref) {
		const match = /[0-9]+$/.exec(organizationHref);

		if (!match) {
			return;
		}
		return match[0];
	}
	_getViewAllCoursesText(hasMoreEnrollments, enrollmentsLength) {
		const viewAllCourses = this.localize('viewAllCourses');

		// With individual fetching of courses as they get pinned, we can end
		// up with "21+", "22+", etc., so round down to nearest 5 for >20 courses
		const maxCount = 99;
		let count = enrollmentsLength < 20
			? enrollmentsLength
			: String(enrollmentsLength - (enrollmentsLength % 5));
		if (count > maxCount) {
			count = `${maxCount}+`;
		}
		if (hasMoreEnrollments && count !== `${maxCount}+`) {
			count += '+';
		}

		return enrollmentsLength > 0 ? `${viewAllCourses} (${count})` : viewAllCourses;
	}
	_openAllCoursesView(e) {
		this._createAllCourses();

		const allCourses = this.shadowRoot.querySelector('d2l-all-courses');

		allCourses.enrollmentsSearchAction = this.enrollmentsSearchAction;
		allCourses.tabSearchActions = this.tabSearchActions;
		allCourses.tabSearchType = this.tabSearchType;
		allCourses.advancedSearchUrl = this.advancedSearchUrl;
		allCourses.filterStandardSemesterName = this.standardSemesterName;
		allCourses.filterStandardDepartmentName = this.standardDepartmentName;
		allCourses.orgUnitTypeIds = this.orgUnitTypeIds;
		allCourses.hasEnrollmentsChanged = this._hasEnrollmentsChanged;

		allCourses.token = this.token;
		allCourses.hideCourseStartDate = this._hideCourseStartDate;
		allCourses.hideCourseEndDate = this._hideCourseEndDate;
		allCourses.showOrganizationCode = this._showOrganizationCode;
		allCourses.showSemesterName = this._showSemesterName;
		allCourses.showDropboxUnreadFeedback = this._showDropboxUnreadFeedback;
		allCourses.showUnattemptedQuizzes = this._showUnattemptedQuizzes;
		allCourses.showUngradedQuizAttempts = this._showUngradedQuizAttempts;
		allCourses.showUnreadDiscussionMessages = this._showUnreadDiscussionMessages;
		allCourses.showUnreadDropboxSubmissions = this._showUnreadDropboxSubmissions;

		allCourses.open();

		e.preventDefault();
		e.stopPropagation();
	}
	_onEnrollmentsEntityChange(url) {
		entityFactory(EnrollmentCollectionEntity, url, this.token, entity => {
			this._populateEnrollments(entity);
		});
	}
	_onEnrollmentsRootEntityChange(url) {
		entityFactory(EnrollmentCollectionEntity, url, this.token, entity => {
			this._enrollmentsResponsePerfMeasures(entity);
		});
	}
	_onRefetchEnrollmentsEntityChange(url) {
		entityFactory(EnrollmentCollectionEntity, url, this.token, entity => {
			this._enrollmentRefetchResponse(entity);
		});
	}
	_enrollmentRefetchResponse(entity) {
		const completeFetch = function() {
			this._showContent = true;
		}.bind(this);

		try {
			this._populateEnrollments(entity);
			window.dispatchEvent(new Event('resize'));
			setTimeout(completeFetch, 1000);
		} catch (e) {
			completeFetch();
		}
	}
	_enrollmentsRootResponse(entity) {
		const showContent = function() {
			this._showContent = true;
		}.bind(this);

		const tabSelected = this._rootTabSelected;

		try {
			this._populateEnrollments(entity);
			// At worst, display content 1s after we fetch enrollments
			// (Usually set to true before that, in _onCourseTileOrganization)
			setTimeout(showContent, 1000);
		} catch (e) {
			showContent();
		}

		if (!tabSelected) {
			return;
		}
		window.dispatchEvent(new Event('resize'));
	}
	_populateEnrollments(entity) {
		if (!entity || !entity._entity) {
			throw new Error('No entity');
		}

		const enrollmentCollectionEntity = entity;
		const enrollmentEntities = enrollmentCollectionEntity.getEnrollmentEntities();
		const hasMoreEnrollments = enrollmentCollectionEntity.hasMoreEnrollments();
		this._nextEnrollmentEntityUrl = hasMoreEnrollments ? enrollmentCollectionEntity.getNextEnrollmentHref() : null;

		const newEnrollments = [];

		const searchAction = enrollmentCollectionEntity.getSearchEnrollmentsActions();

		if (searchAction
			&& searchAction.hasFieldByName('sort')
			&& searchAction.getFieldByName('sort').value.toLowerCase() === 'current'
			&& !(searchAction.hasFieldByName('parentOrganizations')
				&& searchAction.getFieldByName('parentOrganizations').value
				&& this.tabSearchType
				&& this.tabSearchType.toLowerCase() === 'bysemester'
			)
		) {
			// When using Current sort, hide past courses in the widget view
			this._getTileGrid().setAttribute('hide-past-courses', '');
			this._hidePastCourses = true;
		}

		enrollmentEntities.forEach(function(enrollment) {
			const enrollmentId = enrollment.href;
			if (!this._existingEnrollmentsMap.hasOwnProperty(enrollmentId)) {
				newEnrollments.push(enrollmentId);
				this._existingEnrollmentsMap[enrollmentId] = true;
				if (enrollment.hasClass('pinned')) this._lastPinnedIndex++;
			}
			this._insertToOrgUnitIdMap(enrollmentId, enrollmentCollectionEntity);
			this._fetchEnrollmentCardStatus(enrollmentId, enrollmentCollectionEntity);
		}, this);

		this._enrollments = this._enrollments.concat(newEnrollments);
		this._numberOfEnrollments += newEnrollments.length;

		if (this._enrollments.length === 0) {
			// Normally we'd wait until the visible organization requests have finished,
			// but this user has no enrollments, so we won't hit that case.
			this._showContent = true;
		}

		this.fire('recalculate-columns');

		const lastEnrollment = enrollmentEntities[enrollmentEntities.length - 1];
		if (lastEnrollment && lastEnrollment.hasClass('pinned') && this._nextEnrollmentEntityUrl) {
			this._onEnrollmentsEntityChange(this._nextEnrollmentEntityUrl);
		}
	}
	_handleEnrollmentsRefetch() {
		this._showContent = false;
		this._isRefetchNeeded = false;
		this._resetEnrollments();

		this._refetchEnrollments();
	}
	_refetchEnrollments() {
		const enrollmentsSearchUrl = this._createFetchEnrollmentsUrl(true);
		this._onRefetchEnrollmentsEntityChange(enrollmentsSearchUrl);
	}
	_resetEnrollments() {
		this._lastPinnedIndex = -1;
		this._existingEnrollmentsMap = {};
		this._enrollments = [];
		this._numberOfEnrollments = 0;
	}
	_setLastSearchName(id) {
		performSirenAction(this.token, this.updateUserSettingsAction, [
			{
				'type':'hidden',
				'name': 'mostRecentEnrollmentsSearchType',
				'value': 'None'
			},
			{
				'type':'hidden',
				'name': 'mostRecentEnrollmentsSearchName',
				'value': id
			}
		]);
	}

}

window.customElements.define(MyCoursesContent.is, MyCoursesContent);

