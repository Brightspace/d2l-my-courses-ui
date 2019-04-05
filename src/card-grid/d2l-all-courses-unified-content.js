/*
`d2l-all-courses-unified-content`
Polymer-based web component for the all courses content.

This is only used if the `US90527-my-courses-updates` LD flag is ON
(meaning the `updated-sort-logic` attribute was added to the `d2l-my-courses` component).

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-enrollments/components/d2l-enrollment-card/d2l-enrollment-card.js';
import './d2l-card-grid-behavior.js';
import './d2l-card-grid-styles.js';
import '../d2l-all-courses-styles.js';
import '../localize-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-all-courses-unified-content">
	<template strip-whitespace="">
		<style include="d2l-all-courses-styles"></style>
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
		</span>

		<div class="course-card-grid">
		</div>
	</template>

</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-all-courses-unified-content',
	properties: {
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
	},
	behaviors: [
		D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
		D2L.MyCourses.CardGridBehavior
	],
	observers: [
		'_enrollmentsChanged(filteredEnrollments.length)'
	],

	attached: function() {
		afterNextRender(this, function() {
			this._onResize();
		}.bind(this));
	},

	_enrollmentsChanged: function(enrollmentLength) {
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
});
