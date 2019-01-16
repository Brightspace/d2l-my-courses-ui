describe('d2l-my-courses', () => {
	var component,
		sandbox,
		enrollmentsHref = '/enrollments/users/169',
		promotedSearchHref = '/promoted-search-url',
		promotedSearchHrefMultiple = '/promoted-search-url-multiple',
		lastSearchHref = 'homepages/components/1/user-settings/169',
		searchAction = {
			name: 'search-my-enrollments',
			method: 'GET',
			href: enrollmentsHref,
			fields: [
				{ name: 'search', type: 'search', value: '' },
				{ name: 'pageSize', type: 'number', value: 20 },
				{ name: 'embedDepth', type: 'number', value: 0 },
				{ name: 'sort', type: 'text', value: 'current' },
				{ name: 'autoPinCourses', type: 'checkbox', value: false },
				{ name: 'promotePins', type: 'checkbox', value: false }
			]
		},
		searchPinnedEnrollmentsAction = {
			name: 'search-my-pinned-enrollments',
			method: 'GET',
			href: enrollmentsHref,
			fields: [
				{ name: 'search', type: 'search', value: '' },
				{ name: 'pageSize', type: 'number', value: 20 },
				{ name: 'embedDepth', type: 'number', value: 0 },
				{ name: 'sort', type: 'text', value: 'current' },
				{ name: 'autoPinCourses', type: 'checkbox', value: false },
				{ name: 'promotePins', type: 'checkbox', value: false }
			]
		},
		enrollmentsSearchResponse = {
			actions: [searchAction],
		},
		promotedSearchResponse = {
			actions: [
				{
					title: 'Department 1',
					href: '/enrollments/users/169',
					name: '6607',
					method: 'GET',
					fields: [
						{ name: 'search', type: 'search', value: '' },
						{ name: 'pageSize', type: 'number', value: 20 },
						{ name: 'embedDepth', type: 'number', value: 0 },
						{ name: 'sort', type: 'text', value: 'current' },
						{ name: 'autoPinCourses', type: 'checkbox', value: false },
						{ name: 'promotePins', type: 'checkbox', value: false },
						{ name: 'orgUnitTypeId', type: 'hidden', value: 3 }
					]
				}
			]
		},
		promotedSearchMultipleResponse = {
			actions: [
				{
					title: 'Semester 1',
					href: '/enrollments/users/169',
					name: '6607',
					method: 'GET',
					fields: [
						{ name: 'search', type: 'search', value: '' },
						{ name: 'pageSize', type: 'number', value: 20 },
						{ name: 'embedDepth', type: 'number', value: 0 },
						{ name: 'sort', type: 'text', value: 'current' },
						{ name: 'autoPinCourses', type: 'checkbox', value: false },
						{ name: 'promotePins', type: 'checkbox', value: false },
						{ name: 'orgUnitTypeId', type: 'hidden', value: 3 }
					]
				},
				{
					title: 'Semester 2',
					href: '/enrollments/users/169',
					name: '6609',
					method: 'GET',
					fields: [
						{ name: 'search', type: 'search', value: '' },
						{ name: 'pageSize', type: 'number', value: 20 },
						{ name: 'embedDepth', type: 'number', value: 0 },
						{ name: 'sort', type: 'text', value: 'current' },
						{ name: 'autoPinCourses', type: 'checkbox', value: false },
						{ name: 'promotePins', type: 'checkbox', value: false },
						{ name: 'orgUnitTypeId', type: 'hidden', value: 3 }
					]
				}
			]
		},
		lastSearchResponse = {
			properties: {
				MostRecentEnrollmentsSearchType: 0,
				MostRecentEnrollmentsSearchName: '6607'
			}
		};

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		component = fixture('d2l-my-courses-fixture');
		component.fetchSirenEntity = sandbox.stub();

		component.fetchSirenEntity.withArgs(sinon.match(enrollmentsHref))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(enrollmentsSearchResponse)));
		component.fetchSirenEntity.withArgs(sinon.match(lastSearchHref))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(lastSearchResponse)));
		component.enrollmentsUrl = enrollmentsHref;
		component.promotedSearches = promotedSearchHref;
		component.userSettingsUrl = lastSearchHref;
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should properly implement the d2l-my-courses-behavior', () => {
		expect(component.courseImageUploadCompleted).to.be.a('function');
		expect(component.getLastOrgUnitId).to.be.a('function');
		expect(component.updatedSortLogic).to.equal(false);
	});

	it('should hide the only saved search action', () => {
		component.fetchSirenEntity.withArgs(sinon.match(promotedSearchHref))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(promotedSearchResponse)));
		return component._fetchTabSearchActions()
			.then(function() {
				expect(component.fetchSirenEntity).to.be.called;
				expect(component._tabSearchActions.length).to.equal(0);
			});
	});

	it('should properly fetch default search data and hide the only saved search action', () => {
		component.fetchSirenEntity.withArgs(sinon.match(promotedSearchHref))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(promotedSearchResponse)));
		component._enrollmentsSearchAction = searchAction;
		return component._fetchTabSearchActions()
			.then(function() {
				expect(component.fetchSirenEntity).to.be.called;
				expect(component._tabSearchActions.length).to.equal(1);
			});
	});

	it('should properly fetch saved search data with two saved search actions', () => {
		component.fetchSirenEntity.withArgs(sinon.match(promotedSearchHrefMultiple))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(promotedSearchMultipleResponse)));
		component.promotedSearches = promotedSearchHrefMultiple;
		return component._fetchTabSearchActions()
			.then(function() {
				expect(component.fetchSirenEntity).to.be.called;
				expect(component._tabSearchActions.length).to.equal(2);
				expect(component._tabSearchActions[0].selected).to.be.true;
			});
	});

	it('should properly fetch default search data when set with two saved search actions', () => {
		component.fetchSirenEntity.withArgs(sinon.match(promotedSearchHrefMultiple))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(promotedSearchMultipleResponse)));
		component.promotedSearches = promotedSearchHrefMultiple;
		component._enrollmentsSearchAction = searchAction;
		return component._fetchTabSearchActions()
			.then(function() {
				expect(component.fetchSirenEntity).to.be.called;
				expect(component._tabSearchActions.length).to.equal(3);
				expect(component._tabSearchActions[1].selected).to.be.true;
			});
	});

	it('should have search pinned enrollments action and hide the only saved search action', () => {
		component.fetchSirenEntity.withArgs(sinon.match(promotedSearchHref))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(promotedSearchResponse)));
		component._enrollmentsSearchAction = searchAction;
		component._pinnedTabAction = searchPinnedEnrollmentsAction;
		return component._fetchTabSearchActions()
			.then(function() {
				expect(component.fetchSirenEntity).to.be.called;
				expect(component._tabSearchActions.length).to.equal(2);
			});
	});

	it('should have search pinned enrollments action with two saved search actions', () => {
		component.fetchSirenEntity.withArgs(sinon.match(promotedSearchHrefMultiple))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(promotedSearchMultipleResponse)));
		component.promotedSearches = promotedSearchHrefMultiple;
		component._enrollmentsSearchAction = searchAction;
		component._pinnedTabAction = searchPinnedEnrollmentsAction;
		return component._fetchTabSearchActions()
			.then(function() {
				expect(component.fetchSirenEntity).to.be.called;
				expect(component._tabSearchActions.length).to.equal(4);
				expect(component._tabSearchActions[2].selected).to.be.true;
			});
	});

	describe('Listener setup', () => {
		[
			{ eventName: 'd2l-course-enrollment-change', handler: '_onCourseEnrollmentChange' },
		].forEach(testCase => {

			it('should listen for ' + testCase.eventName + ' events', done => {
				var stub = sandbox.stub(component, testCase.handler);

				var event = new CustomEvent(testCase.eventName);
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(stub).to.have.been.called;
					done();
				});
			});

		});
	});

	it('should have updated _changedCourseEnrollment property based on the event', () => {
		[
			{ orgUnitId: 111, isPinned: true },
			{ orgUnitId: 222, isPinned: false },
		].forEach(testCase => {
			var event = {
				detail: {
					orgUnitId: testCase.orgUnitId,
					isPinned: testCase.isPinned
				}
			};

			component._changedCourseEnrollment = null;
			component._onCourseEnrollmentChange(event);
			expect(component._changedCourseEnrollment.orgUnitId).to.equal(testCase.orgUnitId);
			expect(component._changedCourseEnrollment.isPinned).to.equal(testCase.isPinned);
		});
	});

	describe('Public API', () => {
		it('should call d2l-my-courses-content-animated.courseImageUploadCompleted', done => {
			component.updatedSortLogic = false;
			flush(() => {
				var stub = sandbox.stub(component.$$('d2l-my-courses-content-animated'), 'courseImageUploadCompleted');
				component.courseImageUploadCompleted();
				expect(stub).to.have.been.called;
				done();
			});
		});

		it('should call d2l-my-courses-content.courseImageUploadCompleted', done => {
			component.updatedSortLogic = true;
			component._tabSearchActions = [{'name': 'testName', 'title': 'testTitle', 'selected': false, 'enrollmentsSearchAction': {}}];
			flush(() => {
				var stub = sandbox.stub(component.$$('d2l-my-courses-content'), 'courseImageUploadCompleted');
				component.courseImageUploadCompleted();
				expect(stub).to.have.been.called;
				done();
			});
		});

		it('should call d2l-my-courses-content-animated.getLastOrgUnitId', done => {
			component.updatedSortLogic = false;
			flush(() => {
				var stub = sandbox.stub(component.$$('d2l-my-courses-content-animated'), 'getLastOrgUnitId')
				component.getLastOrgUnitId();
				expect(stub).to.have.been.called;
				done();
			});
		});

		it('should call d2l-my-courses-content.getLastOrgUnitId', done => {
			component.updatedSortLogic = true;
			component._tabSearchActions = [{'name': 'testName', 'title': 'testTitle', 'selected': false, 'enrollmentsSearchAction': {}}];
			flush(() => {
				var stub = sandbox.stub(component.$$('d2l-my-courses-content'), 'getLastOrgUnitId');
				component.getLastOrgUnitId();
				expect(stub).to.have.been.called;
				done();
			});
		});
	});
});
