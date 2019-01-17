import '@polymer/polymer/polymer-legacy.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

/*
* @polymerBehavior D2L.MyCourses.CssGridBehavior
*/
D2L.MyCourses.CssGridBehavior = {
	properties: {
		cssGridView: {
			type: Boolean,
			value: true
		}
	},

	attached: function() {
		afterNextRender(this, function() {
			if (this.cssGridView) {
				window.addEventListener('resize', this._onResize.bind(this));
				// Sets initial number of columns
				this._onResize();
			}
		}.bind(this));
	},

	detached: function() {
		if (this.cssGridView) {
			window.removeEventListener('resize', this._onResize.bind(this));
		}
	},

	_onResize: function(ie11retryCount) {
		var courseTileGrid = this.$$('.course-tile-grid');
		if (!courseTileGrid) {
			return;
		}

		var containerWidth = this.offsetWidth;

		for (var parent = this.parentNode; containerWidth <= 0 && parent; parent = parent.parentNode) {
			containerWidth = parent.offsetWidth;
		}

		var numColumns = Math.min(Math.floor(containerWidth / 350), 4) + 1;
		var columnClass = 'columns-' + numColumns;
		if (courseTileGrid.classList.toString().indexOf(columnClass) === -1) {
			courseTileGrid.classList.remove('columns-1');
			courseTileGrid.classList.remove('columns-2');
			courseTileGrid.classList.remove('columns-3');
			courseTileGrid.classList.remove('columns-4');
			courseTileGrid.classList.add('columns-' + numColumns);
		}

		this.updateStyles({'--course-image-tile-height': containerWidth / numColumns * 0.43 + 'px'});

		var cssGridStyle = document.body.style['grid-template-columns'];
		// Can be empty string, hence the strict comparison
		if (cssGridStyle !== undefined) {
			// Non-IE11 browsers support grid-template-columns, so we're done
			return;
		}

		var courseTileDivs = dom(this.root).querySelectorAll('.course-tile-grid > d2l-enrollment-card');
		ie11retryCount = ie11retryCount || 0;
		if (
			ie11retryCount < 20
			&& courseTileDivs.length === 0
		) {
			// If course tiles haven't yet rendered, try again for up to one second
			// (only happens sometimes, only in IE)
			setTimeout(this._onResize.bind(this, ++ie11retryCount), 250);
			return;
		}

		for (var i = 0, position = 0; i < courseTileDivs.length; i++, position++) {
			var div = courseTileDivs[i];
			if (this.__hideElement(div)) {
				position--;
				continue;
			}

			// The (* 2 - 1) accounts for the grid-gap-esque columns
			var column = (position % numColumns + 1) * 2 - 1;
			var row = Math.floor(position / numColumns) + 1;
			div.style['-ms-grid-column'] = column;
			div.style['-ms-grid-row'] = row;
		}
	},

	__hideElement: function(div) {
		return this.is !== 'd2l-all-courses-unified-content'
			&& (div.hasAttribute('completed') || div.hasAttribute('closed'))
			&& !div.hasAttribute('pinned');
	}
};
