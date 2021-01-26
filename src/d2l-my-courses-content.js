/*
`d2l-my-courses-content`
Polymer-based web component for the my-courses content.
*/

import '@brightspace-ui/core/components/alert/alert.js';
import '@brightspace-ui/core/components/link/link.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import './d2l-my-courses-card-grid.js';

import { createActionUrl, getOrgUnitIdFromHref, performanceMark, performanceMeasure } from './d2l-utility-helpers.js';
import { entityFactory, updateEntity } from 'siren-sdk/src/es6/EntityFactory.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { Actions } from 'd2l-hypermedia-constants';
import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { MyCoursesLocalizeBehavior } from './localize-behavior.js';
import { performSirenAction } from 'siren-sdk/src/es6/SirenAction.js';
import { StatusMixin } from 'd2l-enrollments/components/date-text-status-mixin';

class MyCoursesContent extends StatusMixin(MyCoursesLocalizeBehavior(PolymerElement)) {

	static get is() { return 'd2l-my-courses-content'; }

	static get properties() {
		return {
			/*
			* Public Polymer properties
			*/
			enrollmentsSearchAction: Object,
			// Set by the image selector when it experiences an error trying to set a new course image
			showImageError: {
				type: Boolean,
				value: false
			},
			tabSearchType: String,
			updateUserSettingsAction: Object,
			// Configuration value passed in to toggle Learning Paths code
			orgUnitTypeIds: String,
			// URL to fetch widget settings
			presentationUrl: String,
			// Token JWT Token for brightspace | a function that returns a JWT token for brightspace
			token: String,
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
			_courseInfoAlertText: {
				type: String,
				value: null,
				computed: '_computeCourseInfoAlertText(_numberOfEnrollments, _enrollments.length, _hidePastCourses)'
			},
			_newEnrollmentAlertNum: {
				type: Number,
				value: 0
			},
			_newEnrollmentAlertText: {
				type: String,
				value: null,
				computed: '_computeNewEnrollmentAlertText(_newEnrollmentAlertNum)'
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
			_thisTabSelected: {
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
			_rootTabSelected: {
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

	static get template() {
		return html`
		<style>
			:host {
				display: block;
			}
			@media not all and (hover: hover) {
				:host {
					-webkit-user-select: none;
					user-select: none;
				}
			}
			d2l-alert {
				margin-bottom: 20px;
				clear: both;
			}

			d2l-link {
				outline: none;
			}

			.d2l-body-standard {
				@apply --d2l-body-standard-text;
				margin: 0;
			}
		</style>
		
		<d2l-my-courses-card-grid
			filtered-enrollments="[[_enrollments]]"
			hide-past-courses="[[_hidePastCourses]]"
			loading="[[!_showContent]]"
			token="[[token]]"
			presentation-url="[[presentationUrl]]"
			widget-view>

			<d2l-alert id="imageErrorAlert" hidden$="[[!showImageError]]" type="warning">
				[[localize('error.settingImage')]]
			</d2l-alert>
			<d2l-alert id="courseInfoAlert" hidden$="[[!_courseInfoAlertText]]" type="call-to-action">
				[[_courseInfoAlertText]]
			</d2l-alert>
			<d2l-alert id="newEnrollmentAlert" hidden$="[[!_newEnrollmentAlertText]]" type="call-to-action">
				[[_newEnrollmentAlertText]]
			</d2l-alert>

		</d2l-my-courses-card-grid>

		<div hidden$="[[!_showContent]]">
			<d2l-link id="viewAllCourses"
				hidden$="[[!_numberOfEnrollments]]"
				href="javascript:void(0);"
				on-tap="_openAllCoursesView"
				on-keypress="_keypressOpenAllCoursesView"
				tabindex="0">
				<h3 class="d2l-body-standard">[[_viewAllCoursesText]]</h3>
			</d2l-link>
		</div>`;
	}

	ready() {
		super.ready();
	}

	connectedCallback() {
		super.connectedCallback();
		performanceMark('d2l.my-courses.attached');

		this.addEventListener('course-tile-organization', this._onCourseTileOrganization);
		this.addEventListener('course-image-loaded', this._onCourseImageLoaded);
		this.addEventListener('d2l-enrollment-new', this._onD2lEnrollmentNew);
		this.addEventListener('initially-visible-course-tile', this._onInitiallyVisibleCourseTile);
	}

	/*
	* Public API functions
	*/

	// Called by d2l-my-courses-container when the all courses overlay is closed
	allCoursesOverlayClosed() {
		if (this._isRefetchNeeded) {
			this._handleEnrollmentsRefetch();
		}
	}

	// Called by d2l-my-courses-container when a course has been pinned or unpinned
	courseEnrollmentChanged(newValue) {
		if (!newValue) {
			return;
		}

		const changedEnrollmentId = newValue.orgUnitId && this._orgUnitIdMap[newValue.orgUnitId];
		if (changedEnrollmentId) {
			updateEntity(changedEnrollmentId, this.token);
		}

		if (this._thisTabSelected) {
			// Only want to move pinned/unpinned enrollment if it exists in the panel
			if (!changedEnrollmentId) {
				this._refetchEnrollments();
			} else {
				this._rearrangeAfterPinning(changedEnrollmentId, newValue.isPinned);
			}
		} else if (this._isAllTab || this._isPinnedTab || changedEnrollmentId) {
			this._isRefetchNeeded = true;
		}
	}

	// Called by d2l-my-courses-container when it receives a d2l-tab-panel-selected event
	// Triggered when the tabs are first rendered, which then fetches the enrollment data
	newTabSelected(tabId) {
		// Only handle if tab selected corresponds to this panel
		if (!this.parentElement || tabId !== this.parentElement.id) {
			this._thisTabSelected = false;
			return;
		}

		this._thisTabSelected = true;

		if (this._isRefetchNeeded) {
			this._handleEnrollmentsRefetch();
		} else if (this._numberOfEnrollments === 0 && !this._rootTabSelected) {
			this._rootTabSelected = true;
			this._fetchRoot();
		} else {
			setTimeout(() => {
				// Force redraw of course cards
				window.dispatchEvent(new Event('resize'));
			}, 10);
		}
		this._setLastSearchName(this.enrollmentsSearchAction.name);

		return this.enrollmentsSearchAction.name;
	}

	// After a user-uploaded image is set, this is called to try to update the image
	refreshCardGridImages(imageOrg) {
		this._getCardGrid().refreshCardGridImages(imageOrg);
	}

	// Called by d2l-my-courses-container when the pinned tab has been added or removed
	// Needed because of dom-repeat's re-use of DOM nodes
	requestRefresh() {
		this._isRefetchNeeded = true;
	}

	_getCardGrid() {
		return this.shadowRoot.querySelector('d2l-my-courses-card-grid');
	}
	_computeCourseInfoAlertText(enrollmentsLength, viewableEnrollmentsLength, hidePastCourses) {
		if (enrollmentsLength === 0) {
			return this.localize('noCoursesMessage');
		} else if (hidePastCourses && enrollmentsLength !== 0 && viewableEnrollmentsLength === 0) {
			return this.localize('onlyPastCoursesMessage');
		}
		return null;
	}
	_computeNewEnrollmentAlertText(numNewEnrollments) {
		if (numNewEnrollments === 1) {
			return this.localize('newEnrollment');
		} else if (numNewEnrollments >= 1) {
			return this.localize('newEnrollmentMultiple');
		}
		return null;
	}
	_insertToOrgUnitIdMap(url, enrollmentCollectionEntity) {
		if (!url || !enrollmentCollectionEntity) {
			return;
		}
		enrollmentCollectionEntity.onEnrollmentEntityChange(url, (enrollmentEntity) => {
			const orgUnitId = getOrgUnitIdFromHref(enrollmentEntity.organizationHref());
			this._orgUnitIdMap[orgUnitId] = url;
		});
	}
	_setEnrollmentCardStatus(enrollmentCardStatusDetails) {
		if (!enrollmentCardStatusDetails || !enrollmentCardStatusDetails.status
			|| !enrollmentCardStatusDetails.enrollmentUrl || enrollmentCardStatusDetails.status.completed) {
			return;
		}

		const cardGrid = this._getCardGrid();
		const hide = this._hidePastCourses && (enrollmentCardStatusDetails.status.closed);
		const index = this._enrollments.indexOf(enrollmentCardStatusDetails.enrollmentUrl);

		if (hide && index !== -1 && index > this._lastPinnedIndex) {
			cardGrid.spliceEnrollments(index, 1);
			this.notifyPath('_enrollments.length');
		}

		if (this._enrollments.length < this._widgetMaxCardVisible && this._nextEnrollmentEntityUrl) {
			this._onEnrollmentsEntityChange(this._nextEnrollmentEntityUrl);
		}

		cardGrid.onResize();
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
				const enrollmentCardStatusDetails = {
					status: { closed: org && org.isAfterEndDate() },
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
		this._newEnrollmentAlertNum++;
	}
	_onCourseImageLoaded() {
		this._courseImagesLoadedEventCount++;

		if (this._courseImagesLoadedEventCount === this._initiallyVisibleCourseTileCount) {
			performanceMark('d2l.my-courses.visible-images-complete');
			performanceMeasure(
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
			performanceMark('d2l.my-courses.visible-organizations-complete');
			performanceMeasure(
				'd2l.my-courses.meaningful.visible',
				'd2l.my-courses.attached',
				'd2l.my-courses.visible-organizations-complete'
			);
			performanceMark('d2l.my-courses.visible-images-complete');
			performanceMeasure(
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
			requestAnimationFrame(() => {
				this._getCardGrid().onResize();
			});
			performanceMark('d2l.my-courses.visible-organizations-complete');
			performanceMeasure(
				'd2l.my-courses.meaningful.visible',
				'd2l.my-courses.attached',
				'd2l.my-courses.visible-organizations-complete'
			);
		} else if (this._courseTileOrganizationEventCount === this._enrollments.length) {
			performanceMark('d2l.my-courses.all-organizations-complete');
			performanceMeasure(
				'd2l.my-courses.meaningful.all',
				'd2l.my-courses.attached',
				'd2l.my-courses.all-organizations-complete'
			);
		}
	}
	_onInitiallyVisibleCourseTile() {
		this._initiallyVisibleCourseTileCount++;
	}

	_computeIsAllTab(actionName) {
		return actionName === Actions.enrollments.searchMyEnrollments;
	}
	_computeIsPinnedTab(actionName) {
		return actionName === Actions.enrollments.searchMyPinnedEnrollments;
	}
	_rearrangeAfterPinning(changedEnrollmentId, isPinned) {
		const cardGrid = this._getCardGrid();
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
			cardGrid.onResize();
			return;
		}

		if (removalIndex !== -1) {
			cardGrid.spliceEnrollments(removalIndex, 1);
			this.notifyPath('_enrollments.length');

			if (removalIndex < insertIndex) {
				insertIndex--;
			}
		}

		if (this._isPinnedTab) {
			this._numberOfEnrollments--;
		} else {
			cardGrid.spliceEnrollments(insertIndex, 0, changedEnrollmentId);
			this.notifyPath('_enrollments.length');
		}

		cardGrid.onResize();
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
		let enrollmentsSearchUrl = createActionUrl(this.enrollmentsSearchAction, query);

		if (bustCache) {
			if (enrollmentsSearchUrl && enrollmentsSearchUrl.indexOf('?') > -1) {
				// enrollmentsSearchUrl already has some query params, append ours
				enrollmentsSearchUrl += `&bustCache=${Math.random()}`;
			} else {
				enrollmentsSearchUrl += `?bustCache=${Math.random()}`;
			}
		}

		return enrollmentsSearchUrl;
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
		performanceMark('d2l.my-courses.root-enrollments.request');
		this._fetchEnrollments();
	}
	_fetchEnrollments() {
		performanceMark('d2l.my-courses.root-enrollments.response');
		performanceMeasure(
			'd2l.my-courses.root-enrollments',
			'd2l.my-courses.root-enrollments.request',
			'd2l.my-courses.root-enrollments.response'
		);

		// The pinned tab gets added and removed and needs to be refreshed each time
		// For other tabs, we know this is their first time loading and do not need to bust the cache
		const enrollmentsSearchUrl = this._createFetchEnrollmentsUrl(this._isPinnedTab);
		performanceMark('d2l.my-courses.search-enrollments.request');

		this._onEnrollmentsRootEntityChange(enrollmentsSearchUrl);
	}
	_enrollmentsResponsePerfMeasures(enrollmentsEntity) {
		performanceMark('d2l.my-courses.search-enrollments.response');
		performanceMeasure(
			'd2l.my-courses.search-enrollments',
			'd2l.my-courses.search-enrollments.request',
			'd2l.my-courses.search-enrollments.response'
		);

		this._enrollmentsRootResponse(enrollmentsEntity);
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
		this.dispatchEvent(new CustomEvent('d2l-my-courses-content-open-all-courses'));

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
			requestAnimationFrame(() => {
				this._getCardGrid().onResize();
			});
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
			requestAnimationFrame(() => {
				this._getCardGrid().onResize();
			});
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

		// When using Current sort (for users with lower enrollment numbers) and
		// when not on a specific semester tab (DE30485), hide past courses in the widget view
		if (searchAction
			&& searchAction.hasFieldByName('sort')
			&& searchAction.getFieldByName('sort').value.toLowerCase() === 'current'
			&& !(searchAction.hasFieldByName('parentOrganizations')
				&& searchAction.getFieldByName('parentOrganizations').value
				&& this.tabSearchType
				&& this.tabSearchType.toLowerCase() === 'bysemester'
			)
		) {
			// This is needed for removing closed courses initially, and to tell the course grid to hide
			// pinned closed courses that were just unpinned
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
			// No need to resize here
			this._showContent = true;
		}

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
		this._newEnrollmentAlertNum = 0;
		this._nextEnrollmentEntityUrl = null;
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

