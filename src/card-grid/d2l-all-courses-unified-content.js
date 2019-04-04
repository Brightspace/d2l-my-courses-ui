/*
`d2l-all-courses-unified-content`
Polymer-based web component for the all courses content.

This is only used if the `US90527-my-courses-updates` LD flag is ON
(meaning the `updated-sort-logic` attribute was added to the `d2l-my-courses` component).

*/
import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import './d2l-card-grid-behavior.js';
import './d2l-card-grid-styles.js';
import '../d2l-all-courses-styles.js';
import '../localize-behavior.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class D2LAllCoursesUnifiedContent extends mixinBehaviors([D2L.PolymerBehaviors.MyCourses.LocalizeBehavior, D2L.MyCourses.CardGridBehavior], PolymerElement) {
	static get template() {
		return html`<style include="d2l-all-courses-styles"></style>
		<style include="d2l-card-grid-styles"></style>

		<span class="bottom-pad" hidden$="[[!_noCoursesInSearch]]">
			[[localize('noCoursesInSearch')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noCoursesInSelection]]">
			[[localize('noCoursesInSelection')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noCoursesInDepartment]]">
			[[localize('noCoursesInDepartment')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noCoursesInSemester]]">
			[[localize('noCoursesInSemester')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noCoursesInRole]]">
			[[localize('noCoursesInRole')]]
		</span>`;
	}
	static get is() { return 'd2l-all-courses-unified-content'; }
	static get properties() {
		return {
			totalFilterCount: Number,
			filterCounts: Object,
			isSearched: Boolean,
			filteredEnrollments: Array,
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

			_noCoursesInSearch: Boolean,
			_noCoursesInSelection: Boolean,
			_noCoursesInDepartment: Boolean,
			_noCoursesInSemester: Boolean,
			_noCoursesInRole: Boolean,
			_itemCount: {
				type: Number,
				value: 0
			}
		};
	}
	static get observers() {
		return [
			'_enrollmentsChanged(filteredEnrollments.length)'
		];
	}

	attached() {
		afterNextRender(this, function() {
			this._onResize();
		}.bind(this));
	}

	_enrollmentsChanged(enrollmentLength) {
		this._noCoursesInSearch = false;
		this._noCoursesInSelection = false;
		this._noCoursesInDepartment = false;
		this._noCoursesInSemester = false;
		this._noCoursesInRole = false;
		if (enrollmentLength === 0) {
			if (this.isSearched) {
				this._noCoursesInSearch = true;
			} else if (this.totalFilterCount === 1) {
				if (this.filterCounts.departments === 1) {
					this._noCoursesInDepartment = true;
				} else if (this.filterCounts.semesters === 1) {
					this._noCoursesInSemester = true;
				} else if (this.filterCounts.roles === 1) {
					this._noCoursesInRole = true;
				}
			} else if (this.totalFilterCount > 1) {
				this._noCoursesInSelection = true;
			}
		} else {
			if (!this.isSearched && this.totalFilterCount === 0) {
				this._itemCount = enrollmentLength;
			}
		}
	}
}

window.customElements.define(D2LAllCoursesUnifiedContent.is, D2LAllCoursesUnifiedContent);
