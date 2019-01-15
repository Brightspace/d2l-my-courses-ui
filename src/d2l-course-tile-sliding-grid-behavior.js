import '@polymer/polymer/polymer-legacy.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

D2L.MyCourses.CourseTileSlidingGridBehaviorUtility = {
	/**
	 * this method, given an index in the grid, and a count of inserted
	 * or removed tiles, will describe the visual position change of the tile.
	 */
	calculatePositionChange: function calculatePositionChange(columns, i, insert, count) {
		// "current" position
		var col = i % columns;
		var row = Math.floor(i / columns);

		// position after change
		var newCol = insert
			? (col + count) % columns
			: (((col - count) % columns) + columns) % columns;
		var newRow = insert
			? row + Math.floor((col + count) / columns)
			: row + Math.floor((col - count) / columns);

		// difference in position
		var colChange = newCol - col;
		var rowChange = newRow - row;

		return {
			col: colChange,
			row: rowChange
		};
	},

	findDifferenceInLists: function findDifferenceInLists(a, b) {
		var largerList = a;
		var smallerList = b;
		if (a.length < b.length) {
			largerList = b;
			smallerList = a;
		}

		var count = largerList.length - smallerList.length;

		for (var i = 0; i < smallerList.length; ++i) {
			if (smallerList[i] !== largerList[i]) {
				return {
					pos: i,
					count: count
				};
			}
		}

		return {
			pos: smallerList.length,
			count: count
		};
	},

	verifyFunctionPresent: /* @this */ function verifyFunctionPresent(name) {
		if (!this[name]) {
			throw new TypeError('CourseTileSlidingGridBehavior requires "' + name + '" be implemented to function.');
		}
	}

};
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

/*
* Behavior for sliding grid tiles on insertion/removal
*
* @polymerBehavior D2L.MyCourses.CourseTileSlidingGridBehavior
*/
D2L.MyCourses.CourseTileSlidingGridBehavior = {
	observers: [
		'__slide_onEnrollmentsChanged(enrollments.*)'
	],

	__slide_knownGridTileElements: null,
	__slide_rowChange: 0,

	created: function slideBehaviorReady() {
		D2L.MyCourses.CourseTileSlidingGridBehaviorUtility.verifyFunctionPresent.call(this, '_getGridColumnCount');
		D2L.MyCourses.CourseTileSlidingGridBehaviorUtility.verifyFunctionPresent.call(this, '_getGridContainerElement');
		D2L.MyCourses.CourseTileSlidingGridBehaviorUtility.verifyFunctionPresent.call(this, '_getGridTileElements');
		D2L.MyCourses.CourseTileSlidingGridBehaviorUtility.verifyFunctionPresent.call(this, '_getGridTileRepeat');
	},

	attached: function slideBehaviorAttached() {
		afterNextRender(this, /* @this */ function slideBehaviourAfterRender() {
			if (!this.isAttached) {
				return;
			}

			this.__slide_knownGridTileElements = this._getGridTileElements();
			this.listen(this._getGridTileRepeat(), 'dom-change', '__slide_onDomChange');
		});
	},

	detached: function slideBehaviorDetached() {
		this.__slide_knownGridTileElements = null;
		this.unlisten(this._getGridTileRepeat(), 'dom-change', '__slide_onDomChange');
	},

	__slide_onEnrollmentsChanged: function slideOnEnrolmmentsChanged() {
		// dom is about to change. preemptively set current container height
		// so we can animate it later
		var container = this._getGridContainerElement();
		container.style.height = container.scrollHeight + 'px';
	},

	__slide_onDomChange: function slideOnDomChange() {
		var oldTiles = this.__slide_knownGridTileElements;
		var newTiles = this.__slide_knownGridTileElements = this._getGridTileElements();

		var insert = oldTiles.length < newTiles.length;
		var diff = D2L.MyCourses.CourseTileSlidingGridBehaviorUtility.findDifferenceInLists(newTiles, oldTiles);

		this.__slide_rowChange = D2L.MyCourses.CourseTileSlidingGridBehaviorUtility.calculatePositionChange(
			this._getGridColumnCount(),
			oldTiles.length - 1,
			insert,
			diff.count
		).row;

		if (diff.count > 1 // only animate user's pin/unpin actions for now
			|| diff.pos === oldTiles.length // tiles were added on to the end
			|| diff.pos === newTiles.length // tiles were removed from the end
		) {
			this.__slide_resizeContainer(0);
			return;
		}

		this.__slide_repositionTiles(oldTiles, diff.pos, insert, diff.count);
	},

	__slide_repositionTiles: function slideRepositionTiles(tiles, pos, insert, count) {
		var n = tiles.length;

		var i = insert
			? n - 1
			: pos + count;
		var next = insert
			? function() { --i; }
			: function() { ++i; };
		var done = insert
			? function() { return i === pos - 1; }
			: function() { return i === n; };

		var delayPerTile = Math.min(50, 200 / (n - pos - count));
		var delay = 0;

		if (insert) {
			this.__slide_resizeContainer(0);
			delay += delayPerTile;
		}

		for (;;) {
			this.__slide_translateTile(
				tiles[i],
				D2L.MyCourses.CourseTileSlidingGridBehaviorUtility.calculatePositionChange(this._getGridColumnCount(), i, insert, count),
				delay
			);
			delay += delayPerTile;

			next();
			if (done()) {
				break;
			}
		}

		if (!insert) {
			this.__slide_resizeContainer(delay + 100);
		} else {
			this.updateStyles({'--insertion-delay': (delay + 300) + 'ms'});
		}
	},

	__slide_resizeContainer: function slideResizeContainer(delay) {
		var container = this._getGridContainerElement();

		if (this.__slide_rowChange === 0
			&& container.offsetHeight !== 0
		) {
			container.style.height = '';
			return;
		}

		var targetHeight = 0;

		if (this.__slide_rowChange < 0) {
			var tiles = this.__slide_knownGridTileElements;
			if (tiles.length > 0) {
				var lastTile = tiles[tiles.length - 1];
				targetHeight = lastTile.offsetTop;
			}
		} else {
			targetHeight = container.scrollHeight;
		}

		if (targetHeight === container.offsetHeight) {
			container.style.height = '';
			return;
		}

		container.style.transition = '200ms height linear ' + delay + 'ms';
		container.style.height = targetHeight + 'px';

		container.addEventListener('transitionend', function resized(e) {
			if (e.target !== container) {
				return;
			}

			container.removeEventListener('transitionend', resized);

			container.style.transition = '';
			container.style.height = '';
		});
	},

	__slide_translateTile: function slideTranslateTile(tile, change, delay) {
		tile.style.transform =
			'translate3d('
			+ (-change.col * 101) + '%,'
			+ (-change.row * 102) + '%,'
			+ '0)';

		afterNextRender(tile, function slideTileAfterNextRender() {
			tile.style.transition = 'transform 300ms cubic-bezier(0.91, 0.03, 0.85, 0.36) ' + delay + 'ms';
			tile.style.transform = 'translate3d(0, 0, 0)';

			tile.addEventListener('transitionend', function translated(e) {
				if (e.target !== tile) {
					return;
				}

				tile.removeEventListener('transitionend', translated);

				tile.style.transition = '';
				tile.style.transform = '';
			});
		});
	}
};
