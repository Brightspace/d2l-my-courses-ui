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
		widget._filteredPinnedEnrollments = [pinnedEnrollmentEntity];
		widget._filteredUnpinnedEnrollments = [unpinnedEnrollmentEntity];

		expect(widget.$$('d2l-all-courses-segregated-content').getCourseTileItemCount()).to.equal(1);
	});

	it('should set getCourseTileItemCount on its child course-tile-grids', function() {
		widget._filteredPinnedEnrollments = [pinnedEnrollmentEntity];
		widget._filteredUnpinnedEnrollments = [unpinnedEnrollmentEntity];
		var courseTileGrids;
		var segregatedContent = widget.$$('d2l-all-courses-segregated-content');
		if (segregatedContent.shadowRoot) {
			courseTileGrids = segregatedContent.shadowRoot.querySelectorAll('d2l-course-tile-grid');
		} else {
			courseTileGrids = segregatedContent.querySelectorAll('d2l-course-tile-grid');
		}
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
		it('should set the _searchUrl and filterCounts', function() {
			widget.$.filterMenu.fire('d2l-filter-menu-change', {
				url: 'http://example.com',
				filterCounts: {
					departments: 12,
					semesters: 0,
					roles: 0
				}
			});

			expect(widget._searchUrl).to.equal('http://example.com');
			expect(widget._totalFilterCount).to.equal(12);
		});
	});

	describe('d2l-menu-item-change event', function() {
		it('should set the _searchUrl', function() {
			widget.$.sortDropdown.fire('d2l-menu-item-change', {
				value: 'LastAccessed'
			});

			expect(widget._searchUrl).to.include('/enrollments/users/169?parentOrganizations=&sort=LastAccessed');
		});

	});

	describe('Filter text', function() {
		function fireEvents(filterCount) {
			widget.$.filterMenu.fire('d2l-filter-menu-change', {
				url: 'http://example.com',
				filterCounts: {
					departments: filterCount,
					semesters: 0,
					roles: 0
				}
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
		var setCourseImageFailureAlert = { alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' };

		it('should remove a setCourseImageFailure alert when the overlay is opened', function() {
			widget._addAlert('warning', 'setCourseImageFailure', 'failed to do that thing it should do');
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(widget._alerts).to.not.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
		});

		it('should remove and course image failure alerts before adding and new ones', function() {
			var removeAlertSpy = sandbox.spy(widget, '_removeAlert');
			widget.setCourseImage();
			expect(removeAlertSpy.called);
		});

		it('should add an alert after setting the course image results in failure (after a timeout)', function() {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget.setCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alerts).to.include(setCourseImageFailureAlert);
		});

		it('should not add a setCourseImageFailure warning alert when a request to set the image succeeds', function() {
			var setCourseImageEvent = { detail: { status: 'success'} };
			widget.setCourseImage(setCourseImageEvent);
			expect(widget._alerts).not.to.include(setCourseImageFailureAlert);
		});

		it('should remove a setCourseImageFailure warning alert when a request to set the image is made', function() {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget.setCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alerts).to.include(setCourseImageFailureAlert);
			setCourseImageEvent = { detail: { status: 'set'} };
			widget.setCourseImage(setCourseImageEvent);
			expect(widget._alerts).not.to.include(setCourseImageFailureAlert);
		});
	});

	describe('opening the overlay', function() {
		it('should initially hide content', function() {
			widget.open();
			expect(widget._showContent).to.be.false;
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

			widget.$.filterMenu.fire('d2l-filter-menu-change', {
				filterCounts: {
					departments: 1,
					semesters: 0,
					roles: 0
				}
			});
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

			widget.load();
			widget.$$('d2l-dropdown-menu').fire('d2l-menu-item-change', event);
			expect(widget._searchUrl).to.contain('-PinDate,OrgUnitCode,OrgUnitId');

			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(spy.called).to.be.true;
		});

	});

	describe('Tabbed view', function() {
		beforeEach(function() {
			widget.updatedSortLogic = true;
			widget.tabSearchActions = [{
				name: '12345',
				title: 'Search Foo Action',
				selected: false,
				enrollmentsSearchAction: {
					name: 'search-foo',
					href: '/example/foo',
					fields: [{
						name: 'autoPinCourses',
						value: true
					}, {
						name: 'embedDepth',
						value: 0
					}, {
						name: 'sort',
						value: 'foobar'
					}, {
						name: 'search',
						value: ''
					}]
				}
			}];
			widget._enrollmentsSearchAction.getFieldByName = sandbox.stub();
			Polymer.dom.flush();
		});

		it('should hide tab contents when loading a tab\'s contents', function() {
			widget._showTabContent = true;

			widget._onTabSelected({
				target: { id: 'all-courses-tab-12345' },
				stopPropagation: function() {}
			});

			expect(widget._showTabContent).to.be.false;
		});

		it('should set the _searchUrl based on the selected tab\'s action', function() {
			widget._sortParameter = 'SortOrder';

			widget._onTabSelected({
				target: { id: 'all-courses-tab-12345' },
				stopPropagation: function() {}
			});

			expect(widget._searchUrl).to.equal('/example/foo?autoPinCourses=false&embedDepth=1&sort=SortOrder&search=');
		});
	});

});
