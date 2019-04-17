/*
`d2l-search-widget-custom`
Polymer-based web component for the search widget.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/iron-input/iron-input.js';
import '@polymer/iron-pages/iron-pages.js';
import 'd2l-dropdown/d2l-dropdown.js';
import 'd2l-dropdown/d2l-dropdown-content.js';
import 'd2l-icons/d2l-icons.js';
import 'd2l-search-widget/d2l-search-widget-behavior.js';
import 'd2l-search-widget/d2l-search-widget-styles.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import './d2l-search-listbox.js';
import '../d2l-utility-behavior.js';
import '../localize-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-search-widget-custom">
	<template strip-whitespace="">
		<style include="d2l-search-widget-styles">
			:host {
				--d2l-search-widget-height: 60px;
			}

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

		<d2l-dropdown no-auto-open="">
			<div class="search-bar d2l-dropdown-opener" id="opener">
				<iron-input bind-value="{{_searchInput}}">
					<input aria-autocomplete="list" role="combobox" placeholder="{{localize('courseSearchInputPlaceholder')}}" value="{{_searchInput}}" on-keydown="_onSearchInputKeyPressed" on-focus="_onSearchInputFocused">
					
				</iron-input>

				<button type="button" aria-label$="{{localize('search.searchCourses')}}" on-tap="_onButtonClick">
					<d2l-icon icon="d2l-tier1:search"></d2l-icon>
				</button>
			</div>
			<d2l-dropdown-content id="dropdown" min-width="[[_dropdownWidth]]" max-width="[[_dropdownWidth]]" no-pointer="" no-auto-close="" no-auto-focus="" no-padding="">

				<div class="dropdown-content">
					<iron-pages selectable=".search-results-listbox-page" attr-for-selected="data-page-name" selected="recent-searches-page">
						<div class="search-results-listbox-page" data-page-name="recent-searches-page">
							<d2l-search-listbox>
								<div data-list-title="" disabled="">{{localize('recentSearches')}}</div>
								<template is="dom-repeat" items="[[_previousSearches]]">
									<div class="d2l-search-widget-custom-item" selectable="" data-text$="[[item]]" role="option">
										[[item]]
									</div>
								</template>
							</d2l-search-listbox>
						</div>

						<div class="search-results-listbox-page" data-page-name="no-results-page">
							<d2l-search-listbox>
								<div disabled="">{{localize('noSearchResults')}}</div>
							</d2l-search-listbox>
						</div>
					</iron-pages>
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
			observer: '_onSearchUrlChanged'
		},

		// Outstanding /organizations XHRs, which are cancelled when a new search starts
		_organizationRequests: {
			type: Array,
			value: function() {
				return [];
			}
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
		'iron-activate': '_onIronActivate',
		'iron-select': '_onIronSelect'
	},

	behaviors: [
		D2L.PolymerBehaviors.MyCourses.LocalizeBehavior,
		D2L.MyCourses.UtilityBehavior,
		D2L.PolymerBehaviors.SearchWidgetBehavior,
		D2L.Dom
	],

	ready: function() {
		this._handleFocusBound = this._handleFocus.bind(this);
		this._handleClickBound = this._handleClick.bind(this);
	},

	attached: function() {
		document.body.addEventListener('focus', this._handleFocusBound, true);
		document.body.addEventListener('click', this._handleClickBound, true);

		var nodes = dom(this.root).querySelectorAll('d2l-search-listbox');

		this._listboxes = Array.prototype.slice(nodes);

		for (var i = 0; i < this._listboxes.length; i++) {
			this._listboxes[i].owner = this.$$('input');
		}
		this._initializePreviousSearches();
	},

	detached: function() {
		document.body.removeEventListener('focus', this._handleFocusBound, true);
		document.body.removeEventListener('click', this._handleClickBound, true);
	},

	_searchPageSize: 20,
	_liveSearchPageSize: 20,
	_keyCodes: {
		DOWN: 40,
		UP: 38,
		ENTER: 13
	},

	/*
	* SearchWidgetBehavior overrides
	*/

	search: function() {
		this._addSearchToHistory(this._searchInput);
		this._setSearchUrl(this._searchPageSize, 'searchUrl');
	},
	clear: function() {
		// Triggers _onSearchInputChanged to call _setSearchUrl with empty query
		this.set('_searchInput', '');

		this.cancelDebouncer('liveSearchJob');
		this.set('_liveSearchResults', []);

		if (this._previousSearches.length > 0) {
			this.$$('iron-pages').select('recent-searches-page');
		} else {
			this.$.dropdown.close();
		}
	},
	_setSearchUrl: function(pageSize, path) {
		if (!this._searchAction) {
			return;
		}

		var queryParams = {
			page: 1,
			orgUnitTypeId: this.showLearningPaths ? [3, 7] : [3],
			pageSize: pageSize
		};
		queryParams[this.searchFieldName] = encodeURIComponent(this._searchInput.trim());

		this.set(path, this.createActionUrl(this._searchAction, queryParams));
	},
	_onSearchInputChanged: function(newSearchString) {
		if (newSearchString.trim().length === 0) {
			this._setSearchUrl(this._searchPageSize, 'searchUrl');
		} else {
			this.set('_showClearIcon', false);
		}

		if (newSearchString.trim().length === 0 && this._previousSearches.length > 0) {
			this.$$('iron-pages').select('recent-searches-page');
		}

		// If the search input has changed programmatically (e.g. via
		// searchAction changing), the input won't be focused, and we
		// don't want to open the dropdown or live search
		if (D2L.Dom.Focus.getComposedActiveElement() === this.$$('input')) {
			if (!this.$.dropdown.opened) {
				// If a user enters a new key after having searched, re-open dropdown
				this.$.dropdown.open();
			}
			if (this._listboxes) {
				this.debounce('liveSearchJob', this._liveSearch, 750);
			}
		}
	},
	_onSearchInputKeyPressed: function(e) {
		switch (e.keyCode) {
			case this._keyCodes.ENTER:
				this._addSearchToHistory(this._searchInput);
				this.search();
				if (this._searchInput.trim().length > 0) {
					this.$.dropdown.close();
				}
				e.preventDefault();
				break;
			case this._keyCodes.DOWN:
				if (this._currentListbox.hasItems()) {
					this._currentListbox.focus();
				}
				e.preventDefault();
				break;
			case this._keyCodes.UP:
				if (this._currentListbox.hasItems()) {
					this._currentListbox.focusLast();
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

	/*
	* Live search functionality
	*/

	_liveSearch: function() {
		if (this._searchInput.trim().length > 0) {
			this._setSearchUrl(this._liveSearchPageSize, 'searchUrl');
			this.$.dropdown.close();
		}
	},

	/*
	* Dropdown functionality
	*/

	_onIronSelect: function() {
		var ironPages = this.$$('iron-pages');
		var pageIndex = ironPages.indexOf(ironPages.selectedItem);
		this._currentListbox = this._listboxes[pageIndex];
	},
	// Handles iron-activate events, which are fired when listbox items are selected and dropdown pages are changed
	_onIronActivate: function(e) {
		var text = e.detail.item.dataset.text;
		if (text) {
			this._addSearchToHistory(text);
			this._searchInput = text;
			this.search();
		}
		e.stopPropagation();
	},
	// Called when an element within the search bar gains focus, to open the dropdown if required
	_onSearchInputFocused: function() {
		if (this.$.dropdown.opened) {
			return;
		}

		this.set('_dropdownWidth', this.$$('input').offsetWidth);

		// If the search field is blank, we want to open the previous searches, but only if there are some
		if (this._searchInput === '' && this._previousSearches.length > 0) {
			this.$$('iron-pages').select('recent-searches-page');
		}

		// If there is a search value, just re-open the dropdown (either results or no-results will show,
		// depending on what was last selected).
		this.$.dropdown.open();
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
