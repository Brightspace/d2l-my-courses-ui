describe('d2l-all-courses-unified-content', function() {
	var widget, sandbox;

	beforeEach(function(done) {
		sandbox = sinon.sandbox.create();
		widget = fixture('d2lAllCoursesUnifiedContentFixture');

		setTimeout(function() {
			done();
		});
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('changing enrollment entities', function() {
		[
			{ isSearched: true, totalFilterCount: 0, enrollmentsChanged: 0, noCoursesInSearch: true, noCoursesInSelection: false },
			{ isSearched: true, totalFilterCount: 0, enrollmentsChanged: 3, noCoursesInSearch: false, noCoursesInSelection: false },
			{ isSearched: false, totalFilterCount: 2, enrollmentsChanged: 0, noCoursesInSearch: false, noCoursesInSelection: true }
		].forEach(testCase => {
			it(`should set noCoursesInSearch to ${testCase.noCoursesInSearch} and noCoursesInSelection to ${testCase.noCoursesInSelection} when enrollments change to ${testCase.enrollmentsChanged}, isSearched is ${testCase.isSearched} and totalFilterCount is ${testCase.totalFilterCount}`, () => {
				widget.isSearched = testCase.isSearched;
				widget.totalFilterCount = testCase.totalFilterCount;
				widget._enrollmentsChanged(testCase.enrollmentsChanged);
				expect(widget._noCoursesInSearch).to.equal(testCase.noCoursesInSearch);
				expect(widget._noCoursesInSelection).to.equal(testCase.noCoursesInSelection);
			});
		});

		[
			{ isSearched: false, totalFilterCount: 0, enrollmentsChanged: 3, itemCount: 3 },
			{ isSearched: true, totalFilterCount: 0, enrollmentsChanged: 2, itemCount: 0 },
			{ isSearched: false, totalFilterCount: 1, enrollmentsChanged: 2, itemCount: 0 }
		].forEach(testCase => {
			it(`should set itemCount to ${testCase.itemCount} when enrollments change to ${testCase.enrollmentsChanged}, isSearched is ${testCase.isSearched} and totalFilterCount is ${testCase.totalFilterCount}`, () => {
				widget.isSearched = testCase.isSearched;
				widget.totalFilterCount = testCase.totalFilterCount;
				widget._enrollmentsChanged(testCase.enrollmentsChanged);
				expect(widget._itemCount).to.equal(testCase.itemCount);
			});
		});
	});

	describe('filtering when there are no courses', () => {
		[
			{ target: '_noCoursesInDepartment', filter: 'departments' },
			{ target: '_noCoursesInSemester', filter: 'semesters' },
			{ target: '_noCoursesInRole', filter: 'roles' }
		].forEach(testCase => {
			it(`should set ${testCase.target} when there are no enrollments and one ${testCase.filter} is filtered`, () => {
				widget.isSearched = false;
				widget.totalFilterCount = 1;
				widget.filterCounts = {};
				widget.filterCounts[testCase.filter] = 1;
				widget._enrollmentsChanged(0);
				expect(widget[testCase.target]).to.be.true;
			});
		});

		[
			{ target: '_noCoursesInDepartment', filter: 'departments' },
			{ target: '_noCoursesInSemester', filter: 'semesters' },
			{ target: '_noCoursesInRole', filter: 'roles' }
		].forEach(testCase => {
			it(`should not set ${testCase.target} when there are no enrollments and more than one ${testCase.filter} are filtered`, () => {
				widget.isSearched = false;
				widget.totalFilterCount = 1;
				widget.filterCounts = {};
				widget.filterCounts[testCase.filter] = 3;
				widget._enrollmentsChanged(0);
				expect(widget[testCase.target]).to.be.false;
			});
		});

		it('should not set empty filter messages when there are more than one filters', () => {
			widget.isSearched = false;
			widget.totalFilterCount = 4;
			widget.filterCounts = {};
			widget._enrollmentsChanged(0);
			expect(widget._noCoursesInDepartment).to.be.false;
			expect(widget._noCoursesInSemester).to.be.false;
			expect(widget._noCoursesInRole).to.be.false;
		});
	});
});
