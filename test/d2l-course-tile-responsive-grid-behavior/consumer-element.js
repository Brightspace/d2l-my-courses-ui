import '../../src/d2l-course-tile-responsive-grid-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
		<div class="course-tile-container"></div>
`,

  is: 'consumer-element',

  behaviors: [
	  D2L.MyCourses.CourseTileResponsiveGridBehavior
  ]
});
