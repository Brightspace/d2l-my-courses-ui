/* global describe, it, beforeEach, fixture, expect, sinon */

'use strict';

describe('d2l-filter-menu-content', function() {
	var widget,
		sandbox,
		myEnrollmentsEntity,
		enrollment,
		parser;

	beforeEach(function() {
		parser = document.createElement('d2l-siren-parser');
		myEnrollmentsEntity = parser.parse({
			actions: [{
				name: 'add-semester-filter',
				href: '/enrollments'
			}, {
				name: 'add-department-filter',
				href: '/enrollments'
			}]
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
		sandbox = sinon.sandbox.create();
		widget = fixture('d2l-filter-menu-content-fixture');
	});

	it('should observe changes to myEnrollmentsEntity', function() {
		var spy = sandbox.spy(widget, '_myEnrollmentsEntityChanged');

		widget.myEnrollmentsEntity = myEnrollmentsEntity;

		expect(spy.called).to.be.true;
		expect(widget._searchDepartmentsAction.name).to.equal('add-department-filter');
		expect(widget._searchDepartmentsAction.href).to.equal('/enrollments');
		expect(widget._searchSemestersAction.name).to.equal('add-semester-filter');
		expect(widget._searchSemestersAction.href).to.equal('/enrollments');
	});

	describe('d2l-list-item-filter', function() {
		var listItem;

		beforeEach(function() {
			listItem = fixture('d2l-list-item-filter-fixture');
		});

		it('should change icon when selected state changes', function() {
			expect(listItem.$$('d2l-icon').icon).to.equal('d2l-tier2:check-box-unchecked');

			listItem.set('selected', true);

			expect(listItem.$$('d2l-icon').icon).to.equal('d2l-tier2:check-box');
		});

		it('should fetch the organization when the enrollment changes', function() {
			var stub = sinon.stub(listItem.$$('d2l-ajax'), 'generateRequest');

			listItem.set('enrollmentEntity', parser.parse(enrollment));

			expect(stub.called).to.be.true;
			expect(listItem._organizationUrl).to.equal('/organizations/1');
		});

		it('should update text and value based off of organizations response', function(done) {
			var server = sinon.fakeServer.create();
			server.respondImmediately = true;
			server.respondWith(
				'GET',
				'/organizations/1',
				[200, '{}', JSON.stringify({
					properties: {
						name: 'foo'
					},
					links: [{
						rel: ['self'],
						href: 'bar'
					}]
				})]);

			listItem.set('enrollmentEntity', parser.parse(enrollment));

			setTimeout(function() {
				expect(listItem.text).to.equal('foo');
				expect(listItem.value).to.equal('bar');
				server.restore();
				done();
			});
		});
	});

	describe('Visibility', function() {
		it('should signal that it should be hidden if user does not have enough departments/semesters', function(done) {
			var handler = function(e) {
				expect(e.detail.hide).to.be.false;
				document.removeEventListener('d2l-filter-menu-content-hide', handler);
				done();
			};
			document.addEventListener('d2l-filter-menu-content-hide', handler);

			widget.$.departmentSearchWidget.fire('d2l-search-widget-results-changed', parser.parse({
				links: [{
					rel: ['self'],
					href: '/enrollments'
				}],
				entities: [enrollment, enrollment]
			}));
		});

		it('should signal that it should be shown if user has enough departments/semesters', function(done) {
			var handler = function(e) {
				expect(e.detail.hide).to.be.true;
				document.removeEventListener('d2l-filter-menu-content-hide', handler);
				done();
			};
			document.addEventListener('d2l-filter-menu-content-hide', handler);

			widget.$.departmentSearchWidget.fire('d2l-search-widget-results-changed', parser.parse({
				links: [{
					rel: ['self'],
					href: '/enrollments'
				}],
				entities: [enrollment]
			}));
		});
	});

	describe('Clear button', function() {
		it('should be hidden when there are no filters selected', function() {
			widget._clearFilters();

			expect(widget._showClearButton).to.be.false;
			expect(widget.$$('.clear-button')).to.be.null;
		});

		it('should appear when at least one filter is selected', function(done) {
			widget.$$('#departmentList d2l-menu').fire('d2l-menu-item-change', {
				selected: true,
				value: 'foo'
			});

			setTimeout(function() {
				expect(widget._showClearButton).to.be.true;
				expect(widget.$$('.clear-button')).to.not.be.null;
				done();
			});
		});

		it('should clear filters when clicked', function(done) {
			widget.$$('#departmentList d2l-menu').fire('d2l-menu-item-change', {
				selected: true,
				value: 'foo'
			});

			setTimeout(function() {
				widget.$$('.clear-button').click();
				expect(widget._showClearButton).to.be.false;
				done();
			});
		});
	});

	describe('Filter text', function() {
		it('should read "Filter" when no filters are selected', function() {
			widget._clearFilters();

			expect(widget.filterText).to.equal('Filter');
		});

		it('should read "Filter: 1 filter" when any 1 filter is selected', function(done) {
			widget.$$('#departmentList d2l-menu').fire('d2l-menu-item-change', {
				selected: true,
				value: 'foo'
			});

			setTimeout(function() {
				expect(widget.filterText).to.equal('Filter: 1 Filter');
				done();
			});
		});

		it('should read "Filter: 2 filters" when any 2 filters are selected', function(done) {
			widget.$$('#departmentList d2l-menu').fire('d2l-menu-item-change', {
				selected: true,
				value: 'foo'
			});
			widget.$$('#departmentList d2l-menu').fire('d2l-menu-item-change', {
				selected: true,
				value: 'bar'
			});

			setTimeout(function() {
				expect(widget.filterText).to.equal('Filter: 2 Filters');
				done();
			});
		});
	});

	describe('Lazy loading', function() {
		it('should set internal values appropriately when there are not any more departments', function(done) {
			widget.$.departmentSearchWidget.fire('d2l-search-widget-results-changed', {
				links: [{
					rel: ['self'],
					href: '/enrollments'
				}]
			});

			setTimeout(function() {
				expect(widget._hasMoreDepartments).to.be.false;
				expect(widget._moreDepartmentsUrl).to.equal('');
				done();
			});
		});

		it('should set internal values appropriately when there are more departments', function(done) {
			widget.$.departmentSearchWidget.fire('d2l-search-widget-results-changed', {
				links: [{
					rel: ['self'],
					href: '/enrollments'
				}, {
					rel: ['next'],
					href: '/enrollments?page=2'
				}]
			});

			setTimeout(function() {
				expect(widget._hasMoreDepartments).to.be.true;
				expect(widget._moreDepartmentsUrl).to.equal('/enrollments?page=2');
				done();
			});
		});

		it('should set internal values appropriately when there are not any more semesters', function(done) {
			widget.$.semesterSearchWidget.fire('d2l-search-widget-results-changed', {
				links: [{
					rel: ['self'],
					href: '/enrollments'
				}]
			});

			setTimeout(function() {
				expect(widget._hasMoreSemesters).to.be.false;
				expect(widget._moreSemestersUrl).to.equal('');
				done();
			});
		});

		it('should set internal values appropriately when there are more semesters', function(done) {
			widget.$.semesterSearchWidget.fire('d2l-search-widget-results-changed', {
				links: [{
					rel: ['self'],
					href: '/enrollments'
				}, {
					rel: ['next'],
					href: '/enrollments?page=2'
				}]
			});

			setTimeout(function() {
				expect(widget._hasMoreSemesters).to.be.true;
				expect(widget._moreSemestersUrl).to.equal('/enrollments?page=2');
				done();
			});
		});

		it('should trigger a request for more departments when the departments tab is selected', function() {
			var departmentStub = sinon.stub(widget.$.moreDepartmentsRequest, 'generateRequest');
			var semesterStub = sinon.stub(widget.$.moreSemestersRequest, 'generateRequest');
			widget._selectDepartmentList();

			widget._loadMore();

			expect(departmentStub.called).to.be.false;
			expect(semesterStub.called).to.be.false;

			widget.set('_hasMoreDepartments', true);

			widget._loadMore();

			expect(departmentStub.called).to.be.true;
			expect(semesterStub.called).to.be.false;
		});

		it('should trigger a request for more semesters when the semesters tab is selected', function() {
			var departmentStub = sinon.stub(widget.$.moreDepartmentsRequest, 'generateRequest');
			var semesterStub = sinon.stub(widget.$.moreSemestersRequest, 'generateRequest');
			widget._selectSemesterList();

			widget._loadMore();

			expect(departmentStub.called).to.be.false;
			expect(semesterStub.called).to.be.false;

			widget.set('_hasMoreSemesters', true);

			widget._loadMore();

			expect(departmentStub.called).to.be.false;
			expect(semesterStub.called).to.be.true;
		});
	});
});
