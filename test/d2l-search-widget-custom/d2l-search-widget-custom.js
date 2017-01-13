/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('<d2l-search-widget-custom>', function() {
	var server,
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

		server = sinon.fakeServer.create();
		server.respondImmediately = true;
		server.respondWith(
			'GET',
			/\/enrollments\/users\/169*/,
			[200, {}, '{}']);

		clock = sinon.useFakeTimers();

		widget = fixture('d2l-search-widget-custom-fixture');
		widget.myEnrollmentsEntity = myEnrollmentsEntity;

	});

	afterEach(function() {

		server.restore();
		clock.restore();

	});

	it('loads element', function() {

		expect(widget).to.exist;

	});

	it('should perform a search when sort changes', function(done) {

		widget.$.searchRequestTiles.addEventListener('iron-ajax-response', function() {
			done();
		});

		widget.set('sortField', 'courseName');

		clock.tick(501);

	});

	it('should perform a search when filter changes', function(done) {

		widget.$.searchRequestTiles.addEventListener('iron-ajax-response', function() {
			done();
		});

		widget.set('parentOrganizations', [1, 2, 3]);

		clock.tick(501);

	});

	it('should perform a search using the current search parameters when clearing the search box', function(done) {

		// Set new values for sort/filter fields and prevent auto-search observer from firing
		widget.isAttached = false;
		widget.sortField = 'newSortField';
		widget.parentOrganizations = [3, 2, 1];
		widget.isAttached = true;

		widget.$.searchRequestTiles.addEventListener('iron-ajax-response', function() {
			expect(/sortField=newSortField/.exec(widget._searchUrlTiles).length).to.equal(1);
			expect(/parentOrganizations=3,2,1/.exec(widget._searchUrlTiles).length).to.equal(1);
			done();
		});

		widget.$$('.clear-search-button').click();

	});

	it('only performs one search per debounce period', function() {

		widget._search = sinon.spy();

		for (var i = 0; i < 20; i++) {
			widget.set('sortField', 'sortField' + i);
			clock.tick(200);
		}

		clock.tick(501);

		expect(widget._search.callCount).to.equal(1);

	});
});
