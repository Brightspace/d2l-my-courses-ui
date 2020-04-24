/*
`d2l-my-courses`
Polymer-based web component for the my-courses widget that appears on the LE homepage.

If the `d2l.Tools.MyCoursesWidget.UpdatedSortLogic` config variable is on, the `updated-sort-logic` attribute is added and the `src/d2l-my-courses-container` component is rendered.
If it is off and the attribute is not added, the `legacy/d2l-my-courses-legacy` component is rendered.

*/

import './src/d2l-my-courses-container.js';
import './legacy/d2l-my-courses-legacy.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';

class MyCourses extends PolymerElement {

	static get is() { return 'd2l-my-courses'; }

	static get properties() {
		return {
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
			// Token JWT Token for brightspace | a function that returns a JWT token for brightspace
			token: String
		};
	}

	static get template() {
		return html`
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
					image-catalog-location="[[imageCatalogLocation]]"
					promoted-searches="[[promotedSearches]]"
					user-settings-url="[[userSettingsUrl]]"
					org-unit-type-ids="[[orgUnitTypeIds]]"
					course-image-upload-cb="[[courseImageUploadCb]]"
					token="[[token]]">
				</d2l-my-courses-container>
			</template>`;
	}

	courseImageUploadCompleted(success) {
		return this.updatedSortLogic
			? this.shadowRoot.querySelector('d2l-my-courses-container').courseImageUploadCompleted(success)
			: this.shadowRoot.querySelector('d2l-my-courses-legacy').courseImageUploadCompleted(success);
	}
	getLastOrgUnitId() {
		return this.updatedSortLogic
			? this.shadowRoot.querySelector('d2l-my-courses-container').getLastOrgUnitId()
			: this.shadowRoot.querySelector('d2l-my-courses-legacy').getLastOrgUnitId();
	}
}

window.customElements.define(MyCourses.is, MyCourses);
