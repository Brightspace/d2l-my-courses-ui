var sandbox,
	component,
	myEnrollmentsEntity;

beforeEach(function() {
	myEnrollmentsEntity = window.D2L.Hypermedia.Siren.Parse({
		actions: [{
			name: 'search-my-semesters',
			href: '/enrollments'
		}, {
			name: 'search-my-departments',
			href: '/enrollments'
		}, {
			name: 'search-my-enrollments',
			href: '/enrollments',
			fields: [{
				name: 'parentOrganizations',
				value: ''
			}, {
				name: 'roles',
				value: ''
			}]
		}]
	});
	sandbox = sinon.sandbox.create();
	component = fixture('d2l-filter-menu-legacy-fixture');
});

afterEach(function() {
	sandbox.restore();
});

describe('d2l-filter-menu-legacy', function() {

	it('should update actions from myEnrollmentsEntity', function() {
		var spy = sandbox.spy(component, '_myEnrollmentsEntityChanged');

		component.myEnrollmentsEntity = myEnrollmentsEntity;

		expect(spy.called).to.be.true;
		expect(component._searchDepartmentsAction.name).to.equal('search-my-departments');
		expect(component._searchDepartmentsAction.href).to.equal('/enrollments');
		expect(component._searchSemestersAction.name).to.equal('search-my-semesters');
		expect(component._searchSemestersAction.href).to.equal('/enrollments');
		expect(component._searchMyEnrollmentsAction.name).to.equal('search-my-enrollments');
		expect(component._searchMyEnrollmentsAction.href).to.equal('/enrollments');
	});

	describe('setting org unit type names', function() {

		it('should set the empty state text correctly for the tabs', function() {
			component.filterStandardSemesterName = 'foo';
			component.filterStandardDepartmentName = 'bar';

			expect(component.$.semestersTab.noFiltersText).to.equal('You do not have any foo filters.');
			expect(component.$.departmentsTab.noFiltersText).to.equal('You do not have any bar filters.');
		});

		describe('tab text', function() {

			it('should render semester name', function() {
				component.filterStandardSemesterName = 'foo';

				var button = component.$.semestersTabButton;
				expect(button.innerText).to.equal('foo');
			});

			it('should render semester name with 1 filter', function() {
				component.filterStandardSemesterName = 'foo';
				component._semesterFilters = [1];

				var button = component.$.semestersTabButton;
				expect(button.innerText).to.equal('foo (1)');
			});

			it('should render department name', function() {
				component.filterStandardDepartmentName = 'foo';

				var button = component.$.departmentsTabButton;
				expect(button.innerText).to.equal('foo');
			});

			it('should render department name with 1 filter', function() {
				component.filterStandardDepartmentName = 'foo';
				component._departmentFilters = [1];

				var button = component.$.departmentsTabButton;
				expect(button.innerText).to.equal('foo (1)');
			});

			it('should render the roles name', function() {
				component.filterRolesName = 'foo';

				var button = component.$.rolesTabButton;
				expect(button.innerText).to.equal('foo');
			});

			it('should render roles name with 1 filter', function() {
				component.filterRolesName = 'foo';
				component._roleFiltersCount = 1;

				var button = component.$.rolesTabButton;
				expect(button.innerText).to.equal('foo (1)');
			});

		});

		describe('search input placeholder text', function() {

			it('should set the search placeholder text for semesters', function() {
				component.filterStandardSemesterName = 'foo';

				expect(component._semestersSearchPlaceholderText).to.equal('Search by foo');
			});

			it('should set the search placeholder text for departments', function() {
				component.filterStandardDepartmentName = 'foo';

				expect(component._departmentsSearchPlaceholderText).to.equal('Search by foo');
			});

		});

	});

	describe('clear button', function() {

		beforeEach(function() {
			component._semesterFilters = [];
			component._departmentFilters = [];
		});

		it('should be hidden when there are no filters selected', function() {
			expect(component.$$('.clear-button').getAttribute('hidden')).to.not.be.null;
		});

		it('should appear when at least one semester filter is selected', function() {
			component._semesterFilters = [1];
			component.fire('selected-filters-changed');

			expect(component.$$('.clear-button').getAttribute('hidden')).to.be.null;
		});

		it('should appear when at least one department filter is selected', function() {
			component._departmentFilters = [1];
			component.fire('selected-filters-changed');

			expect(component.$$('.clear-button').getAttribute('hidden')).to.be.null;
		});

		it('should appear when at least one roles filter is selected', function() {
			component._roleFiltersCount = 1;

			expect(component.$$('.clear-button').getAttribute('hidden')).to.be.null;
		});

		it('should clear filters when clicked', function() {
			component._semesterFilters = [1];
			component._departmentFilters = [1];
			component._roleFiltersCount = 1;
			component.fire('selected-filters-changed');

			expect(component.$$('.clear-button').getAttribute('hidden')).to.be.null;

			component.$$('.clear-button').click();
			expect(component.$$('.clear-button').getAttribute('hidden')).to.not.be.null;
			expect(component._departmentFilters).to.be.empty;
			expect(component._semesterFilters).to.be.empty;
			expect(component._roleFiltersCount).to.equal(0);
		});

		it('should generate a d2l-filter-menu-change event with filterCount = 0 when clicked', function(done) {

			component._semesterFilters = [1];
			component._departmentFilters = [1];
			component._roleFiltersCount = 1;
			component.fire('selected-filters-changed');

			component.myEnrollmentsEntity = myEnrollmentsEntity;

			var listener = function(e) {
				if (e.detail.url === '/enrollments?parentOrganizations=&roles='
					&& e.detail.filterCounts.departments === 0
					&& e.detail.filterCounts.semesters === 0
					&& e.detail.filterCounts.roles === 0) {
					component.removeEventListener('d2l-filter-menu-change', listener);
					done();
				}
			};

			component.addEventListener('d2l-filter-menu-change', listener);
			component.$$('.clear-button').click();

		});

	});

	describe('changing filters', function() {

		describe('when role filters change', function() {

			it('should update _roleFiltersCount', function() {
				component.fire('role-filters-changed', {
					url: 'http://example.com',
					filterCount: 4
				});

				expect(component._roleFiltersCount).to.equal(4);
			});

			it('should re-fire the role-filters-change event as a d2l-filter-menu-change event', function(done) {
				var listener = function(e) {
					component.removeEventListener('d2l-filter-menu-change', listener);
					expect(e.detail.url).to.equal('http://example.com');
					expect(e.detail.filterCounts.roles).to.equal(4);
					done();
				};
				component.addEventListener('d2l-filter-menu-change', listener);

				component.fire('role-filters-changed', {
					url: 'http://example.com',
					filterCount: 4
				});
			});

			it('should include departments, semesters and roles', function(done) {
				var listener = function(e) {
					component.removeEventListener('d2l-filter-menu-change', listener);
					expect(e.detail.url).to.equal('http://example.com');
					expect(e.detail.filterCounts.semesters).to.equal(1);
					expect(e.detail.filterCounts.departments).to.equal(2);
					expect(e.detail.filterCounts.roles).to.equal(4);
					done();
				};
				component.addEventListener('d2l-filter-menu-change', listener);
				component._semesterFilters = [1];
				component._departmentFilters = [1, 1];

				component.fire('role-filters-changed', {
					url: 'http://example.com',
					filterCount: 4
				});

			});

		});

		[
			{ path: '_semesterFilters', target: 'semesters', otherPath: '_departmentFilters', name: 'semester', otherName: 'departments' },
			{ path: '_departmentFilters', target: 'departments', otherPath: '_semesterFilters', name: 'department', otherName: 'semesters' }
		].forEach(function(testCase) {
			describe('when ' + testCase.name + ' filters change', function() {
				it('should fire a d2l-filter-menu-change event', function(done) {
					var listener = function(e) {
						component.removeEventListener('d2l-filter-menu-change', listener);
						expect(e.detail.url).to.equal('/enrollments?parentOrganizations=a,b&roles=');
						expect(e.detail.filterCounts[testCase.target]).to.equal(2);
						done();
					};
					component.myEnrollmentsEntity = myEnrollmentsEntity;
					component[testCase.otherPath] = [];
					component.addEventListener('d2l-filter-menu-change', listener);

					component[testCase.path] = ['a', 'b'];
					component.fire('selected-filters-changed');
				});

				it('should include ' + testCase.otherName + ' and roles in the event', function(done) {
					var listener = function(e) {
						component.removeEventListener('d2l-filter-menu-change', listener);
						expect(e.detail.url).to.equal('/enrollments?parentOrganizations=a,b&roles=');
						expect(e.detail.filterCounts[testCase.target]).to.equal(2);
						expect(e.detail.filterCounts.roles).to.equal(2);
						done();
					};
					component.myEnrollmentsEntity = myEnrollmentsEntity;
					component[testCase.otherPath] = [];
					component._roleFiltersCount = 2;
					component.addEventListener('d2l-filter-menu-change', listener);

					component[testCase.path] = ['a', 'b'];
					component.fire('selected-filters-changed');
				});

			});

		});

	});

});
