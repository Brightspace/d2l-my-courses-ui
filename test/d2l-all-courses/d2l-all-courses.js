describe('d2l-all-courses', function() {
	var widget,
		pinnedEnrollmentEntity,
		unpinnedEnrollmentEntity,
		clock,
		sandbox;

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

		sandbox = sinon.sandbox.create();

		widget = fixture('d2l-all-courses-fixture');
		widget.$['search-widget']._setSearchUrl = sandbox.stub();
		widget._enrollmentsSearchAction = {
			name: 'search-my-enrollments',
			href: '/enrollments/users/169',
			fields: [{
				name: 'parentOrganizations',
				value: ''
			}, {
				name: 'sort',
				value: ''
			}]
		};
		widget.updatedSortLogic = false;
		Polymer.dom.flush();
	});

	afterEach(function() {
		if (clock) {
			clock.restore();
		}
		sandbox.restore();
	});

	describe('loading spinner', function() {
		it('should show before content has loaded', function() {
			expect(widget.$$('d2l-loading-spinner:not(#lazyLoadSpinner)').hasAttribute('hidden')).to.be.false;
		});
	});

	describe('advanced search link', function() {
		it('should not render when advancedSearchUrl is not set', function() {
			widget.advancedSearchUrl = null;

			expect(widget._showAdvancedSearchLink).to.be.false;
			expect(widget.$$('.advanced-search-link').hasAttribute('hidden')).to.be.true;
		});

		it('should render when advancedSearchUrl is set', function() {
			widget.advancedSearchUrl = '/test/url';

			expect(widget._showAdvancedSearchLink).to.be.true;
			expect(widget.$$('.advanced-search-link').hasAttribute('hidden')).to.be.false;
		});
	});

	it('should return the correct value from getCourseTileItemCount (should be maximum of pinned or unpinned course count)', function() {
		widget.pinnedEnrollments = [pinnedEnrollmentEntity];
		widget.unpinnedEnrollments = [unpinnedEnrollmentEntity];

		expect(widget.$$('d2l-all-courses-segregated-content').getCourseTileItemCount()).to.equal(1);
	});

	it('should set getCourseTileItemCount on its child course-tile-grids', function() {
		widget.pinnedEnrollments = [pinnedEnrollmentEntity];
		widget.unpinnedEnrollments = [unpinnedEnrollmentEntity];

		var segregatedContent = widget.querySelectorAll('d2l-all-courses-segregated-content');
		var courseTileGrids = segregatedContent[0].querySelectorAll('d2l-course-tile-grid');
		expect(courseTileGrids.length).to.equal(2);

		for (var i = 0; i < courseTileGrids.length; i++) {
			expect(courseTileGrids[i].getCourseTileItemCount()).to.equal(1);
		}
	});

	it('should load filter menu content when filter menu is opened', function() {
		var semestersTabStub = sandbox.stub(widget.$.filterMenu.$.semestersTab, 'load');
		var departmentsTabStub = sandbox.stub(widget.$.filterMenu.$.departmentsTab, 'load');

		return widget._onFilterDropdownOpen().then(function() {
			expect(semestersTabStub.called).to.be.true;
			expect(departmentsTabStub.called).to.be.true;
		});
	});

	describe('d2l-filter-menu-change event', function() {
		it('should set the _searchUrl and filterCount', function() {
			widget.$.filterMenu.fire('d2l-filter-menu-change', {
				url: 'http://example.com',
				filterCount: 12
			});

			expect(widget._searchUrl).to.equal('http://example.com');
			expect(widget.filterCount).to.equal(12);
		});
	});

	describe('d2l-menu-item-change event', function() {
		it('should set the _searchUrl', function() {
			widget.$.sortDropdown.fire('d2l-menu-item-change', {
				value: 'LastAccessed'
			});

			expect(widget._searchUrl).to.equal('/enrollments/users/169?parentOrganizations=&sort=LastAccessed');
		});
	});

	describe('Filter text', function() {
		function fireEvents(filterCount) {
			widget.$.filterMenu.fire('d2l-filter-menu-change', {
				url: 'http://example.com',
				filterCount: filterCount
			});
			widget.$.filterDropdownContent.fire('d2l-dropdown-close', {});
		}

		it('should read "Filter" when no filters are selected', function() {
			fireEvents(0);
			expect(widget._filterText).to.equal('Filter');
		});

		it('should read "Filter: 1 filter" when any 1 filter is selected', function() {
			fireEvents(1);
			expect(widget._filterText).to.equal('Filter: 1 Filter');
		});

		it('should read "Filter: 2 filters" when any 2 filters are selected', function() {
			fireEvents(2);
			expect(widget._filterText).to.equal('Filter: 2 Filters');
		});
	});

	describe('Alerts', function() {
		it('should display appropriate message when there are no pinned enrollments', function() {
			widget.pinnedEnrollments = [];
			widget.unpinnedEnrollments = [unpinnedEnrollmentEntity];

			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).to.include({ alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' });
		});

		it('should update enrollment alerts when an enrollment is pinned', function() {
			widget._filteredPinnedEnrollments = [];
			widget._filteredUnpinnedEnrollments = [unpinnedEnrollmentEntity];
			expect(widget.$$('d2l-all-courses-segregated-content').hasFilteredPinnedEnrollments).to.equal(false);
			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).to.include({ alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' });
			var updateEnrollmentAlertsSpy = sandbox.spy(widget.$$('d2l-all-courses-segregated-content'), '_updateEnrollmentAlerts');
			widget.$$('d2l-all-courses-segregated-content').hasFilteredPinnedEnrollments = true;
			expect(updateEnrollmentAlertsSpy.called);
		});

		it('should remove all existing alerts when enrollment alerts are updated', function() {
			widget.$$('d2l-all-courses-segregated-content')._addAlert('error', 'testError', 'this is a test');
			widget.$$('d2l-all-courses-segregated-content')._addAlert('warning', 'testWarning', 'this is another test');
			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).to.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(true);
			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).to.not.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
		});

		it('should add a setCourseImageFailure warning alert when a request to set the image fails', function() {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget.setCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should not add a setCourseImageFailure warning alert when a request to set the image succeeds', function() {
			var setCourseImageEvent = { detail: { status: 'success'} };
			widget.setCourseImage(setCourseImageEvent);
			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should remove a setCourseImageFailure warning alert when a request to set the image is made', function() {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget.setCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
			setCourseImageEvent = { detail: { status: 'set'} };
			widget.setCourseImage(setCourseImageEvent);
			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should remove a setCourseImageFailure alert when the overlay is opened', function() {
			// widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$$('d2l-all-courses-segregated-content')._addAlert('warning', 'setCourseImageFailure', 'failed to do that thing it should do');
			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(widget.$$('d2l-all-courses-segregated-content')._alerts).to.not.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
		});
	});

	describe('searching messages', function() {
		it('should show no pinned courses in search message when no pinned courses in search', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$$('d2l-all-courses-segregated-content').isSearched = true;
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(false, true);
			expect(widget.$$('d2l-all-courses-segregated-content').noPinnedCoursesInSearch).to.be.true;
		});

		it('should show no pinned courses in search message when no pinned courses in filter', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$.filterMenu.fire('d2l-filter-menu-change', { filterCount: 1 });
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(false, true);
			expect(widget.$$('d2l-all-courses-segregated-content').noPinnedCoursesInSelection).to.be.true;
		});

		it('should show no unpinned courses in search message when no unpinned courses in search', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$$('d2l-all-courses-segregated-content').isSearched = true;
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(true, false);
			expect(widget.$$('d2l-all-courses-segregated-content').noUnpinnedCoursesInSearch).to.be.true;
		});

		it('should show no unpinned courses in search message when no unpinned courses in filter', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$.filterMenu.fire('d2l-filter-menu-change', { filterCount: 1 });
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(true, false);
			expect(widget.$$('d2l-all-courses-segregated-content').noUnpinnedCoursesInSelection).to.be.true;
		});

		it('should not show message when there are pinned courses in search', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$$('d2l-all-courses-segregated-content').isSearched = true;
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(true, true);
			expect(widget.$$('d2l-all-courses-segregated-content').noPinnedCoursesInSearch).to.be.false;
		});

		it('should not show message when there are pinned courses in filter', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$.filterMenu.fire('d2l-filter-menu-change', { filterCount: 1 });
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(true, true);
			expect(widget.$$('d2l-all-courses-segregated-content').noPinnedCoursesInSelection).to.be.false;
		});

		it('should not show message when there are unpinned courses in search', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$$('d2l-all-courses-segregated-content').isSearched = true;
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(true, true);
			expect(widget.$$('d2l-all-courses-segregated-content').noUnpinnedCoursesInSearch).to.be.false;
		});

		it('should not show message when there are unpinned courses in filter', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$.filterMenu.fire('d2l-filter-menu-change', { filterCount: 1 });
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(true, true);
			expect(widget.$$('d2l-all-courses-segregated-content').noUnpinnedCoursesInSelection).to.be.false;
		});

		it('should not show message if there is already an alert for no pinned courses', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$$('d2l-all-courses-segregated-content')._addAlert('call-to-action', 'noPinnedCourses', 'no pinned courses bruh');
			widget.$$('d2l-all-courses-segregated-content').isSearched = true;
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(false, true);
			expect(widget.$$('d2l-all-courses-segregated-content').noPinnedCoursesInSearch).to.be.false;
		});

		it('should not show messages if not searching', function() {
			widget.$$('d2l-all-courses-segregated-content')._clearAlerts();
			widget.$$('d2l-all-courses-segregated-content').isSearched = false;
			widget.$$('d2l-all-courses-segregated-content')._updateEnrollmentAlerts(false, false);
			expect(widget.$$('d2l-all-courses-segregated-content').noPinnedCoursesInSearch).to.be.false;
			expect(widget.$$('d2l-all-courses-segregated-content').noUnpinnedCoursesInSearch).to.be.false;
		});
	});

	describe('opening the overlay', function() {
		it('should set _searchUrl from the public property', function() {
			widget.searchUrl = '/foo';

			widget.open();

			expect(widget._searchUrl).to.match(/\/foo/);
		});

		it('should not request auto-pinned courses', function() {
			widget.searchUrl = '/foo?autoPinCourses=true';

			widget.open();

			expect(widget._searchUrl).to.match(/\/foo\?autoPinCourses=false/);
		});

		it('should initially hide content', function() {
			widget.searchUrl = '';
			widget.open();

			expect(widget._showContent).to.be.false;
		});

		it('should show content once search results have loaded', function(done) {
			window.d2lfetch.fetch = sinon.stub().returns(Promise.resolve({
				ok: true,
				json: function() {}
			}));
			var spy = sinon.spy(widget, '_onSearchResultsChanged');
			widget.searchUrl = '/foo';
			widget.open();

			setTimeout(function() {
				expect(spy).to.have.been.called;
				expect(widget._showContent).to.be.true;
				done();
			});
		});
	});

	describe('closing the overlay', function() {
		it('should clear search text', function() {
			var spy = sandbox.spy(widget, '_clearSearchWidget');
			var searchField = widget.$['search-widget'];

			searchField._searchInput = 'foo';
			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(spy.called).to.be.true;
			expect(searchField._searchInput).to.equal('');
		});

		it('should clear filters', function() {
			var spy = sandbox.spy(widget.$.filterMenu, 'clearFilters');

			widget.$.filterMenu.fire('d2l-filter-menu-change', { filterCount: 1 });
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

			widget.searchUrl = '';
			widget.load();
			widget.$$('d2l-dropdown-menu').fire('d2l-menu-item-change', event);
			expect(widget._searchUrl).to.contain('-PinDate,OrgUnitCode,OrgUnitId');

			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(spy.called).to.be.true;
		});
	});
});
