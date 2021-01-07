import { MyCoursesFilterCategory } from '../../src/search-filter/d2l-my-courses-filter';
import sinon from 'sinon';

let sandbox,
	component,
	semesterFilterType,
	semesterEntity,
	semester1,
	semester2,
	departmentFilterType,
	departmentEntity,
	roleFilterType,
	roleEntity,
	fetchStub;

function sirenParse(entity) {
	return window.D2L.Hypermedia.Siren.Parse(entity);
}

function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

beforeEach(() => {
	semesterFilterType = new MyCoursesFilterCategory(
		'semesters',
		'Semesters',
		'No Semesters',
		{
			name: 'search-my-semesters',
			href: '/semesters',
			fields: [{
				name: 'search',
				value: ''
			}]
		}
	);
	semesterEntity = {
		actions: [{
			name: 'search-my-semesters',
			href: '/semesters'
		}],
		class: ['collection', 'organization'],
		entities: [{
			class: ['active', 'semester'],
			href: '/semester/1',
			rel: ['https://api.brightspace.com/rels/organization']
		}]
	};
	semester1 = {
		href: '/semester/1',
		properties: {
			name: 'Semester 1'
		}
	};
	semester2 = {
		href: '/semester/2',
		properties: {
			name: 'Semester 2'
		}
	};

	departmentFilterType = new MyCoursesFilterCategory(
		'departments',
		'Departments',
		'No Departments',
		{
			name: 'search-my-departments',
			href: '/departments',
			fields: [{
				name: 'search',
				value: ''
			}]
		}
	);
	departmentEntity = {
		actions: [{
			name: 'search-my-departments',
			href: '/departments'
		}],
		class: ['collection', 'organization'],
	};

	roleFilterType = new MyCoursesFilterCategory(
		'roles',
		'Roles',
		'No Roles',
		{
			name: 'set-role-filters',
			href: '/role-filters',
			fields: [{
				name: 'include',
				value: ''
			}]
		}
	);
	roleEntity = {
		actions: [{
			name: 'apply-role-filters',
			href: '/apply-role-filter'
		}, {
			name: 'clear-role-filters',
			href: '/clear-role-filter'
		}],
		class: ['collection', 'filters'],
		entities: [{
			actions: [{
				name: 'add-filter',
				href: 'role/1'
			}],
			class: ['filter', 'off'],
			rel: ['item'],
			title: 'Student'
		},
		{
			actions: [{
				name: 'add-filter',
				href: 'role/2'
			}],
			class: ['filter', 'off'],
			rel: ['item'],
			title: 'Instructor'
		},
		{
			actions: [{
				name: 'add-filter',
				href: 'role/3'
			}],
			class: ['filter', 'off'],
			rel: ['item'],
			title: 'Student'
		}]
	};

	sandbox = sinon.createSandbox();
	component = fixture('d2l-my-courses-filter-fixture');

	fetchStub = sandbox.stub(component, '_fetchSirenEntity');
	fetchStub.withArgs(sinon.match(/\/semesters\?search=$/)).returns(Promise.resolve(sirenParse(semesterEntity)));
	fetchStub.withArgs(sinon.match(/\/semesters\?search=1$/)).returns(Promise.resolve(sirenParse(semesterEntity)));
	fetchStub.withArgs(sinon.match(/\/semester\/1/)).returns(Promise.resolve(sirenParse(semester1)));
	fetchStub.withArgs(sinon.match(/\/semester\/2/)).returns(Promise.resolve(sirenParse(semester2)));
	fetchStub.withArgs(sinon.match(/\/departments/)).returns(Promise.resolve(sirenParse(departmentEntity)));
	fetchStub.withArgs(sinon.match(/\/role-filters/)).returns(Promise.resolve(sirenParse(roleEntity)));
});

afterEach(() => {
	sandbox.restore();
});

