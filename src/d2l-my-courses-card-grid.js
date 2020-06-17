/*
`d2l-my-courses-card-grid`
Polymer-based web component for the grid of enrollment cards.
*/

import 'd2l-enrollments/components/d2l-enrollment-card/d2l-enrollment-card.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { entityFactory } from 'siren-sdk/src/es6/EntityFactory.js';
import { PresentationEntity } from 'siren-sdk/src/presentation/PresentationEntity.js';

class MyCoursesCardGrid extends PolymerElement {

	static get is() { return 'd2l-my-courses-card-grid'; }

	static get properties() {
		return {
			// Array of courses to show
			filteredEnrollments: Array,
			// If true, will hide courses that are "closed" (only needed if a closed course was just unpinned,
			// since we remove closed courses from the filteredEnrollments array on load)
			hidePastCourses: {
				type: Boolean,
				value: false,
				reflectToAttribute: true
			},
			// Token JWT Token for brightspace | a function that returns a JWT token for brightspace
			token: String,
			// URL to fetch widget settings
			presentationUrl: String,
			// Limit the number of cards shown to 12 (unless more than 12 are pinned)
			widgetView: {
				type: Boolean,
				value: false,
				reflectToAttribute: true
			},
			/*
			* Presentation Attributes
			*/
			_hideCourseStartDate: {
				type: Boolean,
				value: false
			},
			_hideCourseEndDate: {
				type: Boolean,
				value: false
			},
			_showOrganizationCode: {
				type: Boolean,
				value: false
			},
			_showSemesterName: {
				type: Boolean,
				value: false
			},
			_showDropboxUnreadFeedback: {
				type: Boolean,
				value: false
			},
			_showUnattemptedQuizzes: {
				type: Boolean,
				value: false
			},
			_showUngradedQuizAttempts: {
				type: Boolean,
				value: false
			},
			_showUnreadDiscussionMessages: {
				type: Boolean,
				value: false
			},
			_showUnreadDropboxSubmissions: {
				type: Boolean,
				value: false
			},
			_showUnapprovedPortfolioEvidence: {
				type: Boolean,
				value: false
			}
		};
	}

	static get observers() {
		return [
			'_onPresentationEntityChange(presentationUrl)'
		];
	}

	static get template() {
		return html`
		<style>
			:host {
				display: block;

				/* Recalculated in onResize, so initial value is meaningless */
				--course-image-card-height: 0;
			}
			.course-card-grid {
				display: -ms-grid;
				display: grid;
				grid-column-gap: 15px;
			}
			.course-card-grid.columns-1 {
				grid-template-columns: 100%;
				-ms-grid-columns: 100%;
			}
			.course-card-grid.columns-2 {
				grid-template-columns: repeat(2, 1fr);
				-ms-grid-columns: 1fr 15px 1fr;
			}
			.course-card-grid.columns-3 {
				grid-template-columns: repeat(3, 1fr);
				-ms-grid-columns: 1fr 15px 1fr 15px 1fr;
			}
			.course-card-grid.columns-4 {
				grid-template-columns: repeat(4, 1fr);
				-ms-grid-columns: 1fr 15px 1fr 15px 1fr 15px 1fr;
			}

			.course-card-grid div,
			.course-card-grid d2l-enrollment-card {
				min-width: 0;
			}

			.course-card-grid d2l-enrollment-card {
				box-sizing: border-box;
				height: 100%;
				padding-bottom: 0.75rem;
				--course-image-height: var(--course-image-card-height);
			}

			:host([widget-view]) .course-card-grid d2l-enrollment-card:nth-of-type(n+13):not([pinned]),
			:host([hide-past-courses]) .course-card-grid d2l-enrollment-card[closed]:not([pinned]) {
				display: none;
			}
		</style>
		<slot></slot>
		<div class="course-card-grid">
			<template is="dom-repeat" items="[[filteredEnrollments]]">
				<d2l-enrollment-card
					href="[[item]]"
					token="[[token]]"
					hide-course-start-date="[[_hideCourseStartDate]]"
					hide-course-end-date="[[_hideCourseEndDate]]"
					show-organization-code="[[_showOrganizationCode]]"
					show-semester-name="[[_showSemesterName]]"
					show-dropbox-unread-feedback="[[_showDropboxUnreadFeedback]]"
					show-unattempted-quizzes="[[_showUnattemptedQuizzes]]"
					show-ungraded-quiz-attempts="[[_showUngradedQuizAttempts]]"
					show-unread-discussion-messages="[[_showUnreadDiscussionMessages]]"
					show-unread-dropbox-submissions="[[_showUnreadDropboxSubmissions]]"
					show-unapproved-portfolio-evidence="[[_showUnapprovedPortfolioEvidence]]">
				</d2l-enrollment-card>
			</template>
		</div>`;
	}

