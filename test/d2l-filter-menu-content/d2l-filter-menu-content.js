/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('d2l-filter-menu-content', function() {
	var component,
		myEnrollmentsEntity;

	beforeEach(function() {
		myEnrollmentsEntity = window.D2L.Hypermedia.Siren.Parse({
			links: [
				{
					rel: ['https://api.brightspace.com/rels/semesters'],
					href: '/enrollments/semesters'
				},
				{
					rel: ['https://api.brightspace.com/rels/departments'],
					href: '/enrollments/departments'
				}
			]
		});
		component = fixture('d2l-filter-menu-content-fixture');
	});

	it('should observe changes to myEnrollmentsEntity', function() {
		var sandbox = sinon.sandbox.create();
		var spy = sandbox.spy(component, '_myEnrollmentsEntityChanged');

		component.myEnrollmentsEntity = myEnrollmentsEntity;

		expect(spy.called).to.be.true;
		expect(component._departmentsUrl).to.equal('/enrollments/departments');
		expect(component._semestersUrl).to.equal('/enrollments/semesters');

		sandbox.restore();
	});

	describe('Content', function() {
		var departmentsResponse,
			semestersResponse,
			server;

		beforeEach(function() {
			server = sinon.fakeServer.create();
			server.respondImmediately = true;
			server.respondWith(
				'GET',
				/\/enrollments\/departments/,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(departmentsResponse));
				});
			server.respondWith(
				'GET',
				/\/enrollments\/semesters/,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(semestersResponse));
				});

			component.myEnrollmentsEntity = myEnrollmentsEntity;
		});

		afterEach(function() {
			server.restore();
		});

		it('should show a spinner and hide contents until data is fetched', function(done) {
			expect(component.$$('d2l-loading-spinner').classList.contains('d2l-filter-menu-content-hidden')).to.be.false;
			departmentsResponse = { entities: [] };
			semestersResponse = { entities: [] };
			component.load();

			setTimeout(function() {
				expect(component.$$('d2l-loading-spinner').classList.contains('d2l-filter-menu-content-hidden')).to.be.true;
				done();
			});
		});
	});

	describe('Clear button', function() {
		beforeEach(function() {
			component.$$('d2l-filter-menu-content-tabbed').filterItems = [{
				rel: ['enrollment'],
				links: [{
					rel: ['self'],
					href: '/enrollments'
				}, {
					rel: ['https://api.brightspace.com/rels/organization'],
					href: '/organizations/1'
				}]
			}];
		});

		it('should be hidden when there are no filters selected', function() {
			component._currentContent().fire('d2l-filter-menu-content-filters-changed', {
				filters: []
			});

			expect(component._showClearButton).to.be.false;
			expect(component.$$('.clear-button')).to.be.null;
		});

		it('should appear when at least one filter is selected', function(done) {
			component._currentContent().fire('d2l-filter-menu-content-filters-changed', {
				filters: [1]
			});

			setTimeout(function() {
				expect(component._showClearButton).to.be.true;
				expect(component.$$('.clear-button')).to.not.be.null;
				done();
			});
		});

		it('should clear filters when clicked', function(done) {
			component._currentContent().fire('d2l-filter-menu-content-filters-changed', {
				filters: [1]
			});

			setTimeout(function() {
				component.$$('.clear-button').click();
				expect(component._showClearButton).to.be.false;
				done();
			});
		});
	});
});
