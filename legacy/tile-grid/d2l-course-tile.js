/*
`d2l-course-tile`
Polymer-based web component for the course tile, used in `d2l-course-tile-grid`.

An important distinction to make in understanding the functionality of the course tile is the difference between an
enrollment and an organization. An organization is what some might call a "course" - it has a name, an image, etc.,
but it is largely static and doesn't speak to a user's relationship to it. An enrollment, on the other hand, represents
a user's involvement in an organization, i.e. it is a three-tuple between the user, the organization, and the role that
the user has in that organization - student, teacher, TA, etc.
*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-course-image/d2l-course-image.js';
import '@brightspace-ui/core/components/dropdown/dropdown.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import { Classes } from 'd2l-hypermedia-constants';
import { Rels } from 'd2l-hypermedia-constants';
import { Actions } from 'd2l-hypermedia-constants';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/icons/icon.js';
import 'd2l-organization-hm-behavior/d2l-organization-hm-behavior.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item-link.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui/core/components/offscreen/offscreen.js';
import { isComposedAncestor } from '@brightspace-ui/core/helpers/dom.js';
import { IronA11yAnnouncer } from '@polymer/iron-a11y-announcer/iron-a11y-announcer.js';
import 'intersection-observer/intersection-observer.js';
import './d2l-course-tile-styles.js';
import '../localize-behavior-legacy.js';
import '../d2l-utility-behavior-legacy.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-course-tile">
	<template strip-whitespace="">
		<style include="d2l-course-tile-styles">

		:host(.unpin-hovered) .tile-container {
			transform: scale(1.05);
			box-shadow: 3px 2px 10px rgba(0, 0, 0, 0.3);
		}
		:host([animate-insertion]:not(.animate-insertion):not(.animation-complete)) .tile-container {
			animation: var(--insertion-delay, 10ms) forwards tile-pre-insertion;
			animation-iteration-count: 1;
			pointer-events: none;
		}
		:host(.animate-insertion) .tile-container {
			animation: 0.6s forwards scale-and-fade-in;
			animation-direction: normal;
			animation-iteration-count: 1;
			pointer-events: none;
		}
		:host(.unpin) {
			z-index: 100;
		}
		:host(.unpin) .tile-container {
			animation: 0.7s forwards scale-and-fade-out;
			pointer-events: none;
			z-index: 100;
		}

		</style>

		<div class="tile-container" on-mouseover="_hoverCourseTile" on-mouseout="_onTileMouseOut">
			<div class="alert-color-circle"></div>
			<a href$="[[_organizationHomepageUrl]]" id="d2l-course-tile-anchor" class="no-tap-interaction" on-focus="_hoverCourseTile" role="link">
				<div class="course-image-container" aria-hidden="true">
					<div class="course-image">
						<div class="image-overlay">
							<d2l-loading-spinner id="tileImageLoading" size="85"></d2l-loading-spinner>
							<div class="icon-container">
								<d2l-icon class$="[[_iconDetails.className]]" icon="[[_iconDetails.iconName]]"></d2l-icon>
							</div>
						</div>
						<div class="notification-overlay">
							<div class="overlay-date-container">
								<div class="overlay-text">[[_notificationTitle]]</div>
								<div class="overlay-date">[[_notificationDate]]</div>
								<div class="overlay-inactive">[[_notificationInactive]]</div>
							</div>
						</div>
						<d2l-course-image image="[[_image]]" sizes="[[tileSizes]]" type="tile"></d2l-course-image>
					</div>
				</div>

				<div class="course-info">
					<div class="course-text">
						[[_organization.properties.name]]
						<div>
							<span class="course-code-text uppercase">
								[[_organization.properties.code]]
								<d2l-icon hidden$="[[!_showSeparator]]" class="separator-icon" icon="d2l-tier1:bullet"></d2l-icon>
							</span>
							<span class="course-semester-text">[[_semesterName]]</span>
						</div>
						<d2l-offscreen id="courseNotificationLabel" aria-hidden="true">[[_courseNotificationLabel]]</d2l-offscreen>
					</div>
					<div id="courseUpdates" hidden$="[[!_hasCourseUpdates]]" aria-hidden="true">
						<d2l-offscreen>[[localize('courseTile.updates')]]</d2l-offscreen>
						<span class="update-text-box">[[_courseUpdates]]</span>
					</div>
				</div>
			</a>

			<div class="menu-bar">
				<div class="hover-menu no-tap-interaction">
					<d2l-dropdown>
						<button class="menu-item no-tap-interaction d2l-dropdown-opener" aria-label$="[[_courseSettingsLabel]]">
							<d2l-icon icon="d2l-tier1:more"></d2l-icon>
						</button>
						<template is="dom-if" if="[[_showHoverMenu]]">
							<d2l-dropdown-menu id="overflow-dropdown">
								<d2l-menu label$="[[_courseSettingsLabel]]">
									<template is="dom-if" if="[[_courseInfoUrl]]" restamp="true">
										<d2l-menu-item-link id="see-course-info-link" text="[[localize('courseOfferingInformation')]]" href="[[_courseInfoUrl]]">
										</d2l-menu-item-link>
									</template>
									<template is="dom-if" if="[[_canChangeCourseImage]]" restamp="true">
										<d2l-menu-item id="change-image-button" text="[[localize('changeImage')]]" on-d2l-menu-item-select="_launchCourseTileImageSelector">
										</d2l-menu-item>
									</template>
									<d2l-menu-item id="pin-button" text$="[[_pinLabel]]" on-d2l-menu-item-select="_pinClickHandler" on-focus="_hoverPinMenuItem" on-blur="_unhoverPinMenuItem" on-mouseover="_hoverPinMenuItem" on-mouseout="_unhoverPinMenuItem">
									</d2l-menu-item>
								</d2l-menu>
							</d2l-dropdown-menu>
						</template>
					</d2l-dropdown>
				</div>
				<button id="pin-indicator-button" class="pin-indicator menu-item" on-tap="_pinClickHandler" on-keypress="_pinPressHandler" aria-label$="[[_coursePinButtonLabel]]">
					<d2l-icon icon="d2l-tier1:pin-filled"></d2l-icon>
				</button>
			</div>

		</div>
	</template>

</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-course-tile',

	properties: {
		animate: Boolean,
		animateInsertion: {
			type: Boolean,
			reflectToAttribute: true
		},
		// Course tile enrollment entity
		enrollment: Object,
		enrollmentId: String,
		// Whether the enrollment represented by this course tile is pinned or not
		pinned: {
			type: Boolean,
			observer: '_pinnedChanged'
		},
		locale: String,
		// Size the tile should render with respect to vw
		tileSizes: Object,
		// Configuration value passed in to toggle course code
		showCourseCode: {
			type: Boolean,
			reflectToAttribute: true
		},
		// Configuration value passed in to toggle course code
		showSemester: {
			type: Boolean,
			reflectToAttribute: true
		},
		isStartedInactive: {
			type: Boolean,
			value: false
		},
		// Indicates whether the course has the info urls
		hasCourseInfoUrl: {
			type: Boolean,
			value: false,
			reflectToAttribute: true
		},
		// Types of notifications to include in update count
		courseUpdatesConfig: Object,
		//number of course updates to show
		_courseUpdates: String,
		_courseInfoUrl: String,
		// The organization Entity, fetched by the course tile when the `enrollment` Entity is changed
		_organization: Object,
		// The URL to of the `_organization`'s homepage - when the course tile is clicked, this is the URL we go to
		_organizationHomepageUrl: String,
		// The term used for the text of the pin/unpin menu item
		_pinLabel: String,
		// The langterm of the course settings label
		_courseSettingsLabel: String,
		// The langterm of the course pin button label
		_coursePinButtonLabel: String,
		_courseNotificationLabel: String,
		_canChangeCourseImage: Boolean,
		_forceImageRefresh: Boolean,
		_hasCourseUpdates: {
			type: Boolean,
			value: false
		},
		_image: Object,
		_nextImage: Object,
		// The icon we want to show when you select an image
		_iconDetails: {
			type: Object,
			value: {
				className: '',
				iconName: ''
			}
		},
		_notificationInactive: String,
		_notificationTitle: String,
		_notificationDate: String,
		_showHoverMenu: {
			type: Boolean,
			value: false
		},
		_semesterName: String,
		_showSeparator: {
			type: Boolean,
			value: false,
			computed: '_computeShowSeparator(_semesterName)'
		},
		// Set by the IntersectionObserver when tile is first visible in viewport
		_load: Boolean
	},
	behaviors: [
		D2L.PolymerBehaviors.MyCourses.LocalizeBehaviorLegacy,
		D2L.MyCourses.UtilityBehaviorLegacy,
		D2L.PolymerBehaviors.Hypermedia.OrganizationHMBehavior
	],
	observers: [
		'_fetchEnrollmentData(_load, enrollment)'
	],
	attached: function() {
		afterNextRender(this, function() {
			var tileContainerEl = this.$$('.tile-container');
			document.body.addEventListener('focus', this._onFocus, true);
			tileContainerEl.addEventListener('focus', this._hoverCourseTile, true);
			tileContainerEl.addEventListener('animationend', this._onAnimationComplete, true);

			var observerCallback = function(entries, observer) {
				if (this._load) {
					// The tile already loaded via requestIdleCallback/setTimeout
					return;
				}

				for (var i = 0; i < entries.length; i++) {
					// Chrome/FF immediately call the callback when we observer.observe()
					// so we need to also make sure the tile is visible for that first run
					// see https://bugs.chromium.org/p/chromium/issues/detail?id=713819
					if (entries[i].intersectionRatio > 0) {
						observer.unobserve(tileContainerEl);
						this.fire('initially-visible-course-tile');
						this._load = true;
						break;
					}
				}
			}.bind(this);

			var observer = new IntersectionObserver(observerCallback);

			// Small shim for Edge/IE/Safari
			var delayFunction = window.requestIdleCallback || setTimeout;
			delayFunction(function() {
				if (this._load) {
					// The tile already loaded via the IntersectionObserver
					return;
				}
				// Whether we load because the tile became visible, or because we got some
				// idle time, we want to disconnect the observer either way
				observer.unobserve(tileContainerEl);
				this._load = true;
			}.bind(this));

			observer.observe(tileContainerEl);
		}.bind(this));
	},
	detached: function() {
		var tileContainerEl = this.$$('.tile-container');
		tileContainerEl.removeEventListener('focus', this._hoverCourseTile, true);
		tileContainerEl.removeEventListener('animationend', this._onAnimationComplete, true);
		document.body.removeEventListener('focus', this._onFocus, true);
	},
	ready: function() {
		this._onFocus = this._onFocus.bind(this);
		this._closeDropdown = this._closeDropdown.bind(this);
		this._hoverCourseTile = this._hoverCourseTile.bind(this);
		this._onAnimationComplete = this._onAnimationComplete.bind(this);
		IronA11yAnnouncer.requestAvailability();
	},
	focus: function() {
		this.$['d2l-course-tile-anchor'].focus();
	},
	// Handler that triggers the API call to change an enrollment's pin state when the user says DO IT
	pinClickHandler: function() {
		var pinAction = this.pinned
			? this.enrollment.getActionByName(Actions.enrollments.unpinCourse)
			: this.enrollment.getActionByName(Actions.enrollments.pinCourse);

		// This value is purely for UI responsiveness - if the request fails, this value will be set back to
		// the previous value in the error handler; if the request succeeds, we also set it in the response
		// handler (to this same value), but that could take a few hundred ms, so do it before the request too.
		this.pinned = !this.pinned;

		var body = '';
		var fields = pinAction.fields || [];
		fields.forEach(function(field) {
			body = body + encodeURIComponent(field.name) + '=' + encodeURIComponent(field.value) + '&';
		});

		var promise = window.d2lfetch
			.fetch(new Request(pinAction.href, {
				method: pinAction.method,
				body: body,
				headers: {
					'accept':'application/vnd.siren+json',
					'content-type':'application/x-www-form-urlencoded'
				}
			}))
			.then(this.responseToSirenEntity.bind(this))
			.then(function(enrollment) {
				// The pin action returns the updated enrollment, so update
				// this.enrollment with the modified one
				this.enrollment = enrollment;
				this.pinned = this.enrollment.hasClass(Classes.enrollments.pinned);
				if (!this.animate) this.fire('tile-remove-complete', { enrollment: this.enrollment, pinned: this.pinned });
			}.bind(this))
			.catch(function() {
				// Just revert back to whatever pin state we already had stored
				this.pinned = this.enrollment.hasClass(Classes.enrollments.pinned);
			}.bind(this));

		var eventName = this.pinned ? 'enrollment-pinned' : 'enrollment-unpinned';
		this.fire(eventName, {
			enrollment: this.enrollment,
			organization: this._organization
		});

		if (this.animate) this._pinAnimationInProgress = true;
		this.toggleClass('unpin-hovered', false, this);

		if (this.animate) this.toggleClass('unpin', true, this);

		var localizeKey = this.pinned ? 'pinActionResult' : 'unpinActionResult';
		var announceText = this.localize(localizeKey, 'course', this._organization.properties.name);
		this.fire('iron-announce', {
			text: announceText
		}, { bubbles: true });

		this._pendingPinAction = this.pinned;

		return promise
			.then(function() {
				// Wait until after PUT has finished to fire, so that
				// listeners are guaranteed to fetch updated entity
				this.fire('d2l-course-pinned-change', {
					enrollment: this.enrollment,
					isPinned: this.pinned
				});
			}.bind(this));
	},
	// Refreshes image from organization API call (especially useful when uploading course image)
	refreshImage: function() {
		var tileContainer = this.$$('.tile-container');

		this._forceImageRefresh = true;
		this.toggleClass('change-image-loading', true, tileContainer);

		this._fetchOrganization()
			.then(this._onOrganizationResponse.bind(this))
			.then(this._displaySetImageResult.bind(this, true, true))
			.catch(this._displaySetImageResult.bind(this, false));
	},
	setCourseImage: function(image, status) {
		var newImageHref = this.getDefaultImageLink(image),
			newSrcset = this.getImageSrcset(image, 'tile');

		switch (status) {
			case 'set':
				this.toggleClass('change-image-loading', true, this.$$('.tile-container'));
				// load the image while the loading spinner runs to that we have it when the spinner ends
				// NOTE: if this needs optimization, we can wait for the image's onload to play the success animation
				this._nextImage = image;
				var imagePreloader = document.createElement('img');
				imagePreloader.setAttribute('src', newImageHref);
				imagePreloader.setAttribute('srcset', newSrcset);
				imagePreloader.setAttribute('sizes', this.$$('d2l-course-image').getTileSizes());
				break;
			case 'success':
				this._displaySetImageResult(true);
				break;
			case 'failure':
				this._displaySetImageResult(false);
				break;
		}
	},
	_organizationUrl: null,
	_notificationsUrl: null,
	_pendingPinAction: false,
	_pinAnimationInProgress: false,
	_fetchOrganization: function() {
		if (!this._organizationUrl) {
			return;
		}

		return window.d2lfetch
			.fetch(new Request(this._organizationUrl, {
				headers: {
					'accept': 'application/vnd.siren+json',
					// Needs no-cache so that images refresh if the users here using the back button
					'cache-control': 'no-cache',
					'pragma': 'no-cache'
				}
			}))
			.then(this.responseToSirenEntity.bind(this));
	},
	_fetchNotifications: function() {
		if (!this._notificationsUrl || !this.courseUpdatesConfig) {
			return Promise.resolve();
		}

		if (!this.courseUpdatesConfig.showUnattemptedQuizzes
			&& !this.courseUpdatesConfig.showDropboxUnreadFeedback
			&& !this.courseUpdatesConfig.showUngradedQuizAttempts
			&& !this.courseUpdatesConfig.showUnreadDiscussionMessages
			&& !this.courseUpdatesConfig.showUnreadDropboxSubmissions) {
			return Promise.resolve();
		}

		return this.fetchSirenEntity(this._notificationsUrl);
	},
	_fetchSemester: function() {
		if (this._semesterUrl && this.showSemester) {
			return this.fetchSirenEntity(this._semesterUrl)
				.then(this._onSemesterResponse.bind(this));
		}
		return Promise.resolve();
	},
	_fetchEnrollmentData: function() {
		if (!this.enrollment || !this._load) {
			return;
		}

		this.pinned = this.enrollment.hasClass(Classes.enrollments.pinned);

		if (!this.enrollment.hasLinkByRel(Rels.organization)) {
			return;
		}

		var organizationLink = this.enrollment.getLinkByRel(Rels.organization);
		if (!this._organizationUrl || this._organizationUrl.indexOf(organizationLink.href) !== 0) {
			this._organizationUrl = organizationLink.href + '?embedDepth=1';
		}

		return this._fetchOrganization()
			.then(this._onOrganizationResponse.bind(this))
			.then(function() {
				return Promise.all([
					this._fetchSemester(),
					this._fetchNotifications()
						.then(this._onNotificationsResponse.bind(this))
				]);
			}.bind(this));
	},
	_displaySetImageResult: function(success, skipSetImage) {
		var tileContainer = this.$$('.tile-container');
		var courseImage = this.$$('.course-image img');

		var successClass = 'change-image-success',
			failureClass = 'change-image-failure';

		// We want to wait at least a second of the load icon before showing the status
		setTimeout(function() {
			this.toggleClass('change-image-loading', false, tileContainer);
			this.toggleClass(successClass, success, tileContainer);
			this.toggleClass(failureClass, !success, tileContainer);
			this._iconDetails = success ?
				{ className: 'checkmark', iconName: 'd2l-tier2:check' } :
				{ className: 'fail-icon', iconName: 'd2l-tier3:close' };

			// Remove the icon after a bit of time
			setTimeout(function() {
				if (success && !skipSetImage) {
					this.toggleClass('d2l-course-tile-hidden', false, courseImage);
					this._image = this._nextImage;
				}
				this.toggleClass(successClass, false, tileContainer);
				this.toggleClass(failureClass, false, tileContainer);
			}.bind(this), 1000);
		}.bind(this), 1000);
	},
	_launchCourseTileImageSelector: function(e) {
		e.preventDefault();
		e.stopPropagation();

		this.fire('open-change-image-view', {
			organization: this._organization
		});
	},
	_hoverCourseTile: function() {
		this._showHoverMenu = true;
		this._setCourseTileHovered(true);
	},
	_pinClickHandler: function(e) {
		// Prevent the click from triggering navigation to the course
		e.preventDefault();

		this.pinClickHandler();
	},
	_hoverPinMenuItem: function() {
		this._onUnpinHover({ detail: { hoverState: true } });
		this._hoverCourseTile();
	},
	_pinPressHandler: function(e) {
		if (e.code === 'Space' || e.code === 'Enter') {
			return this.pinClickHandler();
		}
	},
	_onAnimationComplete: function(e) {
		if (e.target !== this.$$('.tile-container')) {
			return;
		}

		if (e.animationName.indexOf('scale-and-fade-out') > -1) {
			this.fire('tile-remove-complete', { enrollment: this.enrollment, pinned: this._pendingPinAction });
		} else if (e.animationName.indexOf('scale-and-fade-in') > -1) {
			this.toggleClass('animate-insertion', false, this);
			this.toggleClass('animation-complete', true, this);
			this.fire('tile-insert-complete', { enrollment: this.enrollment, pinned: this._pendingPinAction });
		} else if (e.animationName.indexOf('tile-pre-insertion') > -1) {
			this.toggleClass('animate-insertion', true, this);
		}

		this.toggleClass('unpin', false, this);
		this._pinAnimationInProgress = false;
		this._unhoverCourseTile();
	},
	_onOrganizationResponse: function(organization) {

		this._organization = organization;
		afterNextRender(this, function() {
			this.fire('course-tile-organization');
		}.bind(this));

		var courseInfoUrl = organization && organization.getLinkByRel(Rels.courseOfferingInfoPage);
		this._courseInfoUrl = courseInfoUrl ? courseInfoUrl.href : null;
		if (this._courseInfoUrl) {
			this.hasCourseInfoUrl = true;
		}

		this._checkDateBounds(organization);

		var semesterUrl = organization && organization.getLinkByRel(Rels.parentSemester);
		this._semesterUrl = semesterUrl ? semesterUrl.href : null;

		this._setCourseImageSrc();

		var homepageEntity = organization.getSubEntityByRel(Rels.organizationHomepage);
		if (homepageEntity) {
			this._organizationHomepageUrl = homepageEntity.properties.path;
		} else {
			this._organizationHomepageUrl = null;
		}
		if (!this._organizationHomepageUrl) {
			var tileContainer = this.$$('.tile-container');
			this.toggleClass('d2l-no-access', true, tileContainer);
		}
		this._canChangeCourseImage = this._getCanChangeCourseImage(organization);
		this._pinnedChanged();

		if (organization.properties) {
			this._courseSettingsLabel = this.localize('courseSettings', 'course', this._organization.properties.name);
			this._coursePinButtonLabel = this.localize('coursePinButton', 'course', this._organization.properties.name);
		}

		var notificationsLink = organization && organization.getLinkByRel(Rels.Notifications.organizationNotifications);
		this._notificationsUrl = notificationsLink ? notificationsLink.href : null;

		return Promise.resolve();
	},
	_onNotificationsResponse: function(notifications) {
		if (!this.courseUpdatesConfig || !notifications) {
			return Promise.resolve();
		}

		var total = 0;
		if (this.courseUpdatesConfig.showUnattemptedQuizzes) {
			total += notifications.properties.UnattemptedQuizzes;
		}
		if (this.courseUpdatesConfig.showDropboxUnreadFeedback) {
			total += notifications.properties.UnreadAssignmentFeedback;
		}
		if (this.courseUpdatesConfig.showUngradedQuizAttempts) {
			total += notifications.properties.UngradedQuizzes;
		}
		if (this.courseUpdatesConfig.showUnreadDiscussionMessages) {
			total += notifications.properties.UnreadDiscussions + notifications.properties.UnapprovedDiscussions;
		}
		if (this.courseUpdatesConfig.showUnreadDropboxSubmissions) {
			total += notifications.properties.UnreadAssignmentSubmissions;
		}
		this._setCourseUpdates(total);
	},
	_onSemesterResponse: function(semester) {

		this._semesterName = (semester.properties || {}).name;
		return Promise.resolve();
	},
	_setCourseUpdates: function(updates) {
		this._hasCourseUpdates = updates > 0;
		this._courseUpdates = updates > 99 ? '99+' : Math.max(updates, 0);
		this.$$('#courseUpdates').setAttribute('aria-hidden', updates === 0 ? 'true' : 'false');
	},
	_checkDateBounds: function(organization) {
		if (!organization.properties) {
			return;
		}

		var nowDate = Date.now();
		var endDate = Date.parse(organization.properties.endDate);
		var startDate = Date.parse(organization.properties.startDate);
		var inactive = !organization.properties.isActive;

		this.removeAttribute('past-course');

		if (endDate < nowDate) {
			this.setAttribute('past-course', '');
			this._setOverlayContent('courseEnded', endDate);
		} else if (startDate > nowDate) {
			this._setOverlayContent('courseStarting', startDate, inactive);
		} else if (startDate && inactive) {
			this._setOverlayStartedInactive();
		} else if (inactive) {
			this._setOverlayInactive();
		} else {
			this._clearOverlayContent();
		}
	},
	_setOverlayContent: function(type, date, inactive) {

		this._clearOverlayContent();

		var dateObj = new Date(date);

		this._notificationDate = this.formatDateTime(
			dateObj,
			{ 'format': 'medium' }
		);
		var courseEndedTerm = (type === 'courseEnded') ? 'overlay.courseEndedOn' : 'overlay.courseStartingOn';
		this._courseNotificationLabel = this.localize(
			courseEndedTerm,
			'dateTime',
			this.formatDate(dateObj, { format: 'MMMM d, yyyy' }) + ' ' + this.formatTime(dateObj)
		);
		this.toggleClass('notification-overlay-active', true, this.$$('.tile-container'));
		this.$$('#courseNotificationLabel').setAttribute('aria-hidden', 'false');
		var courseNotificationTitleTerm = (type === 'courseEnded') ? 'overlay.courseEnded' : 'overlay.courseStarting';
		this._notificationTitle = this.localize(courseNotificationTitleTerm);

		this._notificationInactive = (type === 'courseStarting' && inactive) ? this.localize('brackets', 'content', this.localize('overlay.inactive')) : null;

	},
	_setOverlayInactive: function() {
		this._clearOverlayContent();
		this._notificationTitle = this.localize('overlay.inactive');
		this._courseNotificationLabel = this.localize('overlay.inactive');
		this.$$('#courseNotificationLabel').setAttribute('aria-hidden', 'false');
		this.toggleClass('notification-overlay-active', true, this.$$('.tile-container'));
	},
	_setOverlayStartedInactive: function() {
		this._clearOverlayContent(true);
		this._notificationTitle = this.localize('overlay.courseStarted');
		this._notificationInactive = this.localize('brackets', 'content', this.localize('overlay.inactive'));
		this._courseNotificationLabel = this._notificationTitle + ' ' + this._notificationInactive;
		this.$$('#courseNotificationLabel').setAttribute('aria-hidden', 'false');
		this.isStartedInactive = true;
		this.toggleClass('notification-overlay-active', true, this.$$('.tile-container'));
		if (this.hasCourseInfoUrl) {
			this.dispatchEvent(new CustomEvent(
				'started-inactive',
				{ bubbles: true, composed: true, details: { type: 'add' } }
			));
			this.toggleClass('warning-circle', true, this.$$('.alert-color-circle'));
		}
	},
	_clearOverlayContent: function() {
		this._notificationDate = null;
		this._courseNotificationLabel = null;
		this.$$('#courseNotificationLabel').setAttribute('aria-hidden', 'true');
		this._notificationTitle = null;
		this._notificationInactive = null;
		this.isStartedInactive = false;
		this.toggleClass('notification-overlay-active', false, this.$$('.tile-container'));
		this.toggleClass('warning-circle', false, this.$$('.alert-color-circle'));
	},
	_onTileMouseOut: function() {
		this._unhoverCourseTile(true);
	},
	_onUnpinHover: function(e) {
		this.toggleClass('unpin-hovered', e.detail.hoverState, this);
	},
	_pinnedChanged: function(pinned) {
		this._pinned = pinned === undefined ? this._pinned : pinned;
		this._pinned ? this.setAttribute('pinned', '') : this.removeAttribute('pinned');
		this._pinLabel = this.localize(this._pinned ? 'unpin' : 'pin');

		if (pinned === false && this.isStartedInactive) {
			this.dispatchEvent(new CustomEvent(
				'started-inactive',
				{ bubbles: true, composed: true, details: { type: 'remove' } }
			));
		}
	},
	_setCourseTileHovered: function(isHovered) {
		this.toggleClass('hover', isHovered, this.$$('.tile-container'));
		this.toggleClass('hover', isHovered, this.$$('.hover-menu'));
		this.toggleClass('hover', isHovered, this.$$('.course-image-container'));
	},
	_unhoverCourseTile: function(force) {
		var noHover = dom(this.root).querySelectorAll(':hover').length === 0;
		if ((force === true || noHover) && !this._pinAnimationInProgress) {
			window.setTimeout(this._closeDropdown);
		}
	},
	_unhoverPinMenuItem: function() {
		this._onUnpinHover({ detail: { hoverState: false } });
	},
	_getCanChangeCourseImage: function(organization) {
		return organization && organization.getActionByName(Actions.organizations.setCatalogImage);
	},
	_setCourseImageSrc: function() {
		if (!this._organization.hasSubEntityByClass(Classes.courseImage.courseImage)) {
			return;
		}

		var image = this._organization.getSubEntityByClass(Classes.courseImage.courseImage);
		image.forceImageRefresh = this._forceImageRefresh;
		this._image = image;
	},
	_onFocus: function() {
		/* timeout needed to work around lack of support for relatedTarget */
		setTimeout(function() {
			if (!document.activeElement	|| document.activeElement === document.body) {
				return;
			}
			var activeElement = dom(document.activeElement).node;
			if (!isComposedAncestor(this, activeElement)) {
				this._unhoverCourseTile();
			}
		}.bind(this), 0);
	},
	_closeDropdown: function() {
		if (dom(this.root).querySelectorAll(':hover').length === 0 && this._showHoverMenu) {
			var dropdown = this.$$('#overflow-dropdown');
			dropdown.close();
			this._setCourseTileHovered(false);
		}
	},
	_computeShowSeparator: function(semesterName) {
		return semesterName.length;
	}
});