	ready() {
		super.ready();
		this.onResize = this.onResize.bind(this);
	}

	connectedCallback() {
		super.connectedCallback();
		afterNextRender(this, () => {
			window.addEventListener('resize', this.onResize);
			// Sets initial number of columns
			this.onResize();
		});
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener('resize', this.onResize);
	}

	onResize(ie11retryCount) {
		const courseCardGrid = this.shadowRoot.querySelector('.course-card-grid');
		if (!courseCardGrid) {
			return;
		}

		let containerWidth = this.offsetWidth;

		for (let parent = this.parentNode; containerWidth <= 0 && parent; parent = parent.parentNode) {
			containerWidth = parent.offsetWidth;
		}

		if (isNaN(containerWidth)) {
			return;
		}

		const numColumns = Math.min(Math.floor(containerWidth / 350), 4) + 1;
		const columnClass = `columns-${numColumns}`;
		if (courseCardGrid.classList.toString().indexOf(columnClass) === -1) {
			courseCardGrid.classList.remove('columns-1');
			courseCardGrid.classList.remove('columns-2');
			courseCardGrid.classList.remove('columns-3');
			courseCardGrid.classList.remove('columns-4');
			courseCardGrid.classList.add(`columns-${numColumns}`);
		}

		this.updateStyles({'--course-image-card-height': `${containerWidth / numColumns * 0.43}px`});

		const cssGridStyle = document.body.style['grid-template-columns'];
		// Can be empty string, hence the strict comparison
		if (cssGridStyle !== undefined) {
			// Non-IE11 browsers support grid-template-columns, so we're done
			return;
		}

		const courseCardDivs = this.shadowRoot.querySelectorAll('.course-card-grid d2l-enrollment-card');
		ie11retryCount = ie11retryCount || 0;
		if (
			ie11retryCount < 20
			&& courseCardDivs.length === 0
		) {
			// If course cards haven't yet rendered, try again for up to one second
			// (only happens sometimes, only in IE)
			setTimeout(this.onResize.bind(this, ++ie11retryCount), 250);
			return;
		}

		for (let i = 0, position = 0; i < courseCardDivs.length; i++, position++) {
			const div = courseCardDivs[i];

			// The (* 2 - 1) accounts for the grid-gap-esque columns
			const column = (position % numColumns + 1) * 2 - 1;
			const row = Math.floor(position / numColumns) + 1;
			div.style['-ms-grid-column'] = column;
			div.style['-ms-grid-row'] = row;
		}
	}

	refreshCardGridImages(organization) {
		const courseCards = this.shadowRoot.querySelectorAll('d2l-enrollment-card');
		for (let i = 0; i < courseCards.length; i++) {
			courseCards[i].refreshImage(organization);
		}
	}

	_onPresentationEntityChange(url) {
		entityFactory(PresentationEntity, url, this.token, entity => {
			this._hideCourseStartDate = entity.hideCourseStartDate();
			this._hideCourseEndDate = entity.hideCourseEndDate();
			this._showOrganizationCode = entity.showOrganizationCode();
			this._showSemesterName = entity.showSemesterName();
			this._showDropboxUnreadFeedback = entity.showDropboxUnreadFeedback();
			this._showUnattemptedQuizzes = entity.showUnattemptedQuizzes();
			this._showUngradedQuizAttempts = entity.showUngradedQuizAttempts();
			this._showUnreadDiscussionMessages = entity.showUnreadDiscussionMessages();
			this._showUnreadDropboxSubmissions = entity.showUnreadDropboxSubmissions();
			this._showUnapprovedPortfolioEvidence = true;
		});
	}

}

window.customElements.define(MyCoursesCardGrid.is, MyCoursesCardGrid);
