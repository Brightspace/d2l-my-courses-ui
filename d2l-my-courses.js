/*
`d2l-my-courses`
Polymer-based web component for the my-courses widget that appears on the LE homepage.

If the `US90527-my-courses-updates` LD flag is on, the `updated-sort-logic` attribute is added and the `d2l-my-courses-content` component is rendered.
If it is off and the attribute is not added, the `d2l-my-courses-content-animated` component is rendered.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-tabs/d2l-tabs.js';
import './src/card-grid/d2l-my-courses-content.js';
import './src/tile-grid/d2l-my-courses-content-animated.js';
import './src/d2l-my-courses-behavior.js';
import './src/d2l-utility-behavior.js';
import './src/localize-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-my-courses">
	<template strip-whitespace="">
		<template is="dom-if" if="[[!updatedSortLogic]]">
			<d2l-my-courses-content-animated
				advanced-search-url="[[advancedSearchUrl]]"
				enrollments-search-action="[[_enrollmentsSearchAction]]"
				image-catalog-location="[[imageCatalogLocation]]"
				show-course-code="[[showCourseCode]]"
				show-semester="[[showSemester]]"
				standard-department-name="[[standardDepartmentName]]"
				standard-semester-name="[[standardSemesterName]]"
				course-updates-config="[[courseUpdatesConfig]]"
				course-image-upload-cb="[[courseImageUploadCb]]">
			</d2l-my-courses-content-animated>
		</template>
		<template is="dom-if" if="[[updatedSortLogic]]">
			<template is="dom-if" if="[[_showGroupByTabs]]">
				<d2l-tabs>
					<template items="[[_tabSearchActions]]" is="dom-repeat">
						<!-- item.name is an OrgUnitId, and querySelector does not work with components with ids that start with a number -->
						<d2l-tab-panel id="panel-[[item.name]]" text="[[item.title]]" selected="[[item.selected]]">
							<d2l-my-courses-content
								token="[[token]]"
								advanced-search-url="[[advancedSearchUrl]]"
								course-image-upload-cb="[[courseImageUploadCb]]"
								enrollments-search-action="[[item.enrollmentsSearchAction]]"
								image-catalog-location="[[imageCatalogLocation]]"
								presentation-url="[[presentationUrl]]"
								standard-department-name="[[standardDepartmentName]]"
								standard-semester-name="[[standardSemesterName]]"
								tab-search-actions="[[_tabSearchActions]]"
								tab-search-type="[[_tabSearchType]]"
								user-settings-url="[[userSettingsUrl]]"
								changed-course-enrollment="[[_changedCourseEnrollment]]">
							</d2l-my-courses-content>
						</d2l-tab-panel>
					</template>
				</d2l-tabs>
			</template>
			<template is="dom-if" if="[[!_showGroupByTabs]]">
				<d2l-my-courses-content
					token="[[token]]"
					advanced-search-url="[[advancedSearchUrl]]"
					course-image-upload-cb="[[courseImageUploadCb]]"
					enrollments-search-action="[[_enrollmentsSearchAction]]"
					image-catalog-location="[[imageCatalogLocation]]"
					presentation-url="[[presentationUrl]]"
					standard-department-name="[[standardDepartmentName]]"
					standard-semester-name="[[standardSemesterName]]">
				</d2l-my-courses-content>
			</template>
		</template>
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-my-courses',
	behaviors: [
		D2L.MyCourses.MyCoursesBehavior
	]
});
