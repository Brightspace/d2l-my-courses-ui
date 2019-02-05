/**
`d2l-touch-menu`
Polymer-based web component for the mobile touch menu.

This is used by `d2l-course-tile-grid`, which is used when the `us90524-my-courses-css-grid-layout` LD flag is off.
This can be removed when that flag is removed.

@demo demo/d2l-touch-menu-demo.html Touch Menu

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-touch-menu">
	<template strip-whitespace="">
		<style>
			.long-press-menu {
				display: inline-block;
				font-size: 3em;
				visibility: hidden;
				z-index: 2000;
				position: fixed;
			}
		</style>

		<div class="long-press-menu">
			<slot></slot>
		</div>
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-touch-menu',

	properties: {
		enabled: {
			type: Boolean,
			value: true
		},
		// Array of HTMLElement touch targets to be applied to an element
		touchTargets: {
			type: Array,
			value: function() {
				return [];
			}
		},
		_menuOpen: {
			type: Boolean,
			observer: '_onMenuOpenChanged'
		}
	},
	listeners: {
		'contextmenu': '_contextmenuHandler'
	},
	observers: [
		'_touchTargetsChanged(touchTargets)'
	],
	ready: function() {
		this._menu = this.$$('.long-press-menu');
		this._menuItems = [].slice.call(dom(this).querySelectorAll('d2l-touch-menu-item'));
	},
	attached: function() {
		for (var i = 0; i < this._menuItems.length; i++) {
			this._menuItems[i]._menu = this;
		}
	},
	_cancelClicks: false,
	_currentTarget: null,
	_enableClicksTimerID: null,
	_longPressDuration: 500,
	_menu: null,
	_menuItems: null,
	_openMenuTimerID: null,
	_touchHandlers: {
		'touchstart': '_touchstartHandler',
		'touchend': '_touchendHandler',
		'touchcancel': '_touchcancelHandler',
		'touchmove': '_touchmoveHandler',
		'click': '_clickHandler',
		'contextmenu': '_contextmenuHandler'
	},
	_clickHandler: function(e) {
		if (this._cancelClicks) {
			e.preventDefault();
			this._enableClicks();
		}
	},
	_contextmenuHandler: function(e) {
		e.preventDefault();
	},
	_enableClicks: function() {
		this._cancelClicks = false;
		clearTimeout(this._enableClicksTimerID);
		this._enableClicksTimerID = null;
	},
	_openMenu: function(touchstartEvent) {
		var touchData = {
			startX: touchstartEvent.changedTouches[0].pageX,
			startY: touchstartEvent.changedTouches[0].pageY,
			clientX: touchstartEvent.changedTouches[0].clientX,
			clientY: touchstartEvent.changedTouches[0].clientY
		};

		var menuPosX = touchData.clientX;
		var menuPosY = touchData.clientY;

		this._menu.style.left = menuPosX + 'px';
		this._menu.style.top = menuPosY + 'px';

		// For now, only deal with one menu item
		var menuItem = this._menuItems[0];
		var radius = menuItem.height * 1.3;
		var translationCoefficient = 1.1;
		var horizontalExpansionRoom = radius + (menuItem.width * 2);
		var verticalExpansionRoom = radius + (2 * menuItem.height * translationCoefficient);
		var nearLeftEdge = menuPosX < menuItem.width;
		var nearRightEdge = menuPosX > (window.innerWidth - menuItem.height);
		var layoutDirX = 0;
		var layoutDirY = 0;

		if (menuPosY < verticalExpansionRoom) {
			layoutDirX = -1.0;

			if (menuPosY < menuItem.height) {
				layoutDirX = -0.707;
				layoutDirY = 0.707;
			} else if (menuPosY > (verticalExpansionRoom * 0.707)) {
				layoutDirX = -0.707;
				layoutDirY = -0.707;
			}

			// Not enough room to expand to left; switch to right
			if (menuPosX < (-horizontalExpansionRoom * layoutDirX)) {
				layoutDirX *= -1;
			}
		} else if (nearLeftEdge || nearRightEdge) {
			// If we're near a border, we can always go up-away from that side
			var xDir = nearLeftEdge ? 1.0 : -1.0;

			layoutDirX = xDir * 0.707;
			layoutDirY = -0.707;
		} else {
			// Set above touch point
			layoutDirY = -1.0;
		}

		var menuItemPosition = {
			x: -(menuItem.width / 2) + (layoutDirX * radius),
			y: -(menuItem.height / 2) + (layoutDirY * radius)
		};

		menuItem.updateStyles({'--translate-x-coefficient': (translationCoefficient * layoutDirX).toString()});
		menuItem.updateStyles({'--translate-y-coefficient': (translationCoefficient * layoutDirY).toString()});

		menuItem.offset = menuItemPosition;
		menuItem.touchRegion = {
			left: menuPosX + menuItemPosition.x,
			top: menuPosY + menuItemPosition.y
		};

		this._menuOpen = true;
	},
	_onMenuOpenChanged: function(openMenu) {
		this._menu.style.visibility = openMenu ? 'visible' : 'hidden';

		if (openMenu) {
			this._cancelClicks = true;
		} else {
			// iOS will send delayed click on long press completion, so we need to slightly delay re-enabling clicks
			this._enableClicksTimerID = setTimeout(this._enableClicks.bind(this), 100);
		}

		var menuEvent = 'touch-menu-' + (openMenu ? 'open' : 'close');
		this.fire(menuEvent, {element: this._currentTarget});

		this._menuItems.forEach(function(menuItem) {
			menuItem.visible = openMenu;
		}.bind(this));
	},
	_touchcancelHandler: function() {
		clearTimeout(this._openMenuTimerID);

		this._menuOpen = false;
	},
	_touchendHandler: function(e) {
		// When finger is released, if the item is selected, then do the fancy animation
		this._menuItems.forEach(function(menuItem) {
			if (menuItem.hoverState === true) {
				menuItem.selected = true;

				if (typeof menuItem.selectionEvent === 'string') {
					this.fire(menuItem.selectionEvent, {element: this._currentTarget});
				}
			}
		}.bind(this));

		this._touchcancelHandler(e);
	},
	_touchmoveHandler: function(e) {
		if (this._menuOpen) {
			var touchPoint = {
				x: e.changedTouches[0].clientX,
				y: e.changedTouches[0].clientY
			};

			//If we can cancel the pending move, do so, so we don't scroll the page while attempting to navigate the menu.
			if (e.cancelable) {
				e.preventDefault();
				e.stopPropagation();
			}
			else {
				//Otherwise, terminate the touch (though this shouldn't be visible at this point anyway
				this._touchendHandler();
			}

			this._menuItems.forEach(function(menuItem) {
				menuItem.hoverState = menuItem.pointInTouchRegion(touchPoint);
			}.bind(this));
		} else {
			clearTimeout(this._openMenuTimerID);
		}
	},
	_touchstartHandler: function(e) {
		e.stopPropagation();

		this._currentTarget = e.currentTarget;

		// Only show the menu if it's tap+hold
		this._openMenuTimerID = setTimeout(this._openMenu.bind(this, e), this._longPressDuration);
	},
	_touchTargetsChanged: function(newValues) {
		if (this.enabled) {
			for (var i = 0; i < newValues.length; i++) {
				if (!newValues[i]._touchMenuHandlersAdded) {
					newValues[i]._touchMenuHandlersAdded = true;

					for (var handler in this._touchHandlers) {
						var boundHandler = this[this._touchHandlers[handler]].bind(this);
						newValues[i].addEventListener(handler, boundHandler, false);
					}
				}
			}
		}
	}
});
