/*
`d2l-my-courses-filter`
Lit web component for the my courses filter.
*/

import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui-labs/facet-filter-sort/components/filter-dropdown/filter-dropdown.js';
import '@brightspace-ui-labs/facet-filter-sort/components/filter-dropdown/filter-dropdown-category.js';
import '@brightspace-ui-labs/facet-filter-sort/components/filter-dropdown/filter-dropdown-option.js';
import { createActionUrl, fetchSirenEntity } from '../d2l-utility-helpers.js';
import { css, html, LitElement } from 'lit-element';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { MyCoursesLocalizeMixin } from '../localize-behavior.js';

class MyCoursesFilter extends MyCoursesLocalizeMixin(LitElement) {

	static get properties() {
		return {
			filterCategories: { type: Array },
			_hasBeenOpened: { attribute: false, type: Boolean },
			_totalSelectedCount: { attribute: false, type: Number }
		};
	}

	static get styles() {
		return [bodyCompactStyles, css`
			d2l-loading-spinner {
				width: 100%;
			}
			.d2l-my-courses-filter-no-options-text {
				display: block;
				padding: 0 1rem 1rem 1rem;
			}
		`];
	}

	constructor() {
		super();
		this.filterCategories = [];
		this._hasBeenOpened = false;
		this._totalSelectedCount = 0;
	}

	clear() {
		this._onFilterDropdownCleared();
	}

	updated(changedProperties) {
		super.updated(changedProperties);

		if (changedProperties.has('filterCategories')) {
			this._loadCategories();
		}
	}

	render() {
		return html`
			<d2l-labs-filter-dropdown
				@d2l-dropdown-open="${this._onDropdownOpen}"
				@d2l-labs-filter-dropdown-cleared="${this._onFilterDropdownCleared}"
				min-width="350"
				total-selected-option-count="${this._totalSelectedCount}">

				${this.filterCategories.map(category => html`
					<d2l-labs-filter-dropdown-category
						@d2l-labs-filter-dropdown-category-selected="${this._onFilterDropdownCategorySelected}"
						@d2l-labs-filter-dropdown-category-searched="${this._onFilterDropdownCategorySearched}"
						@d2l-labs-filter-dropdown-option-change="${this._onFilterDropdownOptionChange}"
						key="${category.key}"
						category-text="${ifDefined(category.name)}"
						?disable-search="${this._hasFiltersClass(category) || (!category.isSearched && category.options && category.options.length === 0)}"
						selected-option-count="${category.selectedOptions ? category.selectedOptions.length : 0}">

						${category.optionsLoaded ? html`
							${category.options && category.options.length > 0 ? html`
								${category.options.map(option => html`
									<d2l-labs-filter-dropdown-option
										?selected="${category.selectedOptions.findIndex(optionKey => optionKey === option.key) > -1}"
										text="${ifDefined(option.name)}"
										value="${option.key}">
									</d2l-labs-filter-dropdown-option>
								`)}` : html`
								<div class="d2l-my-courses-filter-no-options-text d2l-body-compact">
									${category.isSearched ? this.localize('noSearchResults') : category.noOptionsText}
								</div>
							`}
						` : html`
							<d2l-loading-spinner></d2l-loading-spinner>
						`}
					</d2l-labs-filter-dropdown-category>
				`)}
			</d2l-labs-filter-dropdown>
		`;
	}

	/* Wrapped for easier test stubbing. Ideally, this will eventually use the entity store
	 * (see the note in d2l-utility-helpers.js)
	 */
	_fetchSirenEntity(url) {
		return fetchSirenEntity(url);
	}

	/* This filter supports two different types of HM filtering methods, which we distinguish throughout
	 * by checking for the "filters" class on the entity containing the options
	 */
	_hasFiltersClass(category) {
		return category.optionsEntity && category.optionsEntity.hasClass('filters');
	}

	_loadCategories() {
		for (let i = 0; i < this.filterCategories.length; i++) {
			const filter = this.filterCategories[i];
			if (filter.optionsLoaded) {
				continue;
			}
			const href = createActionUrl(filter.filterAction);
			this._fetchSirenEntity(href).then(resultingEntity => {
				filter.optionsEntity = resultingEntity;
				if (filter.optionsLoadRequested) {
					if (this._hasFiltersClass(filter)) {
						this._parseFilterOptions(filter);
					} else {
						this._fetchSearchOptions(filter);
					}
				}
			});
		}
	}

