/*
`d2l-all-courses-segregated-content`
Polymer-based web component for the all courses content.

This is only used if the `US90527-my-courses-updates` LD flag is OFF
(meaning the `updated-sort-logic` attribute was not added to the `d2l-my-courses` component).

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-alert/d2l-alert.js';
import '../d2l-alert-behavior.js';
import '../d2l-all-courses-styles.js';
import './d2l-course-tile-grid.js';
import './d2l-course-tile-responsive-grid-behavior.js';
import '../localize-behavior.js';
import '../d2l-utility-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-all-courses-segregated-content">
	<template strip-whitespace="">
		<style include="d2l-all-courses-styles"></style>

		<h2>[[localize('pinnedCourses')]]</h2>
		<span hidden$="[[!_noPinnedCoursesInSearch]]">
			[[localize('noPinnedCoursesInSearch')]]
		</span>
		<span hidden$="[[!_noPinnedCoursesInSelection]]">
			[[localize('noPinnedCoursesInSelection')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noPinnedCoursesInDepartment]]">
			[[localize('noPinnedCoursesInDepartment')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noPinnedCoursesInSemester]]">
			[[localize('noPinnedCoursesInSemester')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noPinnedCoursesInRole]]">
			[[localize('noPinnedCoursesInRole')]]
		</span>

		<d2l-course-tile-grid id="all-courses-segregated-pinned-tile-grid"
			enrollments="[[filteredPinnedEnrollments]]"
			enrollments-to-animate="[[_pinnedEnrollmentsToAnimate]]"
			tile-sizes="[[_tileSizes]]"
			locale="[[locale]]"
			show-course-code="[[showCourseCode]]"
			show-semester="[[showSemester]]"
			course-updates-config="[[courseUpdatesConfig]]">
		</d2l-course-tile-grid>

		<h2>[[localize('unpinnedCourses')]]</h2>

		<span class="bottom-pad" hidden$="[[!_noUnpinnedCoursesInSearch]]">
			[[localize('noUnpinnedCoursesInSearch')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noUnpinnedCoursesInSelection]]">
			[[localize('noUnpinnedCoursesInSelection')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noUnpinnedCourses]]">
			[[localize('noUnpinnedCoursesMessage')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noUnpinnedCoursesInDepartment]]">
			[[localize('noUnpinnedCoursesInDepartment')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noUnpinnedCoursesInSemester]]">
			[[localize('noUnpinnedCoursesInSemester')]]
		</span>
		<span class="bottom-pad" hidden$="[[!_noUnpinnedCoursesInRole]]">
			[[localize('noUnpinnedCoursesInRole')]]
		</span>

		<d2l-course-tile-grid id="all-courses-segregated-unpinned-tile-grid"
			enrollments="[[filteredUnpinnedEnrollments]]"
			enrollments-to-animate="[[_unpinnedEnrollmentsToAnimate]]"
			tile-sizes="[[_tileSizes]]"
			locale="[[locale]]"
			show-course-code="[[showCourseCode]]"
			show-semester="[[showSemester]]"
			course-updates-config="[[courseUpdatesConfig]]">
		</d2l-course-tile-grid>
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-all-courses-segregated-content',
	properties: {
		showCourseCode: Boolean,
		showSemester: Boolean,
		courseUpdatesConfig: Object,
		totalFilterCount: Number,
		filterCounts: Object,
		isSearched: Boolean,
		filteredPinnedEnrollments: Array,
		filteredUnpinnedEnrollments: Array,

		_noPinnedCoursesInSearch: Boolean,
		_noPinnedCoursesInSelection: Boolean,
		_noUnpinnedCoursesInSearch: Boolean,
		_noUnpinnedCoursesInSelection: Boolean,
		_noUnpinnedCourses: Boolean,
		_noPinnedCoursesInDepartment: Boolean,
		_noPinnedCoursesInSemester: Boolean,
		_noPinnedCoursesInRole: Boolean,
		_noUnpinnedCoursesInDepartment: Boolean,
		_noUnpinnedCoursesInSemester: Boolean,
		_noUnpinnedCoursesInRole: Boolean,
		_pinnedEnrollmentsToAnimate: {
			type: Array,
			value: function() { return []; }
		},
		_tileSizes: Object,
		_unpinnedEnrollmentsToAnimate: {
			type: Array,
			value: function() { return []; }
		},
		_hasFilteredPinnedEnrollments: {
			type: Boolean,
			value: false,
			computed: '_computeHasFilteredPinnedEnrollments(filteredPinnedEnrollments.length)'
		},
		_hasFilteredUnpinnedEnrollments: {
			type: Boolean,
			value: false,
			computed: '_computeHasFilteredUnpinnedEnrollments(filteredUnpinnedEnrollments.length)'
		},
		_itemCount: {
			type: Number,
			value: 0
		}
	},
	behaviors: [
		D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
		D2L.MyCourses.AlertBehavior,
		D2L.MyCourses.CourseTileResponsiveGridBehavior,
		D2L.MyCourses.UtilityBehavior
	],
	listeners: {
		'tile-remove-complete': '_onTileRemoveComplete'
	},
	observers: [
		'_updateEnrollmentAlerts(_hasFilteredPinnedEnrollments, _hasFilteredUnpinnedEnrollments)'
	],

	ready: function() {
		// Both course tile grids in this view should have the same number of columns, so use a custom getter
		var courseTileGrids = dom(this.root).querySelectorAll('d2l-course-tile-grid');
		for (var i = 0; i < courseTileGrids.length; i++) {
			courseTileGrids[i].getCourseTileItemCount = this.getCourseTileItemCount.bind(this);
		}
		this._updateTileSizes();
		this._updateEnrollmentAlerts(this._hasFilteredPinnedEnrollments, this._hasFilteredUnpinnedEnrollments);
	},
	attached: function() {
		window.addEventListener('resize', this._updateTileSizes.bind(this));
	},

	getCourseTileItemCount: function() {
		return this._itemCount;
	},

	_onTileRemoveComplete: function(e) {
		if (e.detail.pinned) {
			this._moveEnrollmentToPinnedList(e.detail.enrollment);
		} else {
			this._moveEnrollmentToUnpinnedList(e.detail.enrollment);
		}
	},
	_computeHasFilteredPinnedEnrollments: function(filteredPinnedEnrollmentsLength) {
		return filteredPinnedEnrollmentsLength > 0;
	},
	_computeHasFilteredUnpinnedEnrollments: function(filteredUnpinnedEnrollmentsLength) {
		return filteredUnpinnedEnrollmentsLength > 0;
	},
	_updateTileSizes: function() {
		this._rescaleCourseTileRegions();
		this._tileSizes = Math.floor(100 / this._numColsOverlay) + 'vw';
	},
	_moveEnrollmentToPinnedList: function(enrollment) {
		// Remove enrollment from unpinned list, add to pinned
		var enrollmentId = this.getEntityIdentifier(enrollment);

		for (var index = 0; index < this.filteredUnpinnedEnrollments.length; index++) {
			var pinnedEnrollmentId = this.getEntityIdentifier(this.filteredUnpinnedEnrollments[index]);
			if (pinnedEnrollmentId === enrollmentId) {
				var foundEnrollment = this.filteredUnpinnedEnrollments[index];
				this._setEnrollmentPinData(foundEnrollment, true);
				this._pinnedEnrollmentsToAnimate.push(enrollmentId);
				this.unshift('filteredPinnedEnrollments', foundEnrollment);
				this.splice('filteredUnpinnedEnrollments', index, 1);
				break;
			}
		}
	},
	_moveEnrollmentToUnpinnedList: function(enrollment) {
		// Remove enrollment from pinned list, add to unpinned
		var enrollmentId = this.getEntityIdentifier(enrollment);

		for (var index = 0; index < this.filteredPinnedEnrollments.length; index++) {
			var unpinnedEnrollmentId = this.getEntityIdentifier(this.filteredPinnedEnrollments[index]);
			if (unpinnedEnrollmentId === enrollmentId) {
				var foundEnrollment = this.filteredPinnedEnrollments[index];
				this._setEnrollmentPinData(foundEnrollment, false);
				this._unpinnedEnrollmentsToAnimate.push(enrollmentId);
				this.unshift('filteredUnpinnedEnrollments', foundEnrollment);
				this.splice('filteredPinnedEnrollments', index, 1);
				break;
			}
		}
	},
	_setEnrollmentPinData: function(entity, isPinned) {
		// HACK: Because the course tiles are being removed and re-created in the DOM, we have to effectively
		// manually update them, rather than updating them with the received enrollment from the API call.
		if (isPinned) {
			entity.class.splice(entity.class.indexOf('unpinned'));
			entity.class.push('pinned');
			entity.actions[0].name = 'unpin-course';
			entity.actions[0].fields[0].value = false;
			entity._actionsByName['unpin-course'] = entity.actions[0];
		} else {
			entity.class.splice(entity.class.indexOf('pinned'));
			entity.class.push('unpinned');
			entity.actions[0].name = 'pin-course';
			entity.actions[0].fields[0].value = true;
			entity._actionsByName['pin-course'] = entity.actions[0];
		}
	},
	_updateEnrollmentAlerts: function(hasPinnedEnrollments, hasUnpinnedEnrollments) {
		this._noPinnedCoursesInSearch = false;
		this._noPinnedCoursesInSelection = false;
		this._noUnpinnedCoursesInSearch = false;
		this._noUnpinnedCoursesInSelection = false;
		this._noUnpinnedCourses = false;
		this._noPinnedCoursesInDepartment = false;
		this._noPinnedCoursesInSemester = false;
		this._noPinnedCoursesInRole = false;
		this._noUnpinnedCoursesInDepartment = false;
		this._noUnpinnedCoursesInSemester = false;
		this._noUnpinnedCoursesInRole = false;
		var hasAlert = this._hasAlert('noPinnedCourses'),
			isFiltered = this.totalFilterCount > 0;
		this._clearAlerts();
		if (!hasPinnedEnrollments) {
			if (!hasAlert && this.isSearched) {
				this._noPinnedCoursesInSearch = true;
			} else if (!hasAlert && isFiltered) {
				if (this.totalFilterCount === 1) {
					if (this.filterCounts.departments === 1) {
						this._noPinnedCoursesInDepartment = true;
					} else if (this.filterCounts.semesters === 1) {
						this._noPinnedCoursesInSemester = true;
					} else if (this.filterCounts.roles === 1) {
						this._noPinnedCoursesInRole = true;
					}
				} else {
					this._noPinnedCoursesInSelection = true;
				}
			}
			else {
				this._addAlert('call-to-action', 'noPinnedCourses', this.localize('noPinnedCoursesMessage'));
			}
		}
		if (!hasUnpinnedEnrollments && this.isSearched) {
			this._noUnpinnedCoursesInSearch = true;
		} else if (!hasUnpinnedEnrollments && isFiltered) {
			if (this.totalFilterCount === 1) {
				if (this.filterCounts.departments === 1) {
					this._noUnpinnedCoursesInDepartment = true;
				} else if (this.filterCounts.semesters === 1) {
					this._noUnpinnedCoursesInSemester = true;
				} else if (this.filterCounts.roles === 1) {
					this._noUnpinnedCoursesInRole = true;
				}
			} else {
				this._noUnpinnedCoursesInSelection = true;
			}
		}
		if (!hasUnpinnedEnrollments && !this.isSearched && !isFiltered) {
			this._noUnpinnedCourses = true;
		}

		if ((hasPinnedEnrollments || hasUnpinnedEnrollments) && !isFiltered && !this.isSearched) {
			this._itemCount = Math.max(this.filteredPinnedEnrollments ? this.filteredPinnedEnrollments.length : 0,
				this.filteredUnpinnedEnrollments ? this.filteredUnpinnedEnrollments.length : 0);
		}
	}
});
