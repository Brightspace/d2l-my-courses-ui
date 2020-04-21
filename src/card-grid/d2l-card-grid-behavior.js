import '@polymer/polymer/polymer-legacy.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

/*
* @polymerBehavior D2L.MyCourses.CardGridBehavior
*/
D2L.MyCourses.CardGridBehavior = {
	attached: function() {
		afterNextRender(this, () => {
			window.addEventListener('resize', this._onResize.bind(this));
			// Sets initial number of columns
			this._onResize();
		});
	},

	detached: function() {
		window.removeEventListener('resize', this._onResize.bind(this));
	},

	_onResize: function(ie11retryCount) {
		const courseCardGrid = this.$$('.course-card-grid');
		if (!courseCardGrid) {
			return;
		}

		let containerWidth = this.offsetWidth;

		for (let parent = this.parentNode; containerWidth <= 0 && parent; parent = parent.parentNode) {
			containerWidth = parent.offsetWidth;
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

		const courseCardDivs = dom(this.root).querySelectorAll('.course-card-grid d2l-enrollment-card');
		ie11retryCount = ie11retryCount || 0;
		if (
			ie11retryCount < 20
			&& courseCardDivs.length === 0
		) {
			// If course cards haven't yet rendered, try again for up to one second
			// (only happens sometimes, only in IE)
			setTimeout(this._onResize.bind(this, ++ie11retryCount), 250);
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
	},

};
