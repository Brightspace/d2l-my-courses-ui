/*
`d2l-my-courses-content`
Polymer-based web component for the my-courses content.

This is only used if the `d2l.Tools.MyCoursesWidget.UpdatedSortLogic` config variable is on
(meaning the `updated-sort-logic` attribute was added to the `d2l-my-courses` component).

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/iron-scroll-threshold/iron-scroll-threshold.js';
import 'd2l-alert/d2l-alert.js';
import 'd2l-enrollments/components/d2l-enrollment-card/d2l-enrollment-card.js';
import 'd2l-link/d2l-link.js';
import 'd2l-loading-spinner/d2l-loading-spinner.js';
import 'd2l-simple-overlay/d2l-simple-overlay.js';
import 'd2l-image-selector/d2l-basic-image-selector.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import '../d2l-all-courses.js';
import './d2l-card-grid-styles.js';
import '../d2l-my-courses-content-behavior.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { EntityMixin } from 'siren-sdk/src/mixin/entity-mixin.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { DateTextAndStatusMixin } from 'd2l-enrollments/components/date-text-status-mixin.js';

/**
 * @customElement
 * @polymer
 */
class MyCoursesContent extends mixinBehaviors([
	D2L.MyCourses.MyCoursesContentBehavior,
	D2L.MyCourses.CardGridBehavior
], DateTextAndStatusMixin(EntityMixin(PolymerElement))) {
	constructor() {
		super();
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

	static get is() { return 'd2l-my-courses-content'; }

}

window.customElements.define(MyCoursesContent.is, MyCoursesContent);

