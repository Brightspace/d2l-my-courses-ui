describe('d2l-my-courses', () => {
	var component,
		sandbox,
		enrollmentsHref = '/enrollments/users/169',
		promotedSearchHref = '/promoted-search-url',
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
		};

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		component = fixture('d2l-my-courses-fixture');
		component.fetchSirenEntity = sandbox.stub();

		component.fetchSirenEntity.withArgs(sinon.match(enrollmentsHref))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(enrollmentsSearchResponse)));
		component.fetchSirenEntity.withArgs(sinon.match(promotedSearchHref))
			.returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse(promotedSearchResponse)));
		component.enrollmentsUrl = enrollmentsHref;
		component.promotedSearches = promotedSearchHref;
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should properly implement the d2l-my-courses-behavior', () => {
		expect(component.courseImageUploadCompleted).to.be.a('function');
		expect(component.getLastOrgUnitId).to.be.a('function');
		expect(component.updatedSortLogic).to.equal(false);
	});

	it('should properly fetch tabs data', () => {
		return component._fetchTabSearchActions()
			.then(function() {
				expect(component.fetchSirenEntity).to.be.called;
				expect(component._tabSearchActions.length).to.equal(2);
			});
	});

	describe('Public API', () => {
		it('should call d2l-my-courses-content-animated.courseImageUploadCompleted', done => {
			component.updatedSortLogic = false;
			Polymer.dom.flush();
			var stub = sandbox.stub(component.$$('d2l-my-courses-content-animated'), 'courseImageUploadCompleted');
			component.courseImageUploadCompleted();
			expect(stub).to.have.been.called;
			done();
		});

		it('should call d2l-my-courses-content.courseImageUploadCompleted', done => {
			component.updatedSortLogic = true;
			component._tabSearchActions = [{'name': 'testName', 'title': 'testTitle', 'selected': false, 'enrollmentsSearchAction': {}}];
			Polymer.dom.flush();
			var stub = sandbox.stub(component.$$('d2l-my-courses-content'), 'courseImageUploadCompleted');
			component.courseImageUploadCompleted();
			expect(stub).to.have.been.called;
			done();
		});

		it('should call d2l-my-courses-content-animated.getLastOrgUnitId', done => {
			component.updatedSortLogic = false;
			Polymer.dom.flush();
			var stub = sandbox.stub(component.$$('d2l-my-courses-content-animated'), 'getLastOrgUnitId');
			component.getLastOrgUnitId();
			expect(stub).to.have.been.called;
			done();
		});

		it('should call d2l-my-courses-content.getLastOrgUnitId', done => {
			component.updatedSortLogic = true;
			component._tabSearchActions = [{'name': 'testName', 'title': 'testTitle', 'selected': false, 'enrollmentsSearchAction': {}}];
			Polymer.dom.flush();
			var stub = sandbox.stub(component.$$('d2l-my-courses-content'), 'getLastOrgUnitId');
			component.getLastOrgUnitId();
			expect(stub).to.have.been.called;
			done();
		});
	});
});
