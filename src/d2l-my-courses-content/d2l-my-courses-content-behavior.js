import '@polymer/polymer/polymer-legacy.js';
import { Rels } from 'd2l-hypermedia-constants';
import { Actions } from 'd2l-hypermedia-constants';
import '../d2l-all-courses.js';
import '../d2l-css-grid-view/d2l-css-grid-view-behavior.js';
import '../d2l-alert-behavior.js';
import '../d2l-course-tile-responsive-grid-behavior.js';
import '../d2l-interaction-detection-behavior.js';
import '../d2l-utility-behavior.js';
import './d2l-my-courses-behavior.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

/*
* Common behavior shared between d2l-my-courses-content and d2l-my-courses-content-animated.
* This exists as a temporary behavior, to be removed when the -content-animated component is removed,
* and the functionality can be merged back into d2l-my-courses-content.
*
* @polymerBehavior D2L.MyCourses.MyCoursesContentBehavior
*/
D2L.MyCourses.MyCoursesContentBehaviorImpl = {
	properties: {
		enrollmentsSearchAction: Object,
		tabSearchActions: {
			type: Array,
			value: function() { return []; }
		},
		tabSearchType: String,
		userSettingsUrl: String,
		// URL to fetch widget settings
		presentationUrl: {
			type: String,
			observer: '_onPresentationUrlChange'
		},
		changedCourseEnrollment: Object,

		// Alerts to display in widget, above course tiles
		_alertsView: {
			type: Array,
			value: function() { return []; }
		},
		// Whether course tiles should animate during pin/unpin
		_animateCourseTileGrid: {
			type: Boolean,
			value: false
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
		// Size the tile should render with respect to vw
		_tileSizes: {
			type: Object,
			value: function() { return {}; }
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
		}
	},
	listeners: {
		'open-change-image-view': '_onOpenChangeImageView',
		'clear-image-scroll-threshold': '_onClearImageScrollThreshold',
		'd2l-simple-overlay-closed': '_onSimpleOverlayClosed',
		'enrollment-pinned': '_onEnrollmentPinAction',
		'enrollment-unpinned': '_onEnrollmentPinAction',
		'course-tile-organization': '_onCourseTileOrganization',
		'course-image-loaded': '_onCourseImageLoaded',
		'initially-visible-course-tile': '_onInitiallyVisibleCourseTile',
		'started-inactive': '_onStartedInactiveAlert',
		'd2l-enrollment-card-fetched': '_onD2lEnrollmentCardFetched',
		'd2l-enrollment-card-status': '_onD2lEnrollmentCardStatus',
		'd2l-enrollment-new': '_onD2lEnrollmentNew'
	},
	attached: function() {
		this.performanceMark('d2l.my-courses.attached');

		this._onEnrollmentPinnedMessage = this._onEnrollmentPinnedMessage.bind(this);
		document.body.addEventListener('d2l-course-pinned-change', this._onEnrollmentPinnedMessage, true);
		document.body.addEventListener('set-course-image', this._onSetCourseImage.bind(this));
		document.body.addEventListener('d2l-tab-panel-selected', this._onTabSelected.bind(this));
		this.$['image-selector-threshold'].scrollTarget = this.$['basic-image-selector-overlay'].scrollRegion;

		afterNextRender(this, function() {
			if (!this.cssGridView) {
				this.$$('d2l-course-tile-grid').addEventListener('startedInactiveAlert', this._onStartedInactiveAlert.bind(this));
			}
		}.bind(this));
	},
	detached: function() {
		document.body.removeEventListener('d2l-course-pinned-change', this._onEnrollmentPinnedMessage, true);
		document.body.removeEventListener('set-course-image', this._onSetCourseImage.bind(this));
		document.body.removeEventListener('d2l-tab-panel-selected', this._onTabSelected.bind(this));
	},
	observers: [
		'_enrollmentsChanged(_enrollments.length, _numberOfEnrollments)',
		'_enrollmentSearchActionChanged(enrollmentsSearchAction)',
		'_onCourseEnrollmentChange(changedCourseEnrollment)'
	],

	/*
	* Public API functions
	*/

	courseImageUploadCompleted: function(success) {
		if (success) {
			this.$['basic-image-selector-overlay'].close();

			if (this.cssGridView) {
				var courseTiles = this.$$('.course-tile-grid').querySelectorAll('d2l-enrollment-card');
				for (var i = 0; i < courseTiles.length; i++) {
					courseTiles[i].refreshImage(this._setImageOrg);
				}
			} else {
				this.$$('d2l-course-tile-grid').refreshCourseTileImage(this._setImageOrg);
			}
		}
		this.focus();
	},
	focus: function() {
		var tileGrid = this.cssGridView ? this.$$('.course-tile-grid') : this.$$('d2l-course-tile-grid');
		if (tileGrid.focus(this._setImageOrg)) {
			return;
		}
		this.$.viewAllCourses.focus();
	},
	getCourseTileItemCount: function() {
		return this._enrollments.length;
	},
	getLastOrgUnitId: function() {
		if (!this._setImageOrg.links) {
			return;
		}
		return this._getOrgUnitIdFromHref(this.getEntityIdentifier(this._setImageOrg));
	},

	_allCoursesCreated: false,
	_courseImagesLoadedEventCount: 0,
	_initiallyVisibleCourseTileCount: 0,
	_enrollmentsSearchUrl: null,
	_widgetMaxCardVisible: 12,
	_hidePastCourses: false,

	_enrollmentsChanged: function(viewAbleLength, totalLength) {
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
	},
	_enrollmentSearchActionChanged: function() {
		if (!this.tabSearchActions.length) {
			// We only need to manually fetch if we're not using tabs;
			// otherwise, the fetch is initiated when a tab is selected.
			this._fetchRoot();
		}
	},
	_computeHasOnlyPastCourses: function() {
		return this.updatedSortLogic
			&& this._hidePastCourses
			&& this._numberOfEnrollments !== 0
			&& this._enrollments.length === 0;
	},

	/*
	* Listeners
	*/
	_onD2lEnrollmentCardFetched: function(e) {
		if (dom(e).rootTarget === this
			|| !e.detail.organizationUrl
			|| !e.detail.enrollmentUrl
		) {
			return;
		}

		var orgUnitId = this._getOrgUnitIdFromHref(e.detail.organizationUrl);

		this._orgUnitIdMap[orgUnitId] = e.detail.enrollmentUrl;
	},
	_onD2lEnrollmentCardStatus: function(e) {
		if (!e.detail || !e.detail.status || !e.detail.enrollmentUrl) {
			return;
		}

		var hide = this._hidePastCourses && (e.detail.status.completed || e.detail.status.closed);
		var index = this._enrollments.indexOf(e.detail.enrollmentUrl);

		if (hide && index !== -1 && index > this._lastPinnedIndex) {
			this.splice('_enrollments', index, 1);
		}

		if (this._enrollments.length < this._widgetMaxCardVisible && this._nextEnrollmentEntityUrl) {
			this.fetchSirenEntity(this._nextEnrollmentEntityUrl)
				.then(this._populateEnrollments.bind(this));
		}

		this._onResize();
	},
	_onD2lEnrollmentNew: function() {
		if (this._hasAlert('newEnrollmentMultiple')) {
			return;
		}
		var message = 'newEnrollment';
		if (this._hasAlert(message)) {
			this._removeAlert(message);
			message = 'newEnrollmentMultiple';
		}
		this._addAlert('call-to-action', message, this.localize(message));
	},
	_onChangeImageLowerThreshold: function() {
		this.$$('d2l-basic-image-selector').loadMore(this.$['image-selector-threshold']);
	},
	_onClearImageScrollThreshold: function() {
		this.$['image-selector-threshold'].clearTriggers();
	},
	_onCourseImageLoaded: function() {
		this._courseImagesLoadedEventCount++;

		if (this._courseImagesLoadedEventCount === this._initiallyVisibleCourseTileCount) {
			this.performanceMark('d2l.my-courses.visible-images-complete');
			this.performanceMeasure(
				'd2l.my-courses',
				'd2l.my-courses.attached',
				'd2l.my-courses.visible-images-complete'
			);
		}
	},
	_onCourseTileOrganization: function() {
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
	},
	_onInitiallyVisibleCourseTile: function() {
		this._initiallyVisibleCourseTileCount++;
	},
	_onEnrollmentPinAction: function(e) {
		var isPinned = e.type === 'enrollment-pinned';
		var orgUnitId = this._getOrgUnitIdFromHref(this.getEntityIdentifier(this.parseEntity(e.detail.organization)));

		if (!orgUnitId) {
			return;
		}

		this.fire(
			'd2l-course-pinned-change', {
				orgUnitId: orgUnitId,
				isPinned: isPinned
			}
		);
	},
	_onEnrollmentPinnedMessage: function(e) {
		if (dom(e).rootTarget === this) return;

		var isPinned = e.detail.isPinned;
		var orgUnitId;
		if (e.detail.orgUnitId) {
			orgUnitId = e.detail.orgUnitId;
		} else if (e.detail.organization) {
			orgUnitId = this._getOrgUnitIdFromHref(this.getEntityIdentifier(this.parseEntity(e.detail.organization)));
		} else if (e.detail.enrollment && e.detail.enrollment.hasLinkByRel(Rels.organization)) {
			orgUnitId = this._getOrgUnitIdFromHref(e.detail.enrollment.getLinkByRel(Rels.organization).href);
		}

		// Only want to move pinned/unpinned enrollment if it exists in the panel
		var changedEnrollmentId = orgUnitId && this._orgUnitIdMap[orgUnitId];
		if (!changedEnrollmentId) {
			return this._refetchEnrollments();
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

		var enrollmentCard = dom(e).event && dom(e).event.srcElement;
		var shouldHide = enrollmentCard && !isPinned && (enrollmentCard.hasAttribute('completed') || (enrollmentCard.hasAttribute('closed')));

		var removalIndex = this._enrollments.indexOf(changedEnrollmentId);
		var insertIndex = this._lastPinnedIndex + 1;

		if (!isPinned) {
			this._lastPinnedIndex--;
		}

		if (isPinned) {
			this._lastPinnedIndex++;
		}

		if (removalIndex === insertIndex && !shouldHide) {
			this._onResize();
			return;
		}

		if (removalIndex !== -1) {
			this.splice('_enrollments', removalIndex, 1);

			if (shouldHide && !this._isPinnedTab) {
				this._onResize();
				return;
			}

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
	},
	_onStartedInactiveAlert: function(e) {
		if (this._checkIfStartedInactiveCourses(e)) {
			this._addAlert('warning', 'startedInactiveCourses', this.localize('startedInactiveAlert'));
		}
	},
	_onTabSelected: function(e) {
		// Only handle if tab selected corresponds to this panel
		if (!this.parentElement || dom(e).rootTarget.id !== this.parentElement.id) {
			document.body.removeEventListener('d2l-course-pinned-change', this._onEnrollmentPinnedMessage, true);
			return;
		}

		// Only listen to pin updates for the current tab
		document.body.addEventListener('d2l-course-pinned-change', this._onEnrollmentPinnedMessage, true);

		if (this._isRefetchNeeded) {
			this._showContent = false;
			this._isRefetchNeeded = false;
			this._resetEnrollments();

			var completeFetch = function() {
				this._showContent = true;
			}.bind(this);

			this._refetchEnrollments().then(function() {
				window.dispatchEvent(new Event('resize'));
				setTimeout(completeFetch, 1000);
			}.bind(this)).catch(completeFetch);
		} else if (this._numberOfEnrollments === 0) {
			this._fetchRoot()
				.then(function() {
					window.dispatchEvent(new Event('resize'));
				});
		} else {
			setTimeout(function() {
				// Force redraw of course tiles.
				window.dispatchEvent(new Event('resize'));
			}, 10);
		}
		this._setLastSearchName(this.enrollmentsSearchAction.name);

		// Whenever the selected tab changes, update tabSearchActions so
		// All Courses will have the same tab selected when it opens
		this.tabSearchActions = this.tabSearchActions.map(function(action) {
			return {
				name: action.name,
				title: action.title,
				selected: action.name === this.enrollmentsSearchAction.name,
				enrollmentsSearchAction: action.enrollmentsSearchAction
			};
		}.bind(this));
	},
	_checkIfStartedInactiveCourses: function(e) {
		var type = e && e.detail && e.detail.type;
		var hasStartedInactiveCourses = false;
		if (this.cssGridView) {
			hasStartedInactiveCourses = !!this.$$('.course-tile-grid d2l-enrollment-card[started-inactive]');
		} else {
			hasStartedInactiveCourses = this.$$('d2l-course-tile-grid').checkForStartedInactive(type);
		}
		return hasStartedInactiveCourses;
	},
	_onSimpleOverlayClosed: function() {
		this._removeAlert('setCourseImageFailure');
		// update the startedInactive alert in case the user changed the pinned states in the overlay
		this._onStartedInactiveAlert();
	},
	_onOpenChangeImageView: function(e) {
		if (e.detail.organization) {
			this._setImageOrg = this.parseEntity(e.detail.organization);
		}

		this.$['basic-image-selector-overlay'].open();
	},
	_onSetCourseImage: function(e) {
		this.$['basic-image-selector-overlay'].close();
		this._removeAlert('setCourseImageFailure');
		if (e && e.detail) {
			if (e.detail.status === 'failure') {
				setTimeout(function() {
					this._addAlert('warning', 'setCourseImageFailure', this.localize('error.settingImage'));
				}.bind(this), 1000); // delay until the tile fail icon animation begins to kick in (1 sec delay)
			}
		}
		if (this._allCoursesCreated) {
			this.$$('d2l-all-courses').setCourseImage(e);
		}
		!this.cssGridView && this.$$('d2l-course-tile-grid').setCourseImage(e);
	},
	_onPresentationUrlChange: function(newValue) {
		this.fetchSirenEntity(newValue, true);
	},
	_onCourseEnrollmentChange: function(newValue) {
		if (!newValue) {
			return;
		}

		if (this._isAllTab || this._isPinnedTab || (newValue.orgUnitId && this._orgUnitIdMap[newValue.orgUnitId])) {
			this._isRefetchNeeded = true;
		}
	},
	_computeIsAllTab: function(actionName) {
		return actionName === Actions.enrollments.searchMyEnrollments;
	},
	_computeIsPinnedTab: function(actionName) {
		return actionName === Actions.enrollments.searchMyPinnedEnrollments;
	},
	/*
	* Utility/helper functions
	*/

	_createFetchEnrollmentsUrl: function(bustCache) {
		var query = {
			pageSize: 20,
			sort: 'current',
			autoPinCourses: false,
			promotePins: true,
			embedDepth: 0
		};
		var enrollmentsSearchUrl = this.createActionUrl(this.enrollmentsSearchAction, query);

		if (bustCache) {
			enrollmentsSearchUrl += '&bustCache=' + Math.random();
		}

		return enrollmentsSearchUrl;
	},
	_createAllCourses: function() {
		if (!this._allCoursesCreated) {
			var allCourses = document.createElement('d2l-all-courses');
			this.$.allCoursesPlaceholder.appendChild(allCourses);
			this._allCoursesCreated = true;
		}
	},
	_keypressOpenAllCoursesView: function(e) {
		if (e.code === 'Space' || e.code === 'Enter') {
			return this._openAllCoursesView(e);
		}
	},
	_fetchRoot: function() {
		if (!this.enrollmentsSearchAction) {
			return;
		}
		this.performanceMark('d2l.my-courses.root-enrollments.request');

		var showContent = function() {
			this._showContent = true;
		}.bind(this);

		return this._fetchEnrollments()
			.then(function() {
				// At worst, display content 1s after we fetch enrollments
				// (Usually set to true before that, in _onCourseTileOrganization)
				setTimeout(showContent, 1000);
			}.bind(this))
			.catch(showContent);
	},
	_fetchEnrollments: function() {
		this.performanceMark('d2l.my-courses.root-enrollments.response');
		this.performanceMeasure(
			'd2l.my-courses.root-enrollments',
			'd2l.my-courses.root-enrollments.request',
			'd2l.my-courses.root-enrollments.response'
		);

		this._enrollmentsSearchUrl = this._createFetchEnrollmentsUrl();
		this.performanceMark('d2l.my-courses.search-enrollments.request');
		return this.fetchSirenEntity(this._enrollmentsSearchUrl)
			.then(this._enrollmentsResponsePerfMeasures.bind(this))
			.then(this._populateEnrollments.bind(this));
	},
	_enrollmentsResponsePerfMeasures: function(enrollmentsEntity) {
		this.performanceMark('d2l.my-courses.search-enrollments.response');
		this.performanceMeasure(
			'd2l.my-courses.search-enrollments',
			'd2l.my-courses.search-enrollments.request',
			'd2l.my-courses.search-enrollments.response'
		);

		return Promise.resolve(enrollmentsEntity);
	},
	_getOrgUnitIdFromHref: function(organizationHref) {
		var match = /[0-9]+$/.exec(organizationHref);

		if (!match) {
			return;
		}
		return match[0];
	},
	_getViewAllCoursesText: function(hasMoreEnrollments, enrollmentsLength) {
		var viewAllCourses = this.localize('viewAllCourses');

		// With individual fetching of courses as they get pinned, we can end
		// up with "21+", "22+", etc., so round down to nearest 5 for >20 courses
		var maxCount = 99;
		var count = enrollmentsLength < 20
			? enrollmentsLength
			: String(enrollmentsLength - (enrollmentsLength % 5));
		if (count > maxCount) {
			count = maxCount + '+';
		}
		if (hasMoreEnrollments && count !== maxCount + '+') {
			count += '+';
		}

		return enrollmentsLength > 0 ? viewAllCourses + ' (' + count + ')' : viewAllCourses;
	},
	_openAllCoursesView: function(e) {
		this._createAllCourses();

		var allCourses = this.$$('d2l-all-courses');

		allCourses.enrollmentsSearchAction = this.enrollmentsSearchAction;
		allCourses.tabSearchActions = this.tabSearchActions;
		allCourses.tabSearchType = this.tabSearchType;
		allCourses.locale = this.locale;
		allCourses.advancedSearchUrl = this.advancedSearchUrl;
		allCourses.filterStandardSemesterName = this.standardSemesterName;
		allCourses.filterStandardDepartmentName = this.standardDepartmentName;
		allCourses.updatedSortLogic = this.updatedSortLogic;
		allCourses.cssGridView = this.cssGridView;
		allCourses.presentationUrl = this.presentationUrl;
		allCourses.showCourseCode = this.showCourseCode;
		allCourses.showSemester = this.showSemester;
		allCourses.courseUpdatesConfig = this.courseUpdatesConfig;

		allCourses.open();

		e.preventDefault();
		e.stopPropagation();
	},
	_populateEnrollments: function(enrollmentsEntity) {
		var enrollmentEntities = enrollmentsEntity.getSubEntitiesByClass('enrollment');
		var hasMoreEnrollments = enrollmentsEntity.hasLinkByRel('next');
		this._nextEnrollmentEntityUrl = hasMoreEnrollments ? enrollmentsEntity.getLinkByRel('next').href : null;
		var newEnrollments = [];

		var searchAction = enrollmentsEntity.getActionByName(Actions.enrollments.searchMyEnrollments);

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
			var tileGrid = this.cssGridView ? this.$$('.course-tile-grid') : this.$$('d2l-course-tile-grid');
			tileGrid.setAttribute('hide-past-courses', '');
			this._hidePastCourses = true;
		}

		enrollmentEntities.forEach(function(enrollment) {
			var enrollmentId = enrollment.href;
			if (!this._existingEnrollmentsMap.hasOwnProperty(enrollmentId)) {
				newEnrollments.push(enrollmentId);
				this._existingEnrollmentsMap[enrollmentId] = true;
				if (enrollment.hasClass('pinned')) this._lastPinnedIndex++;
			}
		}, this);

		this._enrollments = this._enrollments.concat(newEnrollments);
		this._numberOfEnrollments += newEnrollments.length;

		if (this._enrollments.length === 0) {
			// Normally we'd wait until the visible organization requests have finished,
			// but this user has no enrollments, so we won't hit that case.
			this._showContent = true;
		}

		this.fire('recalculate-columns');

		var lastEnrollment = enrollmentEntities[enrollmentEntities.length - 1];
		if (lastEnrollment && lastEnrollment.hasClass('pinned') && this._nextEnrollmentEntityUrl) {
			return this.fetchSirenEntity(this._nextEnrollmentEntityUrl)
				.then(this._populateEnrollments.bind(this));
		}
	},
	_refetchEnrollments: function() {
		this._enrollmentsSearchUrl = this._createFetchEnrollmentsUrl(true);
		return this.fetchSirenEntity(this._enrollmentsSearchUrl)
			.then(this._populateEnrollments.bind(this));
	},
	_resetEnrollments: function() {
		this._lastPinnedIndex = -1;
		this._existingEnrollmentsMap = {};
		this._enrollments = [];
		this._numberOfEnrollments = 0;
	},
	_setLastSearchName: function(id) {
		this.submitForm(this.userSettingsUrl, {
			'mostRecentEnrollmentsSearchType': '0',
			'mostRecentEnrollmentsSearchName': id
		});
	}
};

/*
* @polymerBehavior D2L.MyCourses.MyCoursesContentBehavior
*/
D2L.MyCourses.MyCoursesContentBehavior = [
	D2L.MyCourses.MyCoursesBehavior,
	D2L.MyCourses.CourseTileResponsiveGridBehavior,
	D2L.MyCourses.InteractionDetectionBehavior,
	D2L.MyCourses.AlertBehavior,
	D2L.MyCourses.UtilityBehavior,
	D2L.MyCourses.CssGridBehavior,
	D2L.MyCourses.MyCoursesContentBehaviorImpl
];
