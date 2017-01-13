/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('d2l-filter-menu-content', function() {
	var component,
		myEnrollmentsEntity,
		parser;

	beforeEach(function() {
		parser = document.createElement('d2l-siren-parser');
		myEnrollmentsEntity = parser.parse({
			actions: [{
				name: 'add-semester-filter',
				href: '/enrollments/semesters'
			}, {
				name: 'add-department-filter',
				href: '/enrollments/departments'
			}]
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

	describe('Visibility and content type', function() {
		var enrollment,
			departmentsResponse,
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

			enrollment = {
				rel: ['enrollment'],
				links: [{
					rel: ['self'],
					href: '/enrollments'
				}, {
					rel: ['/organization'],
					href: '/organizations/1'
				}]
			};

			component.myEnrollmentsEntity = myEnrollmentsEntity;
		});

		afterEach(function() {
			server.restore();
		});

		it('should show a spinner and hide contents until data is fetched', function(done) {
			var handler = function() {
				expect(component.$$('d2l-loading-spinner').classList.contains('d2l-filter-menu-content-hidden')).to.be.true;
				document.removeEventListener('d2l-filter-menu-content-hide', handler);
				done();
			};
			document.addEventListener('d2l-filter-menu-content-hide', handler);

			expect(component.$$('d2l-loading-spinner').classList.contains('d2l-filter-menu-content-hidden')).to.be.false;
			departmentsResponse = { entities: [] };
			semestersResponse = { entities: [] };
			component.load();
		});

		it('should signal that it should be hidden if user does not have enough departments/semesters', function(done) {
			var handler = function(e) {
				expect(e.detail.hide).to.be.true;
				document.removeEventListener('d2l-filter-menu-content-hide', handler);
				done();
			};
			document.addEventListener('d2l-filter-menu-content-hide', handler);

			departmentsResponse = { entities: [enrollment] };
			semestersResponse = { entities: [] };
			component.load();
		});

		it('should signal that it should be shown if user has enough departments/semesters', function(done) {
			var handler = function(e) {
				expect(e.detail.hide).to.be.false;
				document.removeEventListener('d2l-filter-menu-content-hide', handler);
				done();
			};
			document.addEventListener('d2l-filter-menu-content-hide', handler);

			departmentsResponse = { entities: [enrollment] };
			semestersResponse = { entities: [enrollment] };
			component.load();
		});

		it('should show a simplified menu for users with <=7 semesters + departments', function(done) {
			var handler = function() {
				var content = component._currentContent();
				expect(content.tagName).to.equal('D2L-FILTER-MENU-CONTENT-SIMPLE');
				document.removeEventListener('d2l-filter-menu-content-hide', handler);
				done();
			};
			document.addEventListener('d2l-filter-menu-content-hide', handler);

			departmentsResponse = { entities: [enrollment, enrollment, enrollment, enrollment] };
			semestersResponse = { entities: [enrollment, enrollment, enrollment] };
			component.load();
		});

		it('should show a tabbed menu for users with >7 semesters + departments', function(done) {
			var handler = function() {
				var content = component._currentContent();
				expect(content.tagName).to.equal('D2L-FILTER-MENU-CONTENT-TABBED');
				document.removeEventListener('d2l-filter-menu-content-hide', handler);
				done();
			};
			document.addEventListener('d2l-filter-menu-content-hide', handler);

			departmentsResponse = { entities: [enrollment, enrollment, enrollment, enrollment] };
			semestersResponse = { entities: [enrollment, enrollment, enrollment, enrollment] };
			component.load();
		});
	});

	describe('Clear button', function() {
		beforeEach(function() {
			component.$$('d2l-filter-menu-content-simple').filterItems = [{
				rel: ['enrollment'],
				links: [{
					rel: ['self'],
					href: '/enrollments'
				}, {
					rel: ['/organization'],
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

	describe('Filter text', function() {
		it('should read "Filter" when no filters are selected', function() {
			component._currentContent().fire('d2l-filter-menu-content-filters-changed', {
				filters: []
			});

			expect(component.filterText).to.equal('Filter');
		});

		it('should read "Filter: 1 filter" when any 1 filter is selected', function(done) {
			component.$$('d2l-filter-menu-content-tabbed').fire('d2l-filter-menu-content-filters-changed', {
				filters: [1]
			});

			setTimeout(function() {
				expect(component.filterText).to.equal('Filter: 1 Filter');
				done();
			});
		});

		it('should read "Filter: 2 filters" when any 2 filters are selected', function(done) {
			component.$$('d2l-filter-menu-content-tabbed').fire('d2l-filter-menu-content-filters-changed', {
				filters: [1, 1]
			});

			setTimeout(function() {
				expect(component.filterText).to.equal('Filter: 2 Filters');
				done();
			});
		});
	});
});
