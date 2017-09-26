/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('d2l-all-courses', function() {
	var widget,
		widgetNoAdvancedSearch,
		pinnedEnrollmentEntity,
		unpinnedEnrollmentEntity,
		clock;

	beforeEach(function() {
		pinnedEnrollmentEntity = window.D2L.Hypermedia.Siren.Parse({
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
		unpinnedEnrollmentEntity = window.D2L.Hypermedia.Siren.Parse({
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
		sinon.stub(widget.$['search-widget'], '_setSearchUrl');

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

	it('should load filter menu content when filter menu is opened', function() {
		var stub = sinon.stub(widget.$.filterMenuContent, 'load');
		widget._onFilterDropdownOpen();
		expect(stub.called).to.be.true;
	});

	describe('d2l-filter-menu-content-change', function() {
		var event = {
			filters: [1]
		};

		it('should update the parent organizations', function() {
			expect(widget._parentOrganizations.length).to.equal(0);

			widget.$$('d2l-filter-menu-content-tabbed').fire('d2l-filter-menu-content-change', event);

			expect(widget._parentOrganizations.length).to.equal(1);
		});
	});

	describe('Filter text', function() {
		it('should read "Filter" when no filters are selected', function() {
			widget.$.filterMenuContent.currentFilters = [];
			widget.$.filterDropdownContent.fire('d2l-dropdown-close', {});
			expect(widget._filterText).to.equal('Filter');
		});

		it('should read "Filter: 1 filter" when any 1 filter is selected', function() {
			widget.$.filterMenuContent.currentFilters = [1];
			widget.$.filterDropdownContent.fire('d2l-dropdown-close', {});
			expect(widget._filterText).to.equal('Filter: 1 Filter');
		});

		it('should read "Filter: 2 filters" when any 2 filters are selected', function() {
			widget.$.filterMenuContent.currentFilters = [1, 1];
			widget.$.filterDropdownContent.fire('d2l-dropdown-close', {});
			expect(widget._filterText).to.equal('Filter: 2 Filters');
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

			widget._filteredPinnedEnrollments = [];
			widget._filteredUnpinnedEnrollments = [unpinnedEnrollmentEntity];
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

	describe('searching messages', function() {
		it('should show no pinned courses in search message when no pinned courses in search', function() {
			widget._clearAlerts();
			widget.$['search-widget']._showClearIcon = true;
			widget._updateEnrollmentAlerts(false, true);
			expect(widget._noPinnedCoursesInSearch).to.be.true;
		});
		it('should show no pinned courses in search message when no pinned courses in filter', function() {
			widget._clearAlerts();
			widget._parentOrganizations = ['boop'];
			widget._updateEnrollmentAlerts(false, true);
			expect(widget._noPinnedCoursesInSelection).to.be.true;
		});
		it('should show no unpinned courses in search message when no unpinned courses in search', function() {
			widget._clearAlerts();
			widget.$['search-widget']._showClearIcon = true;
			widget._updateEnrollmentAlerts(true, false);
			expect(widget._noUnpinnedCoursesInSearch).to.be.true;
		});
		it('should show no unpinned courses in search message when no unpinned courses in filter', function() {
			widget._clearAlerts();
			widget._parentOrganizations = ['boop'];
			widget._updateEnrollmentAlerts(true, false);
			expect(widget._noUnpinnedCoursesInSelection).to.be.true;
		});
		it('should not show message when there are pinned courses in search', function() {
			widget._clearAlerts();
			widget.$['search-widget']._showClearIcon = true;
			widget._updateEnrollmentAlerts(true, true);
			expect(widget._noPinnedCoursesInSearch).to.be.false;
		});
		it('should not show message when there are pinned courses in filter', function() {
			widget._clearAlerts();
			widget._parentOrganizations = ['boop'];
			widget._updateEnrollmentAlerts(true, true);
			expect(widget._noPinnedCoursesInSelection).to.be.false;
		});
		it('should not show message when there are unpinned courses in search', function() {
			widget._clearAlerts();
			widget.$['search-widget']._showClearIcon = true;
			widget._updateEnrollmentAlerts(true, true);
			expect(widget._noUnpinnedCoursesInSearch).to.be.false;
		});
		it('should not show message when there are unpinned courses in filter', function() {
			widget._clearAlerts();
			widget._parentOrganizations = ['boop'];
			widget._updateEnrollmentAlerts(true, true);
			expect(widget._noUnpinnedCoursesInSelection).to.be.false;
		});
		it('should not show message if there is already an alert for no pinned courses', function() {
			widget._clearAlerts();
			widget._addAlert('call-to-action', 'noPinnedCourses', 'no pinned courses bruh');
			widget.$['search-widget']._showClearIcon = true;
			widget._updateEnrollmentAlerts(false, true);
			expect(widget._noPinnedCoursesInSearch).to.be.false;
		});
		it('should not show messages if not searching', function() {
			widget._clearAlerts();
			widget.$['search-widget']._showClearIcon = false;
			widget._updateEnrollmentAlerts(false, false);
			expect(widget._noPinnedCoursesInSearch).to.be.false;
			expect(widget._noUnpinnedCoursesInSearch).to.be.false;
		});
	});

	describe('closing the overlay', function() {
		var sandbox = sinon.sandbox.create();

		it('should clear search text', function() {
			var spy = sandbox.spy(widget, '_clearSearchWidget');
			var searchField = widget.$['search-widget'];

			searchField._searchInput = 'foo';
			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(spy.called).to.be.true;
			expect(searchField._searchInput).to.equal('');
		});

		it('should clear filters', function() {
			var spy = sandbox.spy(widget.$.filterMenuContent, '_clearFilters');

			widget._hasManyEnrollments = true;

			widget.$.filterMenuContent.currentFilters = [1];
			widget.$.filterDropdownContent.fire('d2l-dropdown-close', {});

			expect(widget._filterText).to.equal('Filter: 1 Filter');
			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(spy.called).to.be.true;
			expect(widget._filterText).to.equal('Filter');
		});

		it('should clear sort', function() {
			var spy = sandbox.spy(widget, '_resetSortDropdown');

			var event = {
				selected: true,
				value: 'OrgUnitCode'
			};

			var defaultValue = widget.defaultSortValue;

			widget.load();
			expect(widget._sortParameter).to.equal(widget._sortOptions[defaultValue].queryParameter);
			widget.$$('d2l-dropdown-menu').fire('d2l-menu-item-change', event);
			expect(widget._sortParameter).to.equal(widget._sortOptions[event.value].queryParameter);

			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(spy.called).to.be.true;
			expect(widget._sortParameter).to.equal(widget._sortOptions[defaultValue].queryParameter);
		});
	});
});
