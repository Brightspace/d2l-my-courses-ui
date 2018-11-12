describe('d2l-all-courses', function() {
	var clock,
		sandbox;
	var pinnedEnrollmentJson = {
		class: ['pinned', 'enrollment'],
		rel: ['https://api.brightspace.com/rels/user-enrollment'],
		links: [{
			rel: ['self'],
			href: '/enrollments/users/169/organizations/1'
		}, {
			rel: ['https://api.brightspace.com/rels/organization'],
			href: '/organizations/123'
		}]
	};
	var unpinnedEnrollmentJson = {
		class: ['unpinned', 'enrollment'],
		rel: ['https://api.brightspace.com/rels/user-enrollment'],
		links: [{
			rel: ['self'],
			href: '/enrollments/users/169/organizations/1'
		}, {
			rel: ['https://api.brightspace.com/rels/organization'],
			href: '/organizations/123'
		}]
	};

	function getFixture() {
		var widget = fixture('d2l-all-courses-fixture');
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

		return widget;
	}

	beforeEach(function(done) {
		sandbox = sinon.sandbox.create();

		setTimeout(function() {
			done();
		});
	});

	afterEach(function() {
		if (clock) {
			clock.restore();
		}
		sandbox.restore();
	});

	it('loading spinner should show before content has loaded', function() {
		var widget = getFixture();
		widget.$['search-widget']._setSearchUrl = sandbox.stub();
		expect(widget.$$('d2l-loading-spinner:not(#lazyLoadSpinner)').hasAttribute('hidden')).to.be.false;
	});

	describe('advanced search link', function() {
		it('should not render when advancedSearchUrl is not set', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			Polymer.dom.flush();
			widget.advancedSearchUrl = null;

			expect(widget._showAdvancedSearchLink).to.be.false;
			expect(widget.$$('.advanced-search-link').hasAttribute('hidden')).to.be.true;
		});

		it('should render when advancedSearchUrl is set', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			Polymer.dom.flush();
			widget.advancedSearchUrl = '/test/url';

			expect(widget._showAdvancedSearchLink).to.be.true;
			expect(widget.$$('.advanced-search-link').hasAttribute('hidden')).to.be.false;
		});
	});

	it('should return the correct value from getCourseTileItemCount (should be maximum of pinned or unpinned course count)', function() {
		var widget = getFixture();
		widget.$['search-widget']._setSearchUrl = sandbox.stub();

		widget._filteredPinnedEnrollments = [window.D2L.Hypermedia.Siren.Parse(pinnedEnrollmentJson)];
		widget._filteredUnpinnedEnrollments = [window.D2L.Hypermedia.Siren.Parse(unpinnedEnrollmentJson)];

		expect(widget.$$('d2l-all-courses-segregated-content').getCourseTileItemCount()).to.equal(1);
	});

	it('should set getCourseTileItemCount on its child course-tile-grids', function() {
		var widget = getFixture();
		widget.$['search-widget']._setSearchUrl = sandbox.stub();
		widget._filteredPinnedEnrollments = [window.D2L.Hypermedia.Siren.Parse(pinnedEnrollmentJson)];
		widget._filteredUnpinnedEnrollments = [window.D2L.Hypermedia.Siren.Parse(unpinnedEnrollmentJson)];
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
		var widget = getFixture();
		widget.$['search-widget']._setSearchUrl = sandbox.stub();
		var semestersTabStub = sandbox.stub(widget.$.filterMenu.$.semestersTab, 'load');
		var departmentsTabStub = sandbox.stub(widget.$.filterMenu.$.departmentsTab, 'load');

		return widget._onFilterDropdownOpen().then(function() {
			expect(semestersTabStub.called).to.be.true;
			expect(departmentsTabStub.called).to.be.true;
		});
	});

	describe('d2l-filter-menu-change event', function() {
		it('should set the _searchUrl and filterCounts', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
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
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			widget.$.sortDropdown.fire('d2l-menu-item-change', {
				value: 'LastAccessed'
			});

			expect(widget._searchUrl).to.include('/enrollments/users/169?parentOrganizations=&sort=LastAccessed');
		});

	});

	describe('Filter text', function() {
		function fireEvents(widget, filterCount) {
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
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			fireEvents(widget, 0);
			expect(widget._filterText).to.equal('Filter');
		});

		it('should read "Filter: 1 filter" when any 1 filter is selected', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			fireEvents(widget, 1);
			expect(widget._filterText).to.equal('Filter: 1 Filter');
		});

		it('should read "Filter: 2 filters" when any 2 filters are selected', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			fireEvents(widget, 2);
			expect(widget._filterText).to.equal('Filter: 2 Filters');
		});
	});

	describe('Alerts', function() {
		var setCourseImageFailureAlert = { alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' };

		it('should remove a setCourseImageFailure alert when the overlay is opened', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			widget._addAlert('warning', 'setCourseImageFailure', 'failed to do that thing it should do');
			expect(widget._alertsView).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(widget._alertsView).to.not.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
		});

		it('should remove and course image failure alerts before adding and new ones', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			var removeAlertSpy = sandbox.spy(widget, '_removeAlert');
			widget.setCourseImage();
			expect(removeAlertSpy.called);
		});

		it('should add an alert after setting the course image results in failure (after a timeout)', function() {
			clock = sinon.useFakeTimers();
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget.setCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alertsView).to.include(setCourseImageFailureAlert);
		});

		it('should not add a setCourseImageFailure warning alert when a request to set the image succeeds', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			var setCourseImageEvent = { detail: { status: 'success'} };
			widget.setCourseImage(setCourseImageEvent);
			expect(widget._alertsView).not.to.include(setCourseImageFailureAlert);
		});

		it('should remove a setCourseImageFailure warning alert when a request to set the image is made', function() {
			clock = sinon.useFakeTimers();
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget.setCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alertsView).to.include(setCourseImageFailureAlert);
			setCourseImageEvent = { detail: { status: 'set'} };
			widget.setCourseImage(setCourseImageEvent);
			expect(widget._alertsView).not.to.include(setCourseImageFailureAlert);
		});
	});

	describe('opening the overlay', function() {
		it('should initially hide content', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			widget.open();
			expect(widget._showContent).to.be.false;
		});
	});

	describe('closing the overlay', function() {

		it('should clear search text', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			var spy = sandbox.spy(widget, '_clearSearchWidget');
			var searchField = widget.$['search-widget'];

			searchField._searchInput = 'foo';
			widget.$$('d2l-simple-overlay')._renderOpened();
			expect(spy.called).to.be.true;
			expect(searchField._searchInput).to.equal('');
		});

		it('should clear filters', function() {
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
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
			var widget = getFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
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
		function getTabbedFixture() {
			var widget = getFixture();
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
			return widget;
		}

		it('should hide tab contents when loading a tab\'s contents', function() {
			var widget = getTabbedFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			widget._showTabContent = true;

			widget._onTabSelected({
				target: { id: 'all-courses-tab-12345' },
				stopPropagation: function() {}
			});

			expect(widget._showTabContent).to.be.false;
		});

		it('should set the _searchUrl based on the selected tab\'s action', function() {
			var widget = getTabbedFixture();
			widget.$['search-widget']._setSearchUrl = sandbox.stub();
			widget._sortParameter = 'SortOrder';

			widget._onTabSelected({
				target: { id: 'all-courses-tab-12345' },
				stopPropagation: function() {}
			});

			expect(widget._searchUrl).to.equal('/example/foo?autoPinCourses=false&embedDepth=0&sort=SortOrder&search=');
		});
	});

});
