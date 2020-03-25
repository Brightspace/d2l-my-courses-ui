describe('<d2l-search-widget-custom>', function() {
	var sandbox,
		widget,
		clock,
		searchAction = {
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
		},
		searchFieldName = 'search';

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		clock = sinon.useFakeTimers();

		sandbox.stub(window.d2lfetch, 'fetch').returns(Promise.resolve());
		widget = fixture('d2l-search-widget-custom-fixture');
		widget._searchResultsCache = {};
		widget.searchAction = searchAction;
		widget.searchFieldName = searchFieldName;
	});

	afterEach(function() {
		sandbox.restore();
		clock.restore();
	});

	it('should perform a search when the searchUrl changes', function(done) {
		requestAnimationFrame(function() {
			var spy = sandbox.spy(widget, '_handleSearchUrlChange');
			widget.searchUrl = '/organizations/1234';
			clock.tick(501);
			expect(spy.called).to.be.true;
			done();
		});
	});
});
