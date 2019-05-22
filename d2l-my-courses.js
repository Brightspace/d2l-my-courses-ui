/*
`d2l-my-courses`
Polymer-based web component for the my-courses widget that appears on the LE homepage.

If the `d2l.Tools.MyCoursesWidget.UpdatedSortLogic` config variable is on, the `updated-sort-logic` attribute is added and the `d2l-my-courses-container` component is rendered.
If it is off and the attribute is not added, the `d2l-my-courses-legacy` component is rendered.

*/
import '@polymer/polymer/polymer-legacy.js';

import './src/d2l-my-courses-container.js';
import './legacy/d2l-my-courses-legacy.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-my-courses">
	<template strip-whitespace="">
		<template is="dom-if" if="[[!updatedSortLogic]]">
			<d2l-my-courses-legacy
				enrollments-url="[[enrollmentsUrl]]"
				advanced-search-url="[[advancedSearchUrl]]"
				standard-semester-name="[[standardSemesterName]]"
				standard-department-name="[[standardDepartmentName]]"
				show-course-code="[[showCourseCode]]"
				course-updates-config="[[courseUpdatesConfig]]"
				image-catalog-location="[[imageCatalogLocation]]"
				promoted-searches="[[promotedSearches]]"
				user-settings-url="[[userSettingsUrl]]"
				show-semester="[[showSemester]]"
				org-unit-type-ids="[[orgUnitTypeIds]]"
				updated-sort-logic="[[updatedSortLogic]]"
				course-image-upload-cb="[[courseImageUploadCb]]"
				token="[[token]]">
			</d2l-my-courses-legacy>
		</template>
		<template is="dom-if" if="[[updatedSortLogic]]">
			<d2l-my-courses-container
				enrollments-url="[[enrollmentsUrl]]"
				advanced-search-url="[[advancedSearchUrl]]"
				standard-semester-name="[[standardSemesterName]]"
				standard-department-name="[[standardDepartmentName]]"
				show-course-code="[[showCourseCode]]"
				course-updates-config="[[courseUpdatesConfig]]"
				image-catalog-location="[[imageCatalogLocation]]"
				promoted-searches="[[promotedSearches]]"
				user-settings-url="[[userSettingsUrl]]"
				show-semester="[[showSemester]]"
				org-unit-type-ids="[[orgUnitTypeIds]]"
				updated-sort-logic="[[updatedSortLogic]]"
				course-image-upload-cb="[[courseImageUploadCb]]"
				token="[[token]]">
			</d2l-my-courses-container>
		</template>
	</template>

</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-my-courses',
	properties: {
		// URL that directs to the advanced search page
		advancedSearchUrl: String,
		// URL that is called by the widget to fetch enrollments
		enrollmentsUrl: String,
		// URL that is called by the widget to fetch results from the course image catalog
		imageCatalogLocation: String,
		// Configuration value passed in to toggle course code -- passed to animation tile
		showCourseCode: Boolean,
		// Configuration value passed in to toggle Learning Paths code
		orgUnitTypeIds: String,
		// Configuration value passed in to toggle semester on course tile -- passed to animation tile
		showSemester: Boolean,
		// Standard Semester OU Type name to be displayed in the all-courses filter dropdown
		standardDepartmentName: String,
		// Standard Department OU Type name to be displayed in the all-courses filter dropdown
		standardSemesterName: String,
		// Types of notifications to include in update count in course tile -- passed to animation tile
		courseUpdatesConfig: Object,
		// Callback for upload in image-selector
		courseImageUploadCb: Function,
		// URL to fetch promoted searches for tabs
		promotedSearches: String,
		// URL to fetch a user's settings (e.g. default tab to select)
		userSettingsUrl: String,
		// Feature flag (switch) for using the updated sort logic and related fetaures
		updatedSortLogic: {
			type: Boolean,
			value: false
		},
		token: String
	},

	courseImageUploadCompleted: function(success) {
		return this.updatedSortLogic
			? this.$$('d2l-my-courses-container').courseImageUploadCompleted(success)
			: this.$$('d2l-my-courses-legacy').courseImageUploadCompleted(success);
	},
	getLastOrgUnitId: function() {
		return this.updatedSortLogic
			? this.$$('d2l-my-courses-container').getLastOrgUnitId()
			: this.$$('d2l-my-courses-legacy').getLastOrgUnitId();
	}

});
