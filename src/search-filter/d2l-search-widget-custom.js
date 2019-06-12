/*
`d2l-search-widget-custom`
Polymer-based web component for the search widget, with added "Recent Searches" functionality.
Should be converted to a new input shared component.
*/
import '@polymer/polymer/polymer-legacy.js';
import 'd2l-dropdown/d2l-dropdown.js';
import 'd2l-dropdown/d2l-dropdown-content.js';
import 'd2l-search-widget/d2l-search-widget.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import './d2l-search-listbox.js';
import '../d2l-utility-behavior.js';
import '../localize-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-search-widget-custom">
	<template strip-whitespace="">
		<style>
			.dropdown-content {
				background: transparent;
			}

			d2l-dropdown {
				min-width: 100%;
			}

			d2l-dropdown-content {
				--d2l-dropdown-verticaloffset: 5px;
			}
			.d2l-search-widget-custom-item {
				@apply --d2l-body-compact-text;
			}
		</style>

		<d2l-dropdown no-auto-open>
			<div class="search-bar d2l-dropdown-opener" id="opener">
				<d2l-search-widget
					search-action="[[searchAction]]"
					search-query="[[_computeSearchQuery(orgUnitTypeIds)]]"
					search-label="[[localize('search.searchCourses')]]"
					placeholder-text="[[localize('courseSearchInputPlaceholder')]]"
					on-keydown="_onSearchInputKeyPressed"
					on-focus="_onSearchInputFocused"
					on-blur="_onSearchInputBlur">
				</d2l-search-widget>
			</div>
			<d2l-dropdown-content id="dropdown" min-width="[[_dropdownWidth]]" max-width="[[_dropdownWidth]]" no-pointer no-auto-close no-auto-focus no-padding>

				<div class="dropdown-content">
					<d2l-search-listbox>
						<div data-list-title disabled>[[localize('recentSearches')]]</div>
						<template is="dom-repeat" items="[[_previousSearches]]">
							<div class="d2l-search-widget-custom-item" selectable data-text$="[[item]]" role="option">
								[[item]]
							</div>
						</template>
					</d2l-search-listbox>
				</div>
			</d2l-dropdown-content>
		</d2l-dropdown>
	</template>

