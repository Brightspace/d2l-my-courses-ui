describe('<d2l-search-widget-custom>', function() {
	var sandbox,
		clock;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		clock = sinon.useFakeTimers();

		sandbox.stub(window.d2lfetch, 'fetch').returns(Promise.resolve());
	});

	afterEach(function() {
		sandbox.restore();
		clock.restore();
	});

	it('should perform a search when the searchUrl changes', function() {
		var widget = CreateFixture();
		var spy = sandbox.spy(widget, '_onSearchUrlChanged');
		widget.searchUrl = '/organizations/1234';
		clock.tick(501);
		expect(spy.called).to.be.true;
	});

	it('only performs one search per debounce period', function() {
		var widget = CreateFixture();
		var spy = sandbox.spy(widget, '_onSearchUrlChanged');

		for (var i = 0; i < 20; i++) {
			widget.searchUrl = '/organizations/1234';
			clock.tick(200);
		}

		clock.tick(501);

		expect(spy.callCount).to.equal(1);
	});

	function CreateFixture() {
		var component = fixture('d2l-search-widget-custom-fixture');
		component._searchResultsCache = {};
		component.searchAction = {
			name: 'search-my-enrollments',
			method: 'GET',
			href: '/enrollments/users/169',
			fields: [{
				name: 'search',
				type: 'search',
				value: ''
			}, {
				name: 'pageSize',
				type: 'number',
				value: 20
			}, {
				name: 'embedDepth',
				type: 'number',
				value: 0
			}, {
				name: 'sort',
				type: 'text',
				value: 'OrgUnitName,OrgUnitId'
			}, {
				name: 'parentOrganizations',
				type: 'hidden',
				value: ''
			}]
		};
		component.searchFieldName = 'search';
		return component;
	}

});
