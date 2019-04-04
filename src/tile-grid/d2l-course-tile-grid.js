/*
`d2l-course-tile-grid`
Polymer-based web component for the course tile grid.

This is used in `d2l-my-courses-content` (when the `us90524-my-courses-css-grid-layout` LD flag is off) and in `d2l-all-courses`.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import './d2l-course-tile.js';
import './d2l-course-tile-responsive-grid-behavior.js';
import './d2l-course-tile-sliding-grid-behavior.js';
import '../localize-behavior.js';
import './d2l-course-tile-grid-styles.js';
import '../d2l-utility-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-course-tile-grid">
	<template strip-whitespace="">
		<style include="d2l-course-tile-grid-styles"></style>

		<div class="course-tile-container grid-container">
			<template id="enrollmentsTemplate" is="dom-repeat" items="[[enrollments]]">
				<div class="course-tile-item-container" id="[[getEntityIdentifier(item)]]">
					<d2l-course-tile
						enrollment="[[item]]"
						animate-insertion="[[_grid_shouldAnimateEnrollmentInsertion(item)]]"
						class="grid-child"
						enrollment-id="[[getEntityIdentifier(item)]]"
						tile-sizes="[[tileSizes]]"
						locale="[[locale]]"
						show-course-code="[[showCourseCode]]"
						show-semester="[[showSemester]]"
						course-updates-config="[[courseUpdatesConfig]]"
						animate="[[animate]]"
						token="[[token]]">
					</d2l-course-tile>
				</div>
			</template>
		</div>
	</template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-course-tile-grid',

	properties: {
		// Set of enrollment Entities for which to display course tiles
		enrollments: {
			type: Array,
			notify: true,
			value: function() { return []; }
		},
		animate: {
			type: Boolean,
			value: true
		},
		// Set of enrollments which should be animated when being inserted
		enrollmentsToAnimate: {
			type: Array,
			value: function() { return []; }
		},
		// Size the tile should render with respect to vw
		tileSizes: {
			type: Object,
			value: function() { return {}; }
		},
		locale: String,
		// Types of notifications to include in update count in course tile
		courseUpdatesConfig: {
			type: Object,
			value: function() { return {}; }
		},
		// Set to true if course code should be shown in course tiles
		showCourseCode: Boolean,
		// Set to true if semester should be shown in course tiles
		showSemester: Boolean
	},
	behaviors: [
		D2L.MyCourses.CourseTileSlidingGridBehavior,
		D2L.MyCourses.CourseTileResponsiveGridBehavior,
		D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
		D2L.MyCourses.UtilityBehavior
	],
	listeners: {
		'enrollment-pinned': '_onEnrollmentPinAction',
		'enrollment-unpinned': '_onEnrollmentPinAction'
	},
	attached: function() {
		document.body.addEventListener('set-course-image', this._onSetCourseImage.bind(this));
	},
	detached: function() {
		document.body.removeEventListener('set-course-image', this._onSetCourseImage.bind(this));
	},
	getCourseTileItemCount: function() {
		return this.enrollments.length;
	},
	_onSetCourseImage: function(e) {
		var organization = e && e.detail && e.detail.organization;

		if (!organization || !organization.properties) {
			return; // input didn't have a provided organization
		}

		var courseTiles = this.$$('.course-tile-container').querySelectorAll('d2l-course-tile');
		var selectedTileArray = [].filter.call(courseTiles, function(tile) {
			if (! tile._organization || !tile._organization.properties) {
				return false;
			}
			return this.getEntityIdentifier(tile._organization) === this.getEntityIdentifier(organization);
		}.bind(this));

		if (selectedTileArray.length !== 0) {
			// There should only ever be one instance of the same course tile in a tile grid
			var selectedTile = selectedTileArray[0];
			selectedTile.setCourseImage(e.detail.image, e.detail.status);
		}
	},
	focus: function(organization) {
		var ct = this._getCourseTileForOrg(organization);

		if (ct) {
			ct.focus();
		}
	},
	refreshCourseTileImage: function(organization) {
		var ct = this._getCourseTileForOrg(organization);

		if (ct) {
			ct.refreshImage();
		}
	},
	_getCourseTileForOrg: function(organization) {
		var courseTiles = dom(this.root).querySelectorAll('d2l-course-tile'),
			courseTileOrg,
			x;

		for (x = 0; x < courseTiles.length; x++) {
			courseTileOrg = courseTiles[x]._organization;
			if (
				courseTileOrg && courseTileOrg.properties &&
				organization && organization.properties &&
				this.getEntityIdentifier(courseTileOrg) === this.getEntityIdentifier(organization)
			) {
				return courseTiles[x];
			}
		}
	},
	_grid_shouldAnimateEnrollmentInsertion: function gridShouldAnimateEnrollmentInsertion(enrollment) {
		if (!this.enrollmentsToAnimate) {
			return false;
		}

		var index = this.enrollmentsToAnimate.indexOf(this.getEntityIdentifier(enrollment));
		if (index !== -1) {
			this.enrollmentsToAnimate.splice(index, 1);
			return true;
		}

		return false;
	},
	_onEnrollmentPinAction: function(e) {
		var modifiedEnrollmentId = this.getEntityIdentifier(e.detail.enrollment);

		// When a tile is pinned/unpinned, set focus to the next (or previous, if last) course tile
		var courseTiles = dom(this.root).querySelectorAll('d2l-course-tile');
		for (var i = 0; i < courseTiles.length; i++) {
			var enrollmentId = this.getEntityIdentifier(courseTiles[i].enrollment);
			if (enrollmentId === modifiedEnrollmentId) {
				if (i < courseTiles.length - 1) {
					courseTiles[i + 1].focus();
				} else if (i > 0) {
					courseTiles[i - 1].focus();
				}
				break;
			}
		}
	},
	checkForStartedInactive: function(removed) {
		var courseTiles = this.$$('.course-tile-container').querySelectorAll('d2l-course-tile');
		// When this runs, the removed tile won't be gone yet, so we have to check for an additional tile
		var searchAmount = removed ? 2 : 1;

		for (var i = 0; i < courseTiles.length; i++) {
			if (courseTiles[i].isStartedInactive && --searchAmount === 0) {
				return true;
			}
		}

		return false;
	},

	_getGridColumnCount: function() {
		return this._numCols;
	},
	_getGridContainerElement: function() {
		return this.$$('.course-tile-container');
	},
	_getGridTileElementIds: function() {
		return Array.from(this._getGridContainerElement().querySelectorAll('.course-tile-item-container')).map(function(tile) {
			return tile.id;
		});
	},
	_getGridTileRepeat: function() {
		return this.$.enrollmentsTemplate;
	}
});
