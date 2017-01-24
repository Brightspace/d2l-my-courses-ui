/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('<d2l-search-widget-custom>', function() {
	var sandbox,
		server,
		widget,
		clock,
		myEnrollmentsEntity = {
			class: ['enrollments', 'root'],
			actions: [{
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
					name: 'sortField',
					type: 'radio',
					value: ''
				}, {
					name: 'sortDescending',
					type: 'checkbox',
					value: false
				}, {
					name: 'parentOrganizations',
					type: 'hidden',
					value: ''
				}]
			}],
			links: [{
				rel: ['self'],
				href: '/enrollments'
			}]
		};

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		server = sinon.fakeServer.create();
		server.respondImmediately = true;
		server.respondWith(
			'GET',
			/\/enrollments\/users\/169*/,
			[200, {}, '{}']);

		clock = sinon.useFakeTimers();

		widget = fixture('d2l-search-widget-custom-fixture');
		widget._searchResultsCache = {};
		widget.myEnrollmentsEntity = myEnrollmentsEntity;
	});

	afterEach(function() {
		sandbox.restore();
		server.restore();
		clock.restore();
	});

	it('loads element', function() {
		expect(widget).to.exist;
	});

	it('should perform a search when sort changes', function(done) {
		widget.$.fullSearchRequest.addEventListener('iron-ajax-response', function() {
			done();
		});

		widget.set('sortField', 'courseName');

		clock.tick(501);
	});

	it('should perform a search when filter changes', function(done) {
		widget.$.fullSearchRequest.addEventListener('iron-ajax-response', function() {
			done();
		});

		widget.set('parentOrganizations', [1, 2, 3]);

		clock.tick(501);
	});

	it('should perform a search and change icon when the search icon is clicked', function(done) {
		expect(widget.$$('button > d2l-icon').getAttribute('icon')).to.contain('search');

		widget.$.fullSearchRequest.addEventListener('iron-ajax-response', function() {
			expect(widget._isSearched).to.be.true;
			expect(widget.$$('button > d2l-icon').getAttribute('icon')).to.contain('close-default');
			done();
		});

		widget.$$('button').click();
	});

	it('should perform a (clearing) search and change icon when the clear icon is clicked', function(done) {
		// Put widget into "searched" state
		widget._isSearched = true;
		widget._updateIcon();
		expect(widget.$$('button > d2l-icon').getAttribute('icon')).to.contain('close-default');

		widget.$.fullSearchRequest.addEventListener('iron-ajax-response', function() {
			expect(widget._isSearched).to.be.false;
			expect(widget.$$('button > d2l-icon').getAttribute('icon')).to.contain('search');
			done();
		});

		widget.$$('button').click();
	});

	it('should switch back to search icon when search string is updated, even if in the searched state', function(done) {
		// Don't open the dropdown when search input changes for this test rather than mocking everything
		sandbox.stub(widget.$.dropdown, 'open');

		expect(widget.$$('button > d2l-icon').getAttribute('icon')).to.contain('search');

		widget.$.fullSearchRequest.addEventListener('iron-ajax-response', function() {
			expect(widget._isSearched).to.be.true;
			expect(widget.$$('button > d2l-icon').getAttribute('icon')).to.contain('close-default');

			widget._searchInput = 'foo';
			expect(widget._isSearched).to.be.false;
			expect(widget.$$('button > d2l-icon').getAttribute('icon')).to.contain('search');
			done();
		});

		widget.$$('button').click();
	});

	it('should apply current search parameters when search button is clicked', function(done) {
		// Set new values for sort/filter fields and prevent auto-search observer from firing
		widget.sortField = 'newSortField';
		widget.parentOrganizations = [3, 2, 1];

		widget.$.fullSearchRequest.addEventListener('iron-ajax-response', function() {
			expect(widget._fullSearchUrl).to.contain('sortField=newSortField');
			expect(widget._fullSearchUrl).to.contain('parentOrganizations=3,2,1');
			done();
		});

		widget.$$('button').click();
	});

	it('only performs one search per debounce period', function() {
		var spy = sandbox.spy(widget, '__search');

		for (var i = 0; i < 20; i++) {
			widget.set('sortField', 'sortField' + i);
			clock.tick(200);
		}

		clock.tick(501);

		expect(spy.callCount).to.equal(1);
	});

	it('should fetch the content for a given URL the first time', function() {
		var stub = sandbox.stub(widget.$.fullSearchRequest, 'generateRequest');

		widget.set('_fullSearchUrl', 'foo');

		expect(stub.callCount).to.equal(1);
	});

	it('should cache search responses for a given URL', function(done) {
		var spy = sandbox.spy(widget, '__search');
		widget._searchResultsCache['foo'] = { test: 'bar' };

		document.addEventListener('d2l-search-enrollment-response', function(e) {
			expect(e.detail.test).to.equal('bar');
			expect(spy.callCount).to.equal(0);
			done();
		});

		widget.set('_fullSearchUrl', 'foo');
	});
});