</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-search-widget-custom',

	properties: {
		// URL to use to search. Updated by the search field, as well as external sources like sort/filter menus
		searchUrl: {
			type: String,
			observer: '_handleSearchUrlChange'
		},
		// URL to use to search. Updated by the search field, as well as external sources like sort/filter menus
		searchAction: {
			type: Object
		},
		orgUnitTypeIds: {
			type: Array
		},
		// List of strings containing previously searched terms/selected courses
		_previousSearches: {
			type: Array,
			value: function() {
				return [];
			}
		},
		// Calculated width of live search dropdown
		_dropdownWidth: Number
	},
	listeners: {
		'iron-activate': '_onIronActivate'
	},
	behaviors: [
		D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
		D2L.MyCourses.UtilityBehavior,
		D2L.Dom
	],
	ready: function() {
		this._handleFocusBound = this._handleFocus.bind(this);
		this._handleClickBound = this._handleClick.bind(this);
		this._handleSearch = this._handleSearch.bind(this);
	},
	attached: function() {
		document.body.addEventListener('focus', this._handleFocusBound, true);
		document.body.addEventListener('click', this._handleClickBound, true);

		afterNextRender(this, function() {
			this._getSearchWidget().addEventListener('d2l-search-widget-results-changed', this._handleSearch);
		}.bind(this));

		this._initializePreviousSearches();
	},
	detached: function() {
		document.body.removeEventListener('focus', this._handleFocusBound, true);
		document.body.removeEventListener('click', this._handleClickBound, true);
		this._getSearchWidget().removeEventListener('d2l-search-widget-results-changed', this._handleSearch);
	},
	search: function() {
		this._getSearchWidget().search();
	},
	clear: function() {
		this._getSearchWidget().clear();
	},
	_keyCodes: {
		DOWN: 40,
		UP: 38
	},
	_computeSearchQuery(orgUnitTypeIds) {
		return {
			page: 1,
			orgUnitTypeId: orgUnitTypeIds,
			pageSize: 20
		};
	},
	_getSearchWidget() {
		return this.shadowRoot.querySelector('d2l-search-widget');
	},
	_getListbox() {
		return this.shadowRoot.querySelector('d2l-search-listbox');
	},
	_handleSearch(e) {
		this._addSearchToHistory(e.detail.searchValue);
	},
	_handleSearchUrlChange(url) {
		this._getSearchWidget()._searchUrl = url;
	},
	_onSearchInputKeyPressed: function(e) {
		switch (e.keyCode) {
			case this._keyCodes.DOWN:
				if (this._getListbox().hasItems()) {
					this._getListbox().focus();
				}
				e.preventDefault();
				break;
			case this._keyCodes.UP:
				if (this._getListbox().hasItems()) {
					this._getListbox().focusLast();
				}
				e.preventDefault();
				break;
		}
	},

	/*
	* Recent searches functionality
	*/

	_initializePreviousSearches: function() {
		if (window.localStorage.getItem('myCourses.previousSearches')) {
			try {
				var prevSearchObject = JSON.parse(window.localStorage.getItem('myCourses.previousSearches'));

				if (prevSearchObject.hasOwnProperty('searches') && prevSearchObject.searches instanceof Array) {
					this._previousSearches = prevSearchObject.searches;
				}
			} catch (exception) {
				window.localStorage.removeItem('myCourses.previousSearches');
				this._previousSearches = [];
			}
		}
	},
	_addSearchToHistory: function(searchTerm) {
		if (searchTerm.trim() === '') {
			return;
		}

		// Remove prior existence of this search term if it exists
		for (var i = 0; i < this._previousSearches.length; i++) {
			if (searchTerm === this._previousSearches[i]) {
				this.splice('_previousSearches', i, 1);
			}
		}

		// Add to beginning of list
		this.unshift('_previousSearches', searchTerm);

		// If too many recent items, trim the list
		if (this._previousSearches.length > 5) {
			this.splice('_previousSearches', 5, this._previousSearches.length - 5);
		}

		try {
			window.localStorage.setItem(
				'myCourses.previousSearches',
				JSON.stringify({
					searches: this._previousSearches
				})
			);
		} catch (e) {
			// Local storage not available/full - oh well.
		}
	},
	// Handles iron-activate events, which are fired when listbox items are selected
	_onIronActivate: function(e) {
		var text = e.detail.item.dataset.text;
		if (text) {
			this._getSearchWidget()._getSearchInput().value = text;
			this.search();
		}
		e.stopPropagation();
	},
	// Called when an element within the search bar gains focus, to open the dropdown if required
	_onSearchInputFocused: function() {
		if (this.$.dropdown.opened) {
			return;
		}

		this.set('_dropdownWidth', this.$$('d2l-search-widget').offsetWidth);

		// We want to open the previous searches, but only if there are some
		if (this._previousSearches.length > 0) {
			this.$.dropdown.open();
		}
	},
	_onSearchInputBlur: function(e) {
		var className = e.relatedTarget ? e.relatedTarget.className : '';
		if (e.relatedTarget !== this._getListbox() && className.indexOf('d2l-search-widget-custom-item') === -1) {
			this.$.dropdown.close();
		}
	},
	_handleFocus: function() {
		this._checkFocusLost(document.activeElement);
	},
	_handleClick: function(e) {
		this._checkFocusLost(dom(e).rootTarget);
	},
	_checkFocusLost: function(focusedElement) {
		if (this.$.dropdown.opened && !this.isComposedAncestor(this, focusedElement)) {
			this.$.dropdown.close();
		}
	}
});
