describe('d2l-all-courses-segregated-content', function() {
	var widget, sandbox, clock, pinnedEnrollmentEntity,	unpinnedEnrollmentEntity,
		pinnedEnrollmentEntity2, pinnedEnrollmentEntity3, unpinnedEnrollmentEntity2, unpinnedEnrollmentEntity3;

	beforeEach(function() {
		pinnedEnrollmentEntity = window.D2L.Hypermedia.Siren.Parse({
			class: ['pinned', 'enrollment'],
			rel: ['https://api.brightspace.com/rels/user-enrollment'],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/169/organizations/1'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: '/organizations/123'
			}]
		});
		pinnedEnrollmentEntity2 = window.D2L.Hypermedia.Siren.Parse({
			class: ['pinned', 'enrollment'],
			rel: ['https://api.brightspace.com/rels/user-enrollment'],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/169/organizations/2'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: '/organizations/123'
			}]
		});
		pinnedEnrollmentEntity3 = window.D2L.Hypermedia.Siren.Parse({
			class: ['pinned', 'enrollment'],
			rel: ['https://api.brightspace.com/rels/user-enrollment'],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/169/organizations/3'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: '/organizations/123'
			}]
		});
		unpinnedEnrollmentEntity = window.D2L.Hypermedia.Siren.Parse({
			class: ['unpinned', 'enrollment'],
			rel: ['https://api.brightspace.com/rels/user-enrollment'],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/169/organizations/1'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: '/organizations/123'
			}]
		});
		unpinnedEnrollmentEntity2 = window.D2L.Hypermedia.Siren.Parse({
			class: ['unpinned', 'enrollment'],
			rel: ['https://api.brightspace.com/rels/user-enrollment'],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/169/organizations/2'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: '/organizations/123'
			}]
		});
		unpinnedEnrollmentEntity3 = window.D2L.Hypermedia.Siren.Parse({
			class: ['unpinned', 'enrollment'],
			rel: ['https://api.brightspace.com/rels/user-enrollment'],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/169/organizations/3'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: '/organizations/123'
			}]
		});

		sandbox = sinon.sandbox.create();
		widget = fixture('d2lAllCoursesSegregatedContentFixture');
	});

	afterEach(function() {
		if (clock) {
			clock.restore();
		}
		sandbox.restore();
	});

	describe('changing enrollment entities', () => {
		it('should update the enrollments alert (_updateEnrollmentAlerts) when unpinned enrollments are updated', () => {
			var updateEnrollmentAlertsSpy = sandbox.spy(widget, '_updateEnrollmentAlerts');
			widget._filteredUnpinnedEnrollments = [];
			expect(updateEnrollmentAlertsSpy.called);
		});

		it('should update the enrollments alert (_updateEnrollmentAlerts) when pinned enrollments are updated', () => {
			var updateEnrollmentAlertsSpy = sandbox.spy(widget, '_updateEnrollmentAlerts');
			widget._filteredPinnedEnrollments = [];
			expect(updateEnrollmentAlertsSpy.called);
		});

		it('should update enrollment alerts when an enrollment is pinned', function() {
			widget._filteredPinnedEnrollments = [];
			widget._filteredUnpinnedEnrollments = [unpinnedEnrollmentEntity];
			expect(widget._hasFilteredPinnedEnrollments).to.equal(false);
			expect(widget._alertsView).to.include({ alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' });
			var updateEnrollmentAlertsSpy = sandbox.spy(widget, '_updateEnrollmentAlerts');
			widget._hasFilteredPinnedEnrollments = true;
			expect(updateEnrollmentAlertsSpy.called);
		});

		it('should remove all existing alerts when enrollment alerts are updated', function() {
			widget._addAlert('error', 'testError', 'this is a test');
			widget._addAlert('warning', 'testWarning', 'this is another test');
			expect(widget._alertsView).to.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
			widget._updateEnrollmentAlerts(true);
			expect(widget._alertsView).to.not.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
		});

		[
			{ isSearched: false, totalFilterCount: 0, hasPinnedEnrollments: false, _noPinnedCoursesInSearch: false, _noPinnedCoursesInSelection: false },
			{ isSearched: true, totalFilterCount: 0, hasPinnedEnrollments: false, _noPinnedCoursesInSearch: true, _noPinnedCoursesInSelection: false },
			{ isSearched: false, totalFilterCount: 6, hasPinnedEnrollments: false, _noPinnedCoursesInSearch: false, _noPinnedCoursesInSelection: true },
			{ isSearched: true, totalFilterCount: 6, hasPinnedEnrollments: false, _noPinnedCoursesInSearch: true, _noPinnedCoursesInSelection: false },
			{ isSearched: true, totalFilterCount: 6, hasPinnedEnrollments: true, _noPinnedCoursesInSearch: false, _noPinnedCoursesInSelection: false }
		].forEach(testCase => {
			it(`should set _noPinnedCoursesInSearch to ${testCase._noPinnedCoursesInSearch} and _noPinnedCoursesInSelection to ${testCase._noPinnedCoursesInSelection} when hasPinnedEnrollments changes to ${testCase.hasPinnedEnrollments}, isSearched is ${testCase.isSearched} and totalFilterCount is ${testCase.totalFilterCount}`, () => {
				widget._clearAlerts();
				widget.isSearched = testCase.isSearched;
				widget.totalFilterCount = testCase.totalFilterCount;
				widget._updateEnrollmentAlerts(testCase.hasPinnedEnrollments, true);
				expect(widget._noPinnedCoursesInSearch).to.equal(testCase._noPinnedCoursesInSearch);
				expect(widget._noPinnedCoursesInSelection).to.equal(testCase._noPinnedCoursesInSelection);
			});
		});

		[
			{ showAlert: true, hasPinnedEnrollments: false, isSearched: false, isFiltered: false },
			{ showAlert: false, hasPinnedEnrollments: true, isSearched: false, isFiltered: false },
			{ showAlert: false, hasPinnedEnrollments: false, isSearched: true, isFiltered: false },
			{ showAlert: false, hasPinnedEnrollments: false, isSearched: false, isFiltered: true }
		].forEach(testCase => {
			it(`should include(${testCase.showAlert}) No Pinned Courses alert when hasPinnedEnrollments(${testCase.hasPinnedEnrollments}), searched(${testCase.isSearched}) and filtered(${testCase.isFiltered})`, () => {
				widget._clearAlerts();
				widget.isSearched = testCase.isSearched;
				widget.totalFilterCount = testCase.isFiltered ? 3 : 0;
				widget._updateEnrollmentAlerts(testCase.hasPinnedEnrollments, true);
				var noPinnedCoursesAlert = { alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' };
				if (testCase.showAlert) {
					expect(widget._alertsView).to.include(noPinnedCoursesAlert);
				} else {
					expect(widget._alertsView).to.not.include(noPinnedCoursesAlert);
				}
			});
		});

		[
			{ isSearched: false, totalFilterCount: 0, hasUnpinnedEnrollments: false, _noUnpinnedCoursesInSearch: false, _noUnpinnedCoursesInSelection: false },
			{ isSearched: true, totalFilterCount: 0, hasUnpinnedEnrollments: false, _noUnpinnedCoursesInSearch: true, _noUnpinnedCoursesInSelection: false },
			{ isSearched: false, totalFilterCount: 6, hasUnpinnedEnrollments: false, _noUnpinnedCoursesInSearch: false, _noUnpinnedCoursesInSelection: true },
			{ isSearched: true, totalFilterCount: 6, hasUnpinnedEnrollments: false, _noUnpinnedCoursesInSearch: true, _noUnpinnedCoursesInSelection: false },
			{ isSearched: true, totalFilterCount: 6, hasUnpinnedEnrollments: true, _noUnpinnedCoursesInSearch: false, _noUnpinnedCoursesInSelection: false }
		].forEach(testCase => {
			it(`should set _noUnpinnedCoursesInSearch to ${testCase._noUnpinnedCoursesInSearch} and _noUnpinnedCoursesInSelection to ${testCase._noUnpinnedCoursesInSelection} when hasUnpinnedEnrollments changes to ${testCase.hasUnpinnedEnrollments}, isSearched is ${testCase.isSearched} and totalFilterCount is ${testCase.totalFilterCount}`, () => {
				widget._clearAlerts();
				widget.isSearched = testCase.isSearched;
				widget.totalFilterCount = testCase.totalFilterCount;
				widget._updateEnrollmentAlerts(true, testCase.hasUnpinnedEnrollments);
				expect(widget._noUnpinnedCoursesInSearch).to.equal(testCase._noUnpinnedCoursesInSearch);
				expect(widget._noUnpinnedCoursesInSelection).to.equal(testCase._noUnpinnedCoursesInSelection);
			});
		});

		[
			{ filteredPinnedEnrollments: 0, filteredUnpinnedEnrollments: 9, isSearched: false, isFiltered: false, itemCount: 9 },
			{ filteredPinnedEnrollments: 9, filteredUnpinnedEnrollments: 0, isSearched: false, isFiltered: false, itemCount: 9 },
			{ filteredPinnedEnrollments: 9, filteredUnpinnedEnrollments: 0, isSearched: true, isFiltered: false, itemCount: 0 },
			{ filteredPinnedEnrollments: 9, filteredUnpinnedEnrollments: 0, isSearched: false, isFiltered: true, itemCount: 0 }
		].forEach(testCase => {
			it(`should update itemCount to ${testCase.itemCount} when filteredPinnedEnrollments is ${testCase.filteredPinnedEnrollments}, filteredUnpinnedEnrollments is ${testCase.filteredUnpinnedEnrollments}, searched is (true) and filtered is (true)`, () => {
				widget._itemCount = 0;
				widget.isSearched = testCase.isSearched;
				widget.totalFilterCount = testCase.isFiltered ? 3 : 0;
				widget.filteredPinnedEnrollments = new Array(testCase.filteredPinnedEnrollments);
				widget.filteredUnpinnedEnrollments = new Array(testCase.filteredUnpinnedEnrollments);

				expect(widget._itemCount).to.equal(testCase.itemCount);
			});
		});
	});

	describe('pinning and unpinning enrollments', () => {
		it('should move to pinned list if the incoming enrollment is pinned', () => {
			widget._moveEnrollmentToPinnedList = sandbox.stub();
			var tileRemoveCompleteEvent = new CustomEvent(
				'tile-remove-complete', {
					detail: {
						pinned: true,
						enrollment: pinnedEnrollmentEntity
					}
				}
			);
			widget.dispatchEvent(tileRemoveCompleteEvent);
			expect(widget._moveEnrollmentToPinnedList.called);
		});

		it('should move to unpinned list if the incoming enrollment is unpinned', () => {
			widget._moveEnrollmentToUnpinnedList = sandbox.stub();
			var tileRemoveCompleteEvent = new CustomEvent(
				'tile-remove-complete', {
					detail: {
						pinned: false,
						enrollment: pinnedEnrollmentEntity
					}
				}
			);
			widget.dispatchEvent(tileRemoveCompleteEvent);
			expect(widget._moveEnrollmentToUnpinnedList.called);
		});

		it('should remove enrollment from filteredPinnedEnrollments and to filteredUnpinnedEnrollments when it is unpinned', () => {
			widget._setEnrollmentPinData = sandbox.stub();
			widget.filteredPinnedEnrollments = [
				pinnedEnrollmentEntity, pinnedEnrollmentEntity2, pinnedEnrollmentEntity3
			];
			widget.filteredUnpinnedEnrollments = [];
			widget._moveEnrollmentToUnpinnedList(unpinnedEnrollmentEntity);
			expect(widget.filteredPinnedEnrollments.length).to.equal(2);
			expect(widget.filteredUnpinnedEnrollments.length).to.equal(1);
		});

		it('should remove enrollment from filteredUnpinnedEnrollments and to filteredPinnedEnrollments when it is pinned', () => {
			widget._setEnrollmentPinData = sandbox.stub();
			widget.filteredUnpinnedEnrollments = [
				unpinnedEnrollmentEntity, unpinnedEnrollmentEntity2, unpinnedEnrollmentEntity3
			];
			widget.filteredPinnedEnrollments = [];
			widget._moveEnrollmentToPinnedList(pinnedEnrollmentEntity);
			expect(widget.filteredUnpinnedEnrollments.length).to.equal(2);
			expect(widget.filteredPinnedEnrollments.length).to.equal(1);
		});
	});

	describe('filtering when there are no courses', () => {
		[
			{ target: '_noPinnedCoursesInDepartment', filter: 'departments' },
			{ target: '_noPinnedCoursesInSemester', filter: 'semesters' },
			{ target: '_noPinnedCoursesInRole', filter: 'roles' },
			{ target: '_noUnpinnedCoursesInDepartment', filter: 'departments' },
			{ target: '_noUnpinnedCoursesInSemester', filter: 'semesters' },
			{ target: '_noUnpinnedCoursesInRole', filter: 'roles' }
		].forEach(testCase => {
			it(`should set ${testCase.target} when there are no enrollments and one ${testCase.filter} is filtered`, () => {
				widget._clearAlerts();
				widget.isSearched = false;
				widget.totalFilterCount = 1;
				widget.filterCounts = {};
				widget.filterCounts[testCase.filter] = 1;
				widget._updateEnrollmentAlerts(false, false);
				expect(widget[testCase.target]).to.be.true;
			});
		});

		[
			{ target: '_noPinnedCoursesInDepartment', filter: 'departments' },
			{ target: '_noPinnedCoursesInSemester', filter: 'semesters' },
			{ target: '_noPinnedCoursesInRole', filter: 'roles' },
			{ target: '_noUnpinnedCoursesInDepartment', filter: 'departments' },
			{ target: '_noUnpinnedCoursesInSemester', filter: 'semesters' },
			{ target: '_noUnpinnedCoursesInRole', filter: 'roles' }
		].forEach(testCase => {
			it(`should set ${testCase.target} when there are no enrollments and one ${testCase.filter} is filtered`, () => {
				widget._clearAlerts();
				widget.isSearched = false;
				widget.totalFilterCount = 1;
				widget.filterCounts = {};
				widget.filterCounts[testCase.filter] = 3;
				widget._updateEnrollmentAlerts(false, false);
				expect(widget[testCase.target]).to.be.false;
			});
		});

		it('should not set empty filter messages when there are more than one filters', () => {
			widget.isSearched = false;
			widget.totalFilterCount = 4;
			widget.filterCounts = {};
			widget._updateEnrollmentAlerts(false, false);
			expect(widget._noPinnedCoursesInDepartment).to.be.false;
			expect(widget._noPinnedCoursesInSemester).to.be.false;
			expect(widget._noPinnedCoursesInRole).to.be.false;
			expect(widget._noUnpinnedCoursesInDepartment).to.be.false;
			expect(widget._noUnpinnedCoursesInSemester).to.be.false;
			expect(widget._noUnpinnedCoursesInRole).to.be.false;
		});
	});
});