describe('d2l-my-courses-filter', () => {
	describe('Loading', () => {
		it('should initialize categories with extra properties', async() => {
			component.filterCategories = [semesterFilterType];
			await component.updateComplete;

			const category = component.filterCategories[0];
			expect(category.isSearched).to.equal(false);
			expect(category.options).to.deep.equal([]);
			expect(category.optionsLoaded).to.equal(false);
			expect(category.optionsLoadRequested).to.equal(false);
			expect(category.selectedOptions).to.deep.equal([]);
		});

		it('should call to get the options entity for each category immediately, but not the options', async() => {
			component.filterCategories = [semesterFilterType, roleFilterType];
			await component.updateComplete;

			expect(fetchStub.callCount).to.equal(2); // Once for each filter and once
			expect(component.filterCategories[0].optionsEntity).to.deep.equal(sirenParse(semesterEntity));
			expect(component.filterCategories[0].options).to.be.empty;
			expect(component.filterCategories[1].optionsEntity).to.deep.equal(sirenParse(roleEntity));
			expect(component.filterCategories[1].options).to.be.empty;
		});

		it('should load the options right after if a request was made while the entity was loading', async() => {
			fetchStub.withArgs(sinon.match(/\/semesters/)).callsFake(async() => {
				await timeout(150);
				return Promise.resolve(sirenParse(semesterEntity));
			});
			component.filterCategories = [semesterFilterType, roleFilterType];
			await component.updateComplete;

			component.filterCategories[0].optionsLoadRequested = true;
			await timeout(150);
			expect(fetchStub.callCount).to.equal(3); // Once for each filter and once to get the semester option
			expect(component.filterCategories[0].optionsEntity).to.deep.equal(sirenParse(semesterEntity));
			expect(component.filterCategories[0].options.length).to.equal(1);
			expect(component.filterCategories[1].optionsEntity).to.deep.equal(sirenParse(roleEntity));
			expect(component.filterCategories[1].options).to.be.empty;
		});

		it('should show a loading spinner if the options are not loaded', async() => {
			component.filterCategories = [semesterFilterType];
			await component.updateComplete;

			const category = component.shadowRoot.querySelector('d2l-labs-filter-dropdown-category');
			const loadingSpinner = category.querySelector('d2l-loading-spinner');

			expect(loadingSpinner).to.not.be.null;
		});

		it('should properly load the options that require fetching', async() => {
			component.filterCategories = [semesterFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			expect(fetchStub.callCount).to.equal(2); // Once for the filter and once for the semester option
			const category = component.filterCategories[0];
			expect(category.optionsEntity.entities.length).to.equal(1);
			expect(category.options.length).to.equal(1);
			expect(category.options[0].key).to.equal('/semester/1');
			expect(category.options[0].name).to.equal('Semester 1');
		});

		it('should still load the rest of the options if one fails', async() => {
			const consoleSpy = sandbox.spy(console, 'log');
			semesterEntity.entities.push({
				class: ['active', 'semester'],
				href: '/semester/2',
				rel: ['https://api.brightspace.com/rels/organization']
			});
			fetchStub.withArgs(sinon.match(/\/semesters\?search=$/)).returns(Promise.resolve(sirenParse(semesterEntity)));
			fetchStub.withArgs(sinon.match(/\/semester\/1/)).returns(Promise.reject('something went wrong'));

			component.filterCategories = [semesterFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			expect(fetchStub.callCount).to.equal(3); // Once for the filter and once for each semester option
			const category = component.filterCategories[0];
			expect(category.optionsEntity.entities.length).to.equal(2);
			expect(category.options.length).to.equal(2);
			expect(category.options[0].key).to.equal('/semester/1');
			expect(category.options[0].name).to.be.undefined;
			expect(consoleSpy).to.have.been.calledWith('something went wrong');
			expect(category.options[1].key).to.equal('/semester/2');
			expect(category.options[1].name).to.equal('Semester 2');
		});

		it('should properly load the options that require parsing and combine duplicates', async() => {
			component.filterCategories = [roleFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			expect(fetchStub.callCount).to.equal(1); // Only once for the filter
			const category = component.filterCategories[0];
			expect(category.optionsEntity.entities.length).to.equal(3);
			expect(category.options.length).to.equal(2);
			expect(category.options[0].key).to.equal('Student');
			expect(category.options[0].name).to.equal('Student');
			expect(category.options[1].key).to.equal('Instructor');
			expect(category.options[1].name).to.equal('Instructor');
		});

		it('should display the "noOptionsText" if there are no options', async() => {
			component.filterCategories = [departmentFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			expect(fetchStub.callCount).to.equal(1); // Only once for the filter
			const category = component.filterCategories[0];
			expect(category.optionsEntity.entities).to.be.undefined;
			expect(category.options.length).to.equal(0);
			const noOptionsText = component.shadowRoot.querySelector('.d2l-my-courses-filter-no-options-text');
			expect(noOptionsText.innerText).to.include('No Departments');
		});
	});

	describe('Opening the Filter', () => {
		it('should set _hasBeenOpened and load the first tab\'s options', async() => {
			component.filterCategories = [departmentFilterType];
			await component.updateComplete;

			expect(component._hasBeenOpened).to.be.false;
			expect(component.filterCategories[0].optionsLoaded).to.be.false;

			const filter = component.shadowRoot.querySelector('d2l-labs-filter-dropdown');
			filter.dispatchEvent(new CustomEvent('d2l-dropdown-open'));

			await timeout(0);
			expect(component._hasBeenOpened).to.be.true;
			expect(component.filterCategories[0].optionsLoaded).to.be.true;
		});

		it('should not reload the first tab\'s options if they have already been loaded', async() => {
			const stubFetchSearchOptions = sandbox.stub(component, '_fetchSearchOptions');
			const stubParseFilterOptions = sandbox.stub(component, '_parseFilterOptions');
			component.filterCategories = [departmentFilterType];
			await component.updateComplete;

			component.filterCategories[0].optionsLoaded = true;

			const filter = component.shadowRoot.querySelector('d2l-labs-filter-dropdown');
			filter.dispatchEvent(new CustomEvent('d2l-dropdown-open'));

			await timeout(0);
			expect(component.filterCategories[0].optionsLoadRequested).to.be.false;
			expect(stubFetchSearchOptions).to.not.be.called;
			expect(stubParseFilterOptions).to.not.be.called;
		});
	});

	describe('Selecting a Filter Category', () => {
		it('should do nothing if the filter has not been opened yet', async() => {
			component.filterCategories = [semesterFilterType];
			await component.updateComplete;

			expect(component.filterCategories[0].optionsLoaded).to.be.false;
			expect(component.filterCategories[0].options.length).to.be.empty;

			const category = component.shadowRoot.querySelector('d2l-labs-filter-dropdown-category');
			category.dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-category-selected', {
				detail: {
					categoryKey: 'semesters'
				}
			}));

			await timeout(0);
			expect(component.filterCategories[0].optionsLoaded).to.be.false;
			expect(component.filterCategories[0].options.length).to.be.empty;
		});

		it('should load that category\'s options if the filter has been opened', async() => {
			component.filterCategories = [semesterFilterType, roleFilterType];
			await component.updateComplete;

			expect(component.filterCategories[0].optionsLoaded).to.be.false;
			expect(component.filterCategories[0].options.length).to.be.empty;
			expect(component.filterCategories[1].optionsLoaded).to.be.false;
			expect(component.filterCategories[1].options.length).to.be.empty;

			component._hasBeenOpened = true;

			const category = component.shadowRoot.querySelector('d2l-labs-filter-dropdown-category');
			category.dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-category-selected', {
				detail: {
					categoryKey: 'semesters'
				}
			}));

			await timeout(0);
			expect(component.filterCategories[0].optionsLoaded).to.be.true;
			expect(component.filterCategories[0].options.length).to.equal(1);

			category.dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-category-selected', {
				detail: {
					categoryKey: 'roles'
				}
			}));

			await timeout(0);
			expect(component.filterCategories[1].optionsLoaded).to.be.true;
			expect(component.filterCategories[1].options.length).to.equal(2);
		});
	});

	describe('Searching a Filter Category', () => {
		it('should be disabled for the filter type with the class of "filters"', async() => {
			component.filterCategories = [roleFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			const category = component.shadowRoot.querySelector('d2l-labs-filter-dropdown-category');
			expect(category.disableSearch).to.be.true;
		});

		it('should be disabled if the filter category has no options', async() => {
			component.filterCategories = [departmentFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			const category = component.shadowRoot.querySelector('d2l-labs-filter-dropdown-category');
			expect(category.disableSearch).to.be.true;
		});

		it('should be enabled if the filter category supports it and has options', async() => {
			component.filterCategories = [semesterFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			const category = component.shadowRoot.querySelector('d2l-labs-filter-dropdown-category');
			expect(category.disableSearch).to.be.false;
		});

		it('should remove values that do not match the search value, but keep selected values the same', async() => {
			semesterEntity.entities.push({
				class: ['active', 'semester'],
				href: '/semester/2',
				rel: ['https://api.brightspace.com/rels/organization']
			});
			fetchStub.withArgs(sinon.match(/\/semesters\?search=$/)).returns(Promise.resolve(sirenParse(semesterEntity)));

			component.filterCategories = [semesterFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			component.filterCategories[0].selectedOptions.push('/semester/2');
			await component.requestUpdate();

			const category = component.shadowRoot.querySelector('d2l-labs-filter-dropdown-category');
			category.dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-category-searched', {
				detail: {
					categoryKey: 'semesters',
					value: '1'
				}
			}));

			await timeout(0);
			expect(component.filterCategories[0].selectedOptions.length).to.equal(1);
			expect(component.filterCategories[0].selectedOptions[0]).to.equal('/semester/2');
			expect(component.filterCategories[0].options.length).to.equal(1);
			expect(component.filterCategories[0].options[0].key).to.equal('/semester/1');
		});

		it('should show the correct text and not disable the search input if all options are filtered out', async() => {
			semesterEntity.entities = [];
			fetchStub.withArgs(sinon.match(/\/semesters\?search=test$/)).returns(Promise.resolve(sirenParse(semesterEntity)));
			component.filterCategories = [semesterFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			const category = component.shadowRoot.querySelector('d2l-labs-filter-dropdown-category');
			category.dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-category-searched', {
				detail: {
					categoryKey: 'semesters',
					value: 'test'
				}
			}));

			await timeout(0);
			expect(component.filterCategories[0].options).to.be.empty;
			expect(category.disableSearch).to.be.false;
			const noOptionsText = component.shadowRoot.querySelector('.d2l-my-courses-filter-no-options-text');
			expect(noOptionsText.innerText).to.include('No results.');
		});
	});

	describe('Selecting Filter Options', () => {
		it('should increase the counts and set the selectedOptions array accordingly when a filter option is selected', async() => {
			component.filterCategories = [semesterFilterType, roleFilterType];
			await component.updateComplete;
			component._onDropdownOpen();
			await timeout(0);

			const category = component.shadowRoot.querySelectorAll('d2l-labs-filter-dropdown-category');
			expect(category[0].selectedOptionCount).to.equal(0);
			expect(category[1].selectedOptionCount).to.equal(0);
			expect(component.filterCategories[0].selectedOptions).to.be.empty;
			expect(component.filterCategories[1].selectedOptions).to.be.empty;
			expect(component._totalSelectedCount).to.equal(0);

			category[0].dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'semesters',
					menuItemKey: '/semester/1',
					selected: true
				}
			}));

			await timeout(0);
			expect(category[0].selectedOptionCount).to.equal(1);
			expect(category[1].selectedOptionCount).to.equal(0);
			expect(component.filterCategories[0].selectedOptions).to.deep.equal(['/semester/1']);
			expect(component.filterCategories[1].selectedOptions).to.be.empty;
			expect(component._totalSelectedCount).to.equal(1);

			category[1].dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'roles',
					menuItemKey: 'Student',
					selected: true
				}
			}));

			await timeout(0);
			expect(category[0].selectedOptionCount).to.equal(1);
			expect(category[1].selectedOptionCount).to.equal(1);
			expect(component.filterCategories[0].selectedOptions).to.deep.equal(['/semester/1']);
			expect(component.filterCategories[1].selectedOptions).to.deep.equal(['Student']);
			expect(component._totalSelectedCount).to.equal(2);
		});

		it('should decrease the counts and set the selectedOptions array accordingly when a filter option is unselected', async() => {
			component.filterCategories = [semesterFilterType, roleFilterType];
			await component.updateComplete;
			component._onDropdownOpen();

			component._onFilterDropdownOptionChange(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'semesters',
					menuItemKey: '/semester/1',
					selected: true
				}
			}));
			component._onFilterDropdownOptionChange(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'roles',
					menuItemKey: 'Student',
					selected: true
				}
			}));
			await timeout(0);

			const category = component.shadowRoot.querySelectorAll('d2l-labs-filter-dropdown-category');
			expect(category[0].selectedOptionCount).to.equal(1);
			expect(category[1].selectedOptionCount).to.equal(1);
			expect(component.filterCategories[0].selectedOptions).to.deep.equal(['/semester/1']);
			expect(component.filterCategories[1].selectedOptions).to.deep.equal(['Student']);
			expect(component._totalSelectedCount).to.equal(2);

			category[0].dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'semesters',
					menuItemKey: '/semester/1',
					selected: false
				}
			}));

			await timeout(0);
			expect(category[0].selectedOptionCount).to.equal(0);
			expect(category[1].selectedOptionCount).to.equal(1);
			expect(component.filterCategories[0].selectedOptions).to.be.empty;
			expect(component.filterCategories[1].selectedOptions).to.deep.equal(['Student']);
			expect(component._totalSelectedCount).to.equal(1);

			category[1].dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'roles',
					menuItemKey: 'Student',
					selected: false
				}
			}));

			await timeout(0);
			expect(category[0].selectedOptionCount).to.equal(0);
			expect(category[1].selectedOptionCount).to.equal(0);
			expect(component.filterCategories[0].selectedOptions).to.be.empty;
			expect(component.filterCategories[1].selectedOptions).to.be.empty;
			expect(component._totalSelectedCount).to.equal(0);
		});

		it('should only add each key to the selectedOptions array once', async() => {
			component.filterCategories = [semesterFilterType];
			await component.updateComplete;
			component._onDropdownOpen();

			component._onFilterDropdownOptionChange(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'semesters',
					menuItemKey: '/semester/1',
					selected: true
				}
			}));

			await timeout(0);
			expect(component.filterCategories[0].selectedOptions).to.deep.equal(['/semester/1']);

			component._onFilterDropdownOptionChange(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'semesters',
					menuItemKey: '/semester/1',
					selected: true
				}
			}));

			await timeout(0);
			expect(component.filterCategories[0].selectedOptions).to.deep.equal(['/semester/1']);
		});

		it('should send a "d2l-my-courses-filter-change" event with the filter category that changed and the current state of all selected filters for each category', async() => {
			component.filterCategories = [semesterFilterType, departmentFilterType, roleFilterType];
			await component.updateComplete;
			component._onDropdownOpen();

			component.filterCategories[2].selectedOptions = ['Student', 'Instructor'];
			await timeout(0);

			function getEvent() {
				return new Promise(resolve => {
					component.addEventListener('d2l-my-courses-filter-change', (e) => resolve(e));
				});
			}

			setTimeout(() => {
				component._onFilterDropdownOptionChange(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
					detail: {
						categoryKey: 'semesters',
						menuItemKey: '/semester/1',
						selected: true
					}
				}));
			}, 0);

			const event = await getEvent();
			expect(event.detail.categoryChanged).to.equal('semesters');
			expect(event.detail.selectedFilters[0]).to.deep.equal({
				key: 'semesters',
				selectedOptions: ['/semester/1']
			});
			expect(event.detail.selectedFilters[1]).to.deep.equal({
				key: 'departments',
				selectedOptions: []
			});
			expect(event.detail.selectedFilters[2]).to.deep.equal({
				key: 'roles',
				selectedOptions: ['Student', 'Instructor']
			});
		});
	});

	describe('Clearing Filter Options', () => {
		beforeEach(async() => {
			component.filterCategories = [semesterFilterType, roleFilterType];
			await component.updateComplete;
			component._onDropdownOpen();

			component._onFilterDropdownOptionChange(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'semesters',
					menuItemKey: '/semester/1',
					selected: true
				}
			}));
			component._onFilterDropdownOptionChange(new CustomEvent('d2l-labs-filter-dropdown-option-change', {
				detail: {
					categoryKey: 'roles',
					menuItemKey: 'Student',
					selected: true
				}
			}));
			await timeout(0);
		});
		it('should reset the counts back to 0 and the selectedOptions array back to empty', async() => {
			const filter = component.shadowRoot.querySelector('d2l-labs-filter-dropdown');
			const category = component.shadowRoot.querySelectorAll('d2l-labs-filter-dropdown-category');
			expect(category[0].selectedOptionCount).to.equal(1);
			expect(category[1].selectedOptionCount).to.equal(1);
			expect(component.filterCategories[0].selectedOptions).to.deep.equal(['/semester/1']);
			expect(component.filterCategories[1].selectedOptions).to.deep.equal(['Student']);
			expect(component._totalSelectedCount).to.equal(2);

			filter.dispatchEvent(new CustomEvent('d2l-labs-filter-dropdown-cleared'));

			await timeout(0);
			expect(category[0].selectedOptionCount).to.equal(0);
			expect(category[1].selectedOptionCount).to.equal(0);
			expect(component.filterCategories[0].selectedOptions).to.be.empty;
			expect(component.filterCategories[1].selectedOptions).to.be.empty;
			expect(component._totalSelectedCount).to.equal(0);
		});

		it('should do the same when the public function is called', async() => {
			const category = component.shadowRoot.querySelectorAll('d2l-labs-filter-dropdown-category');
			expect(category[0].selectedOptionCount).to.equal(1);
			expect(category[1].selectedOptionCount).to.equal(1);
			expect(component.filterCategories[0].selectedOptions).to.deep.equal(['/semester/1']);
			expect(component.filterCategories[1].selectedOptions).to.deep.equal(['Student']);
			expect(component._totalSelectedCount).to.equal(2);

			component.clear();

			await timeout(0);
			expect(category[0].selectedOptionCount).to.equal(0);
			expect(category[1].selectedOptionCount).to.equal(0);
			expect(component.filterCategories[0].selectedOptions).to.be.empty;
			expect(component.filterCategories[1].selectedOptions).to.be.empty;
			expect(component._totalSelectedCount).to.equal(0);
		});

		it('should send a "d2l-my-courses-filter-clear" event', async() => {
			function getEvent() {
				return new Promise(resolve => {
					component.addEventListener('d2l-my-courses-filter-clear', (e) => resolve(e));
				});
			}

			setTimeout(() => {
				component._onFilterDropdownCleared();
			}, 0);

			const event = await getEvent();
			expect(event.type).to.equal('d2l-my-courses-filter-clear');
		});
	});

});