	_loadOptions(category) {
		if (!category || category.optionsLoaded) {
			return;
		}

		if (!category.optionsEntity) {
			// The call to get the options entity hasn't finished, so we request it to get the options when it's done
			category.optionsLoadRequested = true;
			return;
		}

		if (!this._hasFiltersClass(category)) {
			this._fetchSearchOptions(category);
		} else {
			this._parseFilterOptions(category);
		}
	}

	_fetchSearchOptions(category) {
		let options = [];
		if (category.optionsEntity && category.optionsEntity.entities) {
			options = category.optionsEntity.entities.map(option => ({ key: option.href }));
		}

		category.options = options;

		const promises = options.map(option => this._fetchSirenEntity(option.key)
			.then(result => {
				option.name = result.properties.name;
			})
			.catch((e) => {
				// eslint-disable-next-line no-console
				console.log(e);
			})
		);

		Promise.all(promises)
			.then(() => {
				category.optionsLoaded = true;
				this.requestUpdate();
			});
	}

	_parseFilterOptions(category) {
		const options = [];
		if (category.optionsEntity && category.optionsEntity.entities) {
			const entities = category.optionsEntity.entities;
			for (let i = 0; i < entities.length; i++) {
				// Options with the same name should be grouped together for this filter type (DE27982)
				const alreadyAdded = options.find(option => option.key === entities[i].title);
				if (!alreadyAdded) {
					options.push({
						name: entities[i].title,
						key: entities[i].title
					});
				}
			}
		}

		category.options = options;
		category.optionsLoaded = true;
		this.requestUpdate();
	}

	_onDropdownOpen() {
		this._hasBeenOpened = true;
		this._loadOptions(this.filterCategories[0]);
	}

	_onFilterDropdownCategorySearched(e) {
		const category = this.filterCategories.find(filter => filter.key === e.detail.categoryKey);

		category.isSearched = e.detail.value ? true : false;
		this.requestUpdate();

		const searchActionHref = createActionUrl(category.filterAction, {
			search: encodeURIComponent(e.detail.value)
		});

		this._fetchSirenEntity(searchActionHref).then((resultingEntity) => {
			category.optionsEntity = resultingEntity;
			// We don't need to check the filters class here, since if the filters class is present search is disabled
			this._fetchSearchOptions(category);
		});
	}

	_onFilterDropdownCategorySelected(e) {
		if (!this._hasBeenOpened) {
			return; // Don't load any options until the filter has been opened
		}
		const category = this.filterCategories.find(category => category.key === e.detail.categoryKey);
		this._loadOptions(category);
	}

	_onFilterDropdownCleared() {
		this._totalSelectedCount = 0;

		for (let i = 0; i < this.filterCategories.length; i++) {
			this.filterCategories[i].selectedOptions = [];
		}
		this.requestUpdate();

		this.dispatchEvent(new CustomEvent('d2l-my-courses-filter-clear'));
	}

	_onFilterDropdownOptionChange(e) {
		const category = this.filterCategories.find(category => category.key === e.detail.categoryKey);
		const optionIndex = category.selectedOptions.findIndex(optionKey => optionKey === e.detail.menuItemKey);

		if (e.detail.selected) {
			this._totalSelectedCount++;
			if (optionIndex === -1) {
				category.selectedOptions.push(e.detail.menuItemKey);
				this.requestUpdate();
			}
		} else {
			this._totalSelectedCount--;
			if (optionIndex > -1) {
				category.selectedOptions.splice(optionIndex, 1);
				this.requestUpdate();
			}
		}

		const selectedFilters = this.filterCategories.map(category => {
			return {
				key: category.key,
				selectedOptions: category.selectedOptions
			};
		});

		this.dispatchEvent(new CustomEvent('d2l-my-courses-filter-change', {
			detail: {
				categoryChanged: e.detail.categoryKey,
				selectedFilters: selectedFilters
			}
		}));
	}

}

window.customElements.define('d2l-my-courses-filter', MyCoursesFilter);

export class MyCoursesFilterCategory {
	constructor(key, name, noOptionsText, filterAction) {
		this.key = key;
		this.name = name;
		this.noOptionsText = noOptionsText;
		this.filterAction = filterAction;

		this.isSearched = false;
		this.options = [];
		this.optionsLoaded = false;
		this.optionsLoadRequested = false;
		this.selectedOptions = [];
	}
}
