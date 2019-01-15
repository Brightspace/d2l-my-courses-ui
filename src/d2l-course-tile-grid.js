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
import './localize-behavior.js';
import './d2l-interaction-detection-behavior.js';
import './d2l-course-tile-grid-styles.js';
import './d2l-touch-menu.js';
import './d2l-touch-menu-item.js';
import './d2l-utility-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-course-tile-grid">
	<template strip-whitespace="">
		<style include="d2l-course-tile-grid-styles"></style>

		<div class="course-tile-container grid-container">
			<template id="enrollmentsTemplate" is="dom-repeat" items="[[enrollments]]">
				<d2l-course-tile enrollment="[[item]]" hover-enabled="[[_hoverInteractionEnabled]]" animate-insertion="[[_grid_shouldAnimateEnrollmentInsertion(item)]]" class="grid-child" enrollment-id="[[getEntityIdentifier(item)]]" tile-sizes="[[tileSizes]]" locale="[[locale]]" show-course-code="[[showCourseCode]]" show-semester="[[showSemester]]" course-updates-config="[[courseUpdatesConfig]]" animate="[[animate]]">
				</d2l-course-tile>
			</template>
		</div>

		<d2l-touch-menu enabled="[[_touchInteractionEnabled]]">
			<d2l-touch-menu-item text="{{localize('pin')}}" background-image="d2l-tier1:pin-filled" hover-event="touch-pin-hover" selection-event="touch-pin-select">
			</d2l-touch-menu-item>
		</d2l-touch-menu>
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
		D2L.MyCourses.InteractionDetectionBehavior,
		D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
		D2L.MyCourses.UtilityBehavior
	],
	listeners: {
		'enrollment-pinned': '_onEnrollmentPinAction',
		'enrollment-unpinned': '_onEnrollmentPinAction',
		'touch-pin-hover': '_onUnpinHover',
		'touch-pin-select': '_onTouchPinSelect',
		'touch-menu-open': '_onTouchMenuOpen',
		'touch-menu-close': '_onTouchMenuClose',
		'dom-change': '_onCourseTilesChanged'
	},
	getCourseTileItemCount: function() {
		return this.enrollments.length;
	},
	setCourseImage: function(detail) {
		if (!detail) {
			return;
		}

		var container = this.$$('.course-tile-container'),
			courseTiles = container.querySelectorAll('d2l-course-tile'),
			organization = (detail.detail || {}).organization;

		if (!organization || !organization.properties) {
			return; // input didn't have a provided organization
		}

		// find isn't compatible with IE
		var selectedTileArray = [].filter.call(courseTiles, function(tile) {
			if (! tile._organization || !tile._organization.properties) {
				return false;
			}
			return this.getEntityIdentifier(tile._organization) === this.getEntityIdentifier(organization);
		}.bind(this));

		if (selectedTileArray.length !== 0) {
			// There should only ever be one instance of the same course tile in a tile grid
			var selectedTile = selectedTileArray[0];
			selectedTile.setCourseImage(detail.detail);
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
	_onCourseTilesChanged: function() {
		var courseTiles = dom(this.root).querySelectorAll('d2l-course-tile');
		this.$$('d2l-touch-menu').touchTargets = Array.prototype.slice.call(courseTiles);
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
	_onTouchPinSelect: function(e) {
		e.detail.element.pinClickHandler(true);
	},
	_onTouchMenuOpen: function(e) {
		e.detail.element.setTouchMenuOpen(true);
	},
	_onTouchMenuClose: function(e) {
		e.detail.element.setTouchMenuOpen(false);
	},
	_onUnpinHover: function(e) {
		var pinTouchMenuItem = this.$$('d2l-touch-menu-item');
		var courseTile = e.detail.element;

		// Get pin state of element and update touch menu
		if (courseTile.pinned) {
			dom(pinTouchMenuItem).setAttribute('text', this.localize('unpin'));
			dom(pinTouchMenuItem).setAttribute('background-image', 'd2l-tier1:pin-hollow');
			dom(pinTouchMenuItem).setAttribute('action-description', this.localize('unpinCourse', 'course', courseTile._organization.properties.name));
		} else {
			dom(pinTouchMenuItem).setAttribute('text', this.localize('pin'));
			dom(pinTouchMenuItem).setAttribute('background-image', 'd2l-tier1:pin-filled');
			dom(pinTouchMenuItem).setAttribute('action-description', this.localize('pinCourse', 'course', courseTile._organization.properties.name));
		}

		e.detail.element._onUnpinHover(e);
	},
	checkForStartedInactive: function(type) {
		var courseTiles = this.$$('.course-tile-container').querySelectorAll('d2l-course-tile');
		// When this runs, the removed tile won't be gone yet, so we have to check for an additional tile
		var searchAmount = type === 'remove' ? 2 : 1;

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
	_getGridTileElements: function() {
		return this._getGridContainerElement().querySelectorAll('d2l-course-tile');
	},
	_getGridTileRepeat: function() {
		return this.$.enrollmentsTemplate;
	}
});
