/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('d2l-all-courses', function() {
	var widget,
		widgetNoAdvancedSearch,
		pinnedEnrollmentEntity,
		unpinnedEnrollmentEntity,
		clock;

	beforeEach(function() {
		var parser = document.createElement('d2l-siren-parser');
		pinnedEnrollmentEntity = parser.parse({
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
		unpinnedEnrollmentEntity = parser.parse({
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

		clock = sinon.useFakeTimers();

		widget = fixture('d2l-all-courses-fixture');
		sinon.stub(widget.$['search-widget'], '_search');

		widgetNoAdvancedSearch = fixture('d2l-all-courses-without-advanced-search-fixture');
	});

	afterEach(function() {
		clock.restore();
	});

	describe('when the advancedSearchUrl property has not been set then', function() {
		it('should not render the advanced search link', function() {
			var link = widgetNoAdvancedSearch.querySelector('.advanced-search-link > a');
			expect(link.getAttribute('href')).to.equal(null);
			expect(widgetNoAdvancedSearch.$.advancedSearchLink.getAttribute('class')).to.contain('d2l-all-courses-hidden');
		});
	});

	describe('when the advancedSearchUrl property has been set then', function() {
		it('should render the advanced search link', function() {
			var link = widget.querySelector('.advanced-search-link > a');
			expect(link.getAttribute('href')).length.to.be.above(0);
			expect(widget.$.advancedSearchLink.getAttribute('class')).to.not.contain('d2l-all-courses-hidden');
		});
	});

	it('should return the correct value from getCourseTileItemCount (should be maximum of pinned or unpinned course count)', function() {
		widget.pinnedEnrollments = [pinnedEnrollmentEntity];
		widget.unpinnedEnrollments = [unpinnedEnrollmentEntity];

		expect(widget.getCourseTileItemCount()).to.equal(1);
	});

	it('should set getCourseTileItemCount on its child course-tile-grids', function() {
		widget.pinnedEnrollments = [pinnedEnrollmentEntity];
		widget.unpinnedEnrollments = [unpinnedEnrollmentEntity];

		var courseTileGrids = widget.querySelectorAll('d2l-course-tile-grid');
		expect(courseTileGrids.length).to.equal(2);

		for (var i = 0; i < courseTileGrids.length; i++) {
			expect(courseTileGrids[i].getCourseTileItemCount()).to.equal(1);
		}
	});

	it('should not load filter menu content when there are insufficient enrollments', function() {
		var stub = sinon.stub(widget.$.filterMenuContent, 'load');

		widget.pinnedEnrollments = Array(19).fill(pinnedEnrollmentEntity);
		widget.load();
		expect(stub.called).to.be.false;
	});

	it('should load filter menu content when there are sufficient enrollments', function() {
		var stub = sinon.stub(widget.$.filterMenuContent, 'load');

		widget.pinnedEnrollments = Array(20).fill(pinnedEnrollmentEntity);
		widget.load();
		expect(stub.called).to.be.true;
	});

	it('should hide filter menu when there are insufficient enrollments', function() {
		widget.pinnedEnrollments = Array(19).fill(pinnedEnrollmentEntity);
		widget.load();
		expect(widget.$.filterAndSort.classList.contains('d2l-all-courses-hidden')).to.be.true;
	});

	it('should show filter menu when there are sufficient enrollments', function() {
		widget.pinnedEnrollments = Array(20).fill(pinnedEnrollmentEntity);
		widget.load();

		// Class is only changed after column recalculation is done, which is done
		// in a setTimeout to allow for a DOM width to be set
		clock.tick(51);

		expect(widget.$.filterAndSort.classList.contains('d2l-all-courses-hidden')).to.be.false;
	});

	describe('d2l-filter-menu-content-change', function() {
		var event = {
			filters: [1],
			text: 'foo'
		};

		it('should update the parent organizations', function() {
			expect(widget._parentOrganizations.length).to.equal(0);

			widget.$$('d2l-filter-menu-content').fire('d2l-filter-menu-content-change', event);

			expect(widget._parentOrganizations.length).to.equal(1);
		});

		it('should update the filter menu opener text', function() {
			expect(widget._filterText).to.equal('Filter');

			widget.$$('d2l-filter-menu-content').fire('d2l-filter-menu-content-change', event);

			expect(widget._filterText).to.equal('foo');
		});
	});

	describe('d2l-filter-menu-content-hide', function() {
		it('should hide the filter if the filter contents says it should be hidden', function() {
			widget.$$('d2l-filter-menu-content').fire('d2l-filter-menu-content-hide', {
				hide: true
			});

			expect(getComputedStyle(widget.$.filterSection).display).to.equal('none');
		});

		it('should show the filter if the filter contents says it should be shown', function() {
			widget.$$('d2l-filter-menu-content').fire('d2l-filter-menu-content-hide', {
				hide: false
			});

			expect(getComputedStyle(widget.$.filterSection).display).to.not.equal('none');
		});
	});

	describe('Alerts', function() {

		it('should display appropriate message when there are no pinned enrollments', function() {
			widget.pinnedEnrollments = [];
			widget.unpinnedEnrollments = [unpinnedEnrollmentEntity];

			expect(widget._alerts).to.include({ alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' });
		});

		it('should update enrollment alerts when an enrollment is pinned', function() {
			var sandbox = sinon.sandbox.create();

			widget.filteredPinnedEnrollments = [];
			widget.filteredUnpinnedEnrollments = [unpinnedEnrollmentEntity];
			expect(widget._hasFilteredPinnedEnrollments).to.equal(false);
			expect(widget._alerts).to.include({ alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' });
			var updateEnrollmentAlertsSpy = sandbox.spy(widget, '_updateEnrollmentAlerts');
			widget._hasFilteredPinnedEnrollments = true;
			expect(updateEnrollmentAlertsSpy.called);

			sandbox.restore();
		});

		it('should remove all existing alerts when enrollment alerts are updated', function() {
			widget._addAlert('error', 'testError', 'this is a test');
			widget._addAlert('warning', 'testWarning', 'this is another test');
			expect(widget._alerts).to.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
			widget._updateEnrollmentAlerts(true);
			expect(widget._alerts).to.not.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
		});

		it('should add a setCourseImageFailure warning alert when a request to set the image fails', function() {
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget.setCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should not add a setCourseImageFailure warning alert when a request to set the image succeeds', function() {
			var setCourseImageEvent = { detail: { status: 'success'} };
			widget.setCourseImage(setCourseImageEvent);
			expect(widget._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should remove a setCourseImageFailure warning alert when a request to set the image is made', function() {
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget.setCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
			setCourseImageEvent = { detail: { status: 'set'} };
			widget.setCourseImage(setCourseImageEvent);
			expect(widget._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should remove a setCourseImageFailure alert when the overlay is opened', function() {
			widget._addAlert('warning', 'setCourseImageFailure', 'failed to do that thing it should do');
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(widget._alerts).to.not.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
		});
	});
});
