import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { flush } from '@polymer/polymer/lib/utils/render-status.js';
import SirenParse from 'siren-parser';

describe('d2l-all-courses', function() {
	let widget,
		clock,
		sandbox,
		fetchStub,
		enrollmentsEntity;

	function fireEvent(component, eventName, detail) {
		component.dispatchEvent(
			new CustomEvent(eventName, {
				bubbles: true,
				composed: true,
				detail: detail
			})
		);
	}

	beforeEach(function(done) {
		sandbox = sinon.sandbox.create();

		widget = fixture('d2l-all-courses-fixture');

		enrollmentsEntity = {
			actions: [
				{
					name: 'search-my-departments',
					href: '/searchDepartments',
				}, {
					name: 'search-my-semesters',
					href: '/searchSemesters',
				}, {
					name: 'set-role-filters',
					href: '/setRoles',
				},
				{
					name: 'search-my-enrollments',
					href: '/enrollments/users/169',
					fields: [{
						name: 'parentOrganizations',
						value: ''
					}, {
						name: 'sort',
						value: ''
					}, {
						name: 'search',
						value: ''
					}]
				}
			],
			class: ['enrollments', 'collection']
		};

		widget._enrollmentsSearchAction = SirenParse(enrollmentsEntity).actions.find(action => action.name === 'search-my-enrollments');

		fetchStub = sandbox.stub(window.d2lfetch, 'fetch').returns(Promise.resolve({
			ok: true,
			json: function() {
				return Promise.resolve({});
			}
		}));

		function afterTabsReady() {
			widget.shadowRoot.querySelector('d2l-tabs').removeEventListener('d2l-tab-panel-selected', afterTabsReady);
			flush();
			setTimeout(() => {
				done();
			}, 0);
		}

		widget.shadowRoot.querySelector('d2l-tabs').addEventListener('d2l-tab-panel-selected', afterTabsReady);

		widget._selectedTabId = 'all-courses-tab-search-my-enrollments';
		widget.tabSearchActions = [{name: 'search-my-enrollments'}];
	});

	afterEach(function() {
		if (clock) {
			clock.restore();
		}
		sandbox.restore();
	});

	describe('Loading', function() {
		it('should show loading spinner before content has loaded', function(done) {
			widget.tabSearchActions = null;
			widget.open();
			requestAnimationFrame(() => {
				expect(widget.shadowRoot.querySelector('d2l-loading-spinner:not(#lazyLoadSpinner)').hasAttribute('hidden')).to.be.false;
				done();
			});
		});
	});

	describe('Advanced Search Link', function() {
		it('should not render when advancedSearchUrl is not set', function() {
			widget.advancedSearchUrl = null;

			expect(widget._showAdvancedSearchLink).to.be.false;
			expect(widget.shadowRoot.querySelector('.advanced-search-link').hasAttribute('hidden')).to.be.true;
		});

		it('should render when advancedSearchUrl is set', function() {
			widget.advancedSearchUrl = '/test/url';

			expect(widget._showAdvancedSearchLink).to.be.true;
			expect(widget.shadowRoot.querySelector('.advanced-search-link').hasAttribute('hidden')).to.be.false;
		});
	});

	describe('Opening the Overlay', function() {
		it('should initially hide content', function() {
			widget.open();
			expect(widget._showContent).to.be.false;
		});
	});

	describe('Alerts', function() {
		it('should show and hide the course image failure alert depending on the value of showImageError', function() {
			const alertMessage = 'Sorry, we\'re unable to change your image right now. Please try again later.';
			widget.showImageError = true;

			const alert = widget.shadowRoot.querySelector('d2l-alert');
			expect(alert.hidden).to.be.false;
			expect(alert.type).to.equal('warning');
			expect(alert.innerText).to.include(alertMessage);
			widget.showImageError = false;
			expect(alert.hidden).to.be.true;
		});
	});

	describe('Filtering', function() {
		let entity;
		beforeEach(() => {
			entity = new EnrollmentCollectionEntity(SirenParse(enrollmentsEntity));
		});
		describe('Loading', function() {
			it('should create filter categories from the enrollment entity', function() {
				widget.filterStandardSemesterName = 'Semester Filter Name';
				widget.filterStandardDepartmentName = 'Department Filter Name';
				widget._handleNewEnrollmentsEntity(entity);

				expect(widget._filterCategories.length).to.equal(3);
				expect(widget._filterCategories[0].key).to.equal('semesters');
				expect(widget._filterCategories[0].name).to.equal('Semester Filter Name');
				expect(widget._filterCategories[0].noOptionsText).to.equal('You do not have any Semester Filter Name filters.');
				expect(widget._filterCategories[0].filterAction.name).to.equal('search-my-semesters');
				expect(widget._filterCategories[0].filterAction.href).to.equal('/searchSemesters');

				expect(widget._filterCategories[1].key).to.equal('departments');
				expect(widget._filterCategories[1].name).to.equal('Department Filter Name');
				expect(widget._filterCategories[1].noOptionsText).to.equal('You do not have any Department Filter Name filters.');
				expect(widget._filterCategories[1].filterAction.name).to.equal('search-my-departments');
				expect(widget._filterCategories[1].filterAction.href).to.equal('/searchDepartments');

				expect(widget._filterCategories[2].key).to.equal('roles');
				expect(widget._filterCategories[2].name).to.equal('Roles');
				expect(widget._filterCategories[2].noOptionsText).to.equal('You do not have any Role filters.');
				expect(widget._filterCategories[2].filterAction.name).to.equal('set-role-filters');
				expect(widget._filterCategories[2].filterAction.href).to.equal('/setRoles');
			});

			it('should not create the filter categories after they have already been created', function() {
				const stub = sandbox.stub(widget, '_createFilterCategories');
				widget._filterCategories = ['category'];

				widget._handleNewEnrollmentsEntity(entity);
				expect(stub).to.not.be.called;
			});

			it('should not add a filter missing its filterAction', function() {
				entity = enrollmentsEntity;
				entity.actions = enrollmentsEntity.actions.filter(action => action.name !== 'search-my-semesters');

				widget._handleNewEnrollmentsEntity(new EnrollmentCollectionEntity(SirenParse(entity)));
				expect(widget._filterCategories.length).to.equal(2);
				expect(widget._filterCategories[0].key).to.equal('departments');
				expect(widget._filterCategories[1].key).to.equal('roles');
			});
			it('should not add the role filter if grouped by roles', function() {
				widget.tabSearchType = 'ByRoleAlias';

				widget._handleNewEnrollmentsEntity(entity);
				expect(widget._filterCategories.length).to.equal(2);
				expect(widget._filterCategories[0].key).to.equal('semesters');
				expect(widget._filterCategories[1].key).to.equal('departments');
			});
			it('should not add the semester and department filters if grouped by semester', function() {
				widget.tabSearchType = 'BySemester';

				widget._handleNewEnrollmentsEntity(entity);
				expect(widget._filterCategories.length).to.equal(1);
				expect(widget._filterCategories[0].key).to.equal('roles');
			});
			it('should not add the semester and department filters if grouped by department', function() {
				widget.tabSearchType = 'ByDepartment';

				widget._handleNewEnrollmentsEntity(entity);
				expect(widget._filterCategories.length).to.equal(1);
				expect(widget._filterCategories[0].key).to.equal('roles');
			});
		});

		describe('On Filter Change', function() {
			it('fill out the _filtersCount as necessary', function(done) {
				widget._filterCounts = {};
				fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-change', {
					categoryChanged: 'semesters',
					selectedFilters: [{
						key: 'semesters',
						selectedOptions: ['1', '2', '3']
					}, {
						key: 'roles',
						selectedOptions: []
					}]
				});
				requestAnimationFrame(() => {
					expect(widget._filterCounts.departments).to.equal(0);
					expect(widget._filterCounts.semesters).to.equal(3);
					expect(widget._filterCounts.roles).to.equal(0);
					done();
				});
			});

			[
				{ categoryChanged: 'departments' },
				{ categoryChanged: 'semesters' },
				{ categoryChanged: 'roles' }
			].forEach(testCase => {
				it(`should not set _fetchUrl if the categoryChanged is "${testCase.categoryChanged}" but its selected filters info is missing`, function(done) {
					const spy = sandbox.spy(widget, '_appendOrUpdateBustCacheQueryString');
					fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-change', {
						categoryChanged: testCase.categoryChanged,
						selectedFilters: []
					});
					requestAnimationFrame(() => {
						expect(widget._fetchUrl).to.be.null;
						expect(spy).to.not.be.called;
						done();
					});
				});
			});

			describe('Semesters and Departments', function() {
				it('applies selected semester filters', function(done) {
					fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-change', {
						categoryChanged: 'semesters',
						selectedFilters: [{
							key: 'semesters',
							selectedOptions: ['1', '2', '3']
						}, {
							key: 'roles',
							selectedOptions: ['ignored']
						}]
					});
					requestAnimationFrame(() => {
						expect(widget._fetchUrl).to.equal('/enrollments/users/169?parentOrganizations=1,2,3&sort=Current&search=&bustCache=');
						done();
					});
				});

				it('applies selected department filters', function(done) {
					fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-change', {
						categoryChanged: 'departments',
						selectedFilters: [{
							key: 'departments',
							selectedOptions: ['4', '5', '6']
						}, {
							key: 'roles',
							selectedOptions: ['ignored']
						}]
					});
					requestAnimationFrame(() => {
						expect(widget._fetchUrl).to.equal('/enrollments/users/169?parentOrganizations=4,5,6&sort=Current&search=&bustCache=');
						done();
					});
				});

				it('combines selected semester and department filters together', function(done) {
					fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-change', {
						categoryChanged: 'departments',
						selectedFilters: [{
							key: 'semesters',
							selectedOptions: ['1', '2', '3']
						}, {
							key: 'departments',
							selectedOptions: ['4', '5', '6']
						}, {
							key: 'roles',
							selectedOptions: ['ignored']
						}]
					});
					requestAnimationFrame(() => {
						expect(widget._fetchUrl).to.equal('/enrollments/users/169?parentOrganizations=1,2,3,4,5,6&sort=Current&search=&bustCache=');
						done();
					});
				});

				it('removes parentOrganizations that are no longer selected', function(done) {
					widget._enrollmentsSearchAction = {
						name: 'search-my-enrollments',
						href: '/enrollments/users/169',
						fields: [{
							name: 'parentOrganizations',
							value: '1,2,3,4,5,6'
						}, {
							name: 'roles',
							value: '456'
						}]
					};
					fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-change', {
						categoryChanged: 'semesters',
						selectedFilters: [{
							key: 'semesters',
							selectedOptions: ['1', '3']
						}, {
							key: 'departments',
							selectedOptions: []
						}, {
							key: 'roles',
							selectedOptions: ['ignored']
						}]
					});
					requestAnimationFrame(() => {
						expect(widget._fetchUrl).to.equal('/enrollments/users/169?parentOrganizations=1,3&roles=456&bustCache=');
						done();
					});
				});
			});

			describe('Roles', function() {
				let roleFiltersEntity;
				function getFilter(name, id, onOrOff) {
					return {
						rel: ['filter'],
						class: [onOrOff ? 'on' : 'off'],
						title: name,
						actions: [ onOrOff ?  {
							name: 'remove-filter',
							href: `/removeRole${id}`
						} : {
							name: 'add-filter',
							href: `/addRole${id}`
						}]
					};
				}
				beforeEach(() => {
					roleFiltersEntity = SirenParse({
						entities: [getFilter('Student', '1'), getFilter('Instructor', '2'), getFilter('Student', '3')],
						actions: [{
							name: 'apply-role-filters',
							href: '/applyRoles?sort=LastAccessed',
							fields: [{
								name: 'roles',
								value: ''
							}]
						}]
					});
				});
				it('applies selected role filters', function(done) {
					const afterFilterAdd = {...roleFiltersEntity,
						...{entities: [getFilter('Student', '1'), getFilter('Instructor', '2', true), getFilter('Student', '3')]}
					};
					afterFilterAdd.actions[0].fields[0].value = '2';
					fetchStub.withArgs(sinon.match({url: sinon.match(/\/addRole2$/)})).returns(Promise.resolve(
						new Response(new Blob([JSON.stringify(afterFilterAdd, null, 2)], {type : 'application/json'}))
					));
					widget._roleFiltersEntity = roleFiltersEntity;
					fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-change', {
						categoryChanged: 'roles',
						selectedFilters: [{
							key: 'semesters',
							selectedOptions: ['ignored']
						}, {
							key: 'roles',
							selectedOptions: ['Instructor']
						}]
					});
					setTimeout(() => {
						expect(widget._fetchUrl).to.equal('/applyRoles?sort=LastAccessed&roles=2&bustCache=');
						done();
					}, 50);
				});

				it('properly combines filters of the same name', function(done) {
					const afterFirstFilterAdd = {...roleFiltersEntity,
						...{entities: [getFilter('Student', '1', true), getFilter('Instructor', '2'), getFilter('Student', '3')]}
					};
					afterFirstFilterAdd.actions[0].fields[0].value = '1';
					const afterSecondFilterAdd = {...roleFiltersEntity,
						...{entities: [getFilter('Student', '1', true), getFilter('Instructor', '2'), getFilter('Student', '3', true)]}
					};
					afterSecondFilterAdd.actions[0].fields[0].value = '1,3';
					fetchStub.withArgs(sinon.match({url: sinon.match(/\/addRole1$/)})).returns(Promise.resolve(
						new Response(new Blob([JSON.stringify(afterFirstFilterAdd, null, 2)], {type : 'application/json'}))
					));
					fetchStub.withArgs(sinon.match({url: sinon.match(/\/addRole3$/)})).returns(Promise.resolve(
						new Response(new Blob([JSON.stringify(afterSecondFilterAdd, null, 2)], {type : 'application/json'}))
					));
					widget._roleFiltersEntity = roleFiltersEntity;
					fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-change', {
						categoryChanged: 'roles',
						selectedFilters: [{
							key: 'semesters',
							selectedOptions: ['ignored']
						}, {
							key: 'roles',
							selectedOptions: ['Student']
						}]
					});
					setTimeout(() => {
						expect(widget._fetchUrl).to.equal('/applyRoles?sort=LastAccessed&roles=1,3&bustCache=');
						done();
					}, 50);
				});

				it('removes roles that are no longer selected', function(done) {
					const roleFiltersAppliedEntity = SirenParse({
						entities: [getFilter('Student', '1', true), getFilter('Instructor', '2', true), getFilter('Student', '3', true)],
						actions: [{
							name: 'apply-role-filters',
							href: '/applyRoles?sort=LastAccessed',
							fields: [{
								name: 'roles',
								value: '1,2,3'
							}]
						}]
					});
					const afterFirstFilterRemove = {...roleFiltersAppliedEntity,
						...{entities: [getFilter('Student', '1'), getFilter('Instructor', '2', true), getFilter('Student', '3', true)]}
					};
					afterFirstFilterRemove.actions[0].fields[0].value = '2,3';
					const afterSecondFilterRemove = {...roleFiltersAppliedEntity,
						...{entities: [getFilter('Student', '1'), getFilter('Instructor', '2', true), getFilter('Student', '3')]}
					};
					afterSecondFilterRemove.actions[0].fields[0].value = '2';
					fetchStub.withArgs(sinon.match({url: sinon.match(/\/removeRole1$/)})).returns(Promise.resolve(
						new Response(new Blob([JSON.stringify(afterFirstFilterRemove, null, 2)], {type : 'application/json'}))
					));
					fetchStub.withArgs(sinon.match({url: sinon.match(/\/removeRole3$/)})).returns(Promise.resolve(
						new Response(new Blob([JSON.stringify(afterSecondFilterRemove, null, 2)], {type : 'application/json'}))
					));
					widget._roleFiltersEntity = roleFiltersAppliedEntity;
					fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-change', {
						categoryChanged: 'roles',
						selectedFilters: [{
							key: 'semesters',
							selectedOptions: ['ignored']
						}, {
							key: 'roles',
							selectedOptions: ['Instructor']
						}]
					});
					setTimeout(() => {
						expect(widget._fetchUrl).to.equal('/applyRoles?sort=LastAccessed&roles=2&bustCache=');
						done();
					}, 50);
				});
			});
		});

		describe('On Filter Clear', function() {
			it('should clear filter counts', function(done) {
				widget._filterCounts = {
					departments: 12,
					semesters: 10,
					roles: 1
				};
				fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-clear');
				requestAnimationFrame(() => {
					expect(widget._filterCounts.departments).to.equal(0);
					expect(widget._filterCounts.semesters).to.equal(0);
					expect(widget._filterCounts.roles).to.equal(0);
					done();
				});
			});

			it('should clear expected _fetchUrl params', function(done) {
				Object.assign(widget._actionParams, {
					parentOrganizations: '123',
					roles: '456',
					sort: 'LastAccessed'
				});
				widget._enrollmentsSearchAction = {
					name: 'search-my-enrollments',
					href: '/enrollments/users/169',
					fields: [{
						name: 'parentOrganizations',
						value: '123'
					}, {
						name: 'roles',
						value: '456'
					}, {
						name: 'sort',
						value: 'LastAccessed'
					}]
				};
				fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-clear');
				requestAnimationFrame(() => {
					expect(widget._fetchUrl).to.equal('/enrollments/users/169?parentOrganizations=&roles=&sort=LastAccessed&bustCache=');
					done();
				});
			});

			it('should not clear parentOrganizations param if grouped by semesters', function(done) {
				Object.assign(widget._actionParams, {
					parentOrganizations: '123',
					roles: '456'
				});
				widget.tabSearchType = 'BySemester';
				widget._enrollmentsSearchAction = {
					name: 'search-my-enrollments',
					href: '/enrollments/users/169',
					fields: [{
						name: 'parentOrganizations',
						value: '123'
					}, {
						name: 'roles',
						value: '456'
					}]
				};
				fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-clear');
				requestAnimationFrame(() => {
					expect(widget._fetchUrl).to.equal('/enrollments/users/169?parentOrganizations=123&roles=&bustCache=');
					done();
				});
			});

			it('should not clear parentOrganizations param if grouped by departments', function(done) {
				Object.assign(widget._actionParams, {
					parentOrganizations: '123',
					roles: '456'
				});
				widget.tabSearchType = 'ByDepartment';
				widget._enrollmentsSearchAction = {
					name: 'search-my-enrollments',
					href: '/enrollments/users/169',
					fields: [{
						name: 'parentOrganizations',
						value: '123'
					}, {
						name: 'roles',
						value: '456'
					}]
				};
				fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-clear');
				requestAnimationFrame(() => {
					expect(widget._fetchUrl).to.equal('/enrollments/users/169?parentOrganizations=123&roles=&bustCache=');
					done();
				});
			});

			it('should not clear roles param if grouped by role', function(done) {
				Object.assign(widget._actionParams, {
					parentOrganizations: '123',
					roles: '456'
				});
				widget.tabSearchType = 'ByRoleAlias';
				widget._enrollmentsSearchAction = {
					name: 'search-my-enrollments',
					href: '/enrollments/users/169',
					fields: [{
						name: 'parentOrganizations',
						value: '123'
					}, {
						name: 'roles',
						value: '456'
					}]
				};
				fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'd2l-my-courses-filter-clear');
				requestAnimationFrame(() => {
					expect(widget._fetchUrl).to.equal('/enrollments/users/169?parentOrganizations=&roles=456&bustCache=');
					done();
				});
			});
		});
	});

	describe('Sorting', function() {
		it('should set the _fetchUrl', function(done) {
			fireEvent(widget.shadowRoot.querySelector('d2l-sort-by-dropdown'), 'd2l-sort-by-dropdown-change', {
				value: 'LastAccessed'
			});
			requestAnimationFrame(() => {
				expect(widget._fetchUrl).to.include('/enrollments/users/169?parentOrganizations=&sort=LastAccessed&search=');
				done();
			});
		});
	});

	describe('Searching', function() {
		it('should set the _fetchUrl', function(done) {
			fireEvent(widget.shadowRoot.querySelector('d2l-my-courses-search'), 'd2l-my-courses-search-change', {
				value: 'testing'
			});
			requestAnimationFrame(() => {
				expect(widget._fetchUrl).to.include('/enrollments/users/169?parentOrganizations=&sort=Current&search=testing');
				done();
			});
		});
	});

	describe('Info Message', function() {

		describe('Changing enrollment entities', function() {
			[
				{ _isSearched: true, filterCount: 0, enrollmentsLength: 0, expectedMessage: 'noCoursesInSearch', hideMessage: false },
				{ _isSearched: true, filterCount: 0, enrollmentsLength: 3, expectedMessage: null, hideMessage: true },
				{ _isSearched: false, filterCount: 2, enrollmentsLength: 0, expectedMessage: 'noCoursesInSelection', hideMessage: false }
			].forEach(testCase => {
				it(`should set _infoMessageText to ${testCase.expectedMessage} and ${testCase.hideMessage ? 'hide' : 'show'} the message when enrollments length is ${testCase.enrollmentsLength}, _isSearched is ${testCase._isSearched} and total filter count is ${testCase.filterCount}`, () => {
					widget._isSearched = testCase._isSearched;
					widget._filterCounts = {
						departments: 0,
						semesters: testCase.filterCount,
						roles: 0
					};
					widget._updateInfoMessage(testCase.enrollmentsLength);

					expect(widget._infoMessageText).to.equal(widget.localize(testCase.expectedMessage) ? widget.localize(testCase.expectedMessage) : null);
					expect(widget.shadowRoot.querySelector('#infoMessage').hidden).to.equal(testCase.hideMessage);
				});
			});
		});

		describe('Filtering when there are no courses', () => {
			[
				{ expectedMessage: 'noCoursesInDepartment', filter: 'departments' },
				{ expectedMessage: 'noCoursesInSemester', filter: 'semesters' },
				{ expectedMessage: 'noCoursesInRole', filter: 'roles' }
			].forEach(testCase => {
				it(`should set _infoMessageText to ${testCase.expectedMessage} when there are no enrollments and one ${testCase.filter} is filtered`, () => {
					widget._isSearched = false;
					widget._filterCounts = {
						departments: 0,
						semesters: 0,
						roles: 0
					};
					widget._filterCounts[testCase.filter] = 1;
					widget._updateInfoMessage(0);

					expect(widget._infoMessageText).to.equal(widget.localize(testCase.expectedMessage));
					expect(widget.shadowRoot.querySelector('#infoMessage').hidden).to.be.false;
				});
			});

			[
				{ filter: 'departments' },
				{ filter: 'semesters' },
				{ filter: 'roles' }
			].forEach(testCase => {
				it(`should set _infoMessageText to catch-all langterm when there are no enrollments and more than one ${testCase.filter} are filtered`, () => {
					widget._isSearched = false;
					widget._filterCounts = {
						departments: 0,
						semesters: 0,
						roles: 0
					};
					widget._filterCounts[testCase.filter] = 3;
					widget._updateInfoMessage(0);

					expect(widget._infoMessageText).to.equal(widget.localize('noCoursesInSelection'));
					expect(widget.shadowRoot.querySelector('#infoMessage').hidden).to.be.false;
				});
			});

			it('should set _infoMessageText to catch-all langterm when there are more than one filters', () => {
				widget._isSearched = false;
				widget._filterCounts = {
					departments: 2,
					semesters: 0,
					roles: 2
				};
				widget._updateInfoMessage(0);

				expect(widget._infoMessageText).to.equal(widget.localize('noCoursesInSelection'));
				expect(widget.shadowRoot.querySelector('#infoMessage').hidden).to.be.false;
			});
		});
	});

	describe('Closing the Overlay', function() {

		it('should prep _actionParams for component resets', function(done) {
			Object.assign(widget._actionParams, {
				search: 'testing',
				sort: 'LastAccessed',
				parentOrganizations: '123',
				promotePins: false,
				roles: '456'
			});

			widget._onSimpleOverlayClosed();

			requestAnimationFrame(() => {
				expect(widget._actionParams.search).to.be.equal('');
				expect(widget._actionParams.sort).to.be.equal('Current');
				expect(widget._actionParams.promotePins).to.be.true;
				expect(widget._actionParams.parentOrganizations).to.equal('');
				expect(widget._actionParams.roles).to.equal('');
				done();
			});
		});

		it('should clear search text', function(done) {
			const search = widget.shadowRoot.querySelector('d2l-my-courses-search');
			const spy = sandbox.spy(search, 'clear');

			search._getSearchInput().value = 'foo';
			widget._onSimpleOverlayClosed();

			requestAnimationFrame(() => {
				expect(spy.called).to.be.true;
				expect(search._getSearchInput().value).to.equal('');
				done();
			});
		});

		it('should clear filters', function(done) {
			const spy = sandbox.spy(widget.shadowRoot.querySelector('d2l-my-courses-filter'), 'clear');

			widget._filterCounts = {
				departments: 1,
				semesters: 0,
				roles: 5
			};

			widget._onSimpleOverlayClosed();

			requestAnimationFrame(() => {
				expect(spy.called).to.be.true;
				expect(widget._filterCounts).to.deep.equal({
					departments: 0,
					semesters: 0,
					roles: 0
				});
				done();
			});
		});

		it('should clear sort', function(done) {
			const sortDropdown = widget.shadowRoot.querySelector('d2l-sort-by-dropdown');

			const event = {
				selected: true,
				value: 'OrgUnitCode'
			};

			fireEvent(sortDropdown, 'd2l-sort-by-dropdown-change', event);
			expect(widget._fetchUrl).to.contain('sort=OrgUnitCode,OrgUnitId');

			widget._onSimpleOverlayClosed();
			requestAnimationFrame(() => {
				expect(widget._fetchUrl).to.contain('sort=Current');
				done();
			});
		});
	});

	describe('Multiple Tabs', function() {

		beforeEach(function(done) {
			widget.tabSearchActions = [{
				name: 'search-my-enrollments',
				selected: false
			}, {
				name: '12345',
				title: 'Search Foo Action',
				selected: true,
				enrollmentsSearchAction: {
					name: 'search-foo',
					href: '/example/foo',
					fields: [{
						name: 'autoPinCourses',
						value: true
					}, {
						name: 'embedDepth',
						value: 0
					}, {
						name: 'sort',
						value: 'foobar'
					}, {
						name: 'search',
						value: ''
					}]
				}
			}];
			widget._enrollmentsSearchAction.getFieldByName = sandbox.stub();
			flush();
			requestAnimationFrame(() => {
				done();
			});
		});

		it('should hide tab contents when loading a tab\'s contents', function(done) {
			sandbox.stub(widget, '_computeHasMoreEnrollments');
			fetchStub.returns(Promise.resolve({})); // Simulate waiting for content fetch
			widget._showTabContent = true;
			widget.shadowRoot.querySelector('d2l-tabs').dispatchEvent(new CustomEvent('d2l-tab-panel-selected'));

			requestAnimationFrame(() => {
				expect(widget._showTabContent).to.be.false;
				done();
			});

		});

		it('should set the _fetchUrl based on the selected tab\'s action', function(done) {
			widget.shadowRoot.querySelector('d2l-tabs').dispatchEvent(new CustomEvent('d2l-tab-panel-selected'));
			requestAnimationFrame(() => {
				expect(widget._fetchUrl.indexOf('/example/foo?autoPinCourses=false&embedDepth=0&sort=Current&search=&bustCache=') !== -1).to.be.true;
				done();
			});
		});

		it('should update tabSearchActions so the correct tab is selected', function() {
			widget.tabSearchActions = widget.tabSearchActions.concat({
				name: '67890',
				title: 'Currently Selected',
				selected: false,
				enrollmentsSearchAction: {}
			});

			expect(widget.tabSearchActions[0].selected).to.be.false;
			expect(widget.tabSearchActions[1].selected).to.be.true;
			expect(widget.tabSearchActions[2].selected).to.be.false;

			widget._onTabSelected({
				type: 'd2l-tab-panel-selected',
				stopPropagation: function() {},
				composedPath: function() { return [{id: '67890'}]; }
			});

			expect(widget.tabSearchActions[0].selected).to.be.false;
			expect(widget.tabSearchActions[1].selected).to.be.false;
			expect(widget.tabSearchActions[2].selected).to.be.true;
		});
	});
});
