describe('d2l-my-courses-content', () => {
	var sandbox,
		clock,
		component,
		fetchStub,
		searchAction,
		miniSearchAction,
		enrollmentEntity,
		enrollmentsRootEntity,
		miniEnrollmentsRootEntity,
		enrollmentsSearchEntity,
		enrollmentsSearchPageTwoEntity,
		organizationEntity,
		oneEnrollmentSearchEntity,
		organizationEntityHydrated;

	function SetupFetchStub(url, entity) {
		fetchStub.withArgs(sinon.match.has('url', sinon.match(url)))
			.returns(Promise.resolve({
				ok: true,
				json: () => { return Promise.resolve(entity); }
			}));
	}

	beforeEach(done => {
		sandbox = sinon.sandbox.create();
		searchAction = {
			name: 'search-my-enrollments',
			method: 'GET',
			href: '/enrollments/users/169',
			fields: [
				{ name: 'search', type: 'search', value: '' },
				{ name: 'pageSize', type: 'number', value: 20 },
				{ name: 'embedDepth', type: 'number', value: 0 },
				{ name: 'sort', type: 'text', value: 'current' },
				{ name: 'autoPinCourses', type: 'checkbox', value: false },
				{ name: 'promotePins', type: 'checkbox', value: false }
			]
		},
		miniSearchAction = {
			name: 'search-my-enrollments',
			method: 'GET',
			href: '/enrollments/users/1',
			fields: [
				{ name: 'search', type: 'search', value: '' },
				{ name: 'sort', type: 'text', value: 'current' }
			]
		},
		enrollmentEntity = window.D2L.Hypermedia.Siren.Parse({
			class: ['enrollment'],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/169/organizations/1'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: '/organizations/1'
			}]
		});
		organizationEntity = window.D2L.Hypermedia.Siren.Parse({
			properties: {
				name: 'Course One'
			},
			links: [{
				rel: ['self'],
				href: '/organizations/1'
			}]
		});
		organizationEntityHydrated = window.D2L.Hypermedia.Siren.Parse({
			properties: organizationEntity.properties,
			links: organizationEntity.links,
			entities: [{
				rel: ['https://api.brightspace.com/rels/organization-image'],
				class: ['course-image'],
				properties: {
					name: 'a_beautiful_image_of_paint'
				},
				links: [{
					'class': ['tile', 'low-density', 'max'],
					'rel': ['alternate'],
					'type': 'image/jpeg',
					'href': 'https://s.brightspace.com/course-images/images/5dd1c592-cf6b-4d13-8b9f-a538c19321c9/tile-low-density-max-size.jpg'
				}]
			}]
		});
		enrollmentsRootEntity = window.D2L.Hypermedia.Siren.Parse({
			actions: [searchAction]
		});
		miniEnrollmentsRootEntity = window.D2L.Hypermedia.Siren.Parse({
			actions: [miniSearchAction]
		});
		enrollmentsSearchEntity = window.D2L.Hypermedia.Siren.Parse({
			actions: [searchAction],
			entities: [{
				rel: ['https://api.brightspace.com/rels/user-enrollment'],
				class: ['enrollment', 'pinned'],
				href: '/enrollments/users/169/organizations/1',
				links: [{
					rel: ['self'],
					href: '/enrollments/users/169/organizations/1'
				}, {
					rel: ['https://api.brightspace.com/rels/organization'],
					href: '/organizations/1'
				}]
			}],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/169'
			}, {
				rel: ['next'],
				href: '/enrollments/users/169?bookmark=2'
			}]
		});
		enrollmentsSearchPageTwoEntity = window.D2L.Hypermedia.Siren.Parse({
			actions: [searchAction],
			entities: [{
				rel: ['https://api.brightspace.com/rels/user-enrollment'],
				class: ['enrollment', 'pinned'],
				href: '/enrollments/users/169/organizations/2',
				links: [{
					rel: ['self'],
					href: '/enrollments/users/169/organizations/2'
				}, {
					rel: ['https://api.brightspace.com/rels/organization'],
					href: '/organizations/2'
				}]
			}],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/169?bookmark=2'
			}]
		});
		oneEnrollmentSearchEntity = window.D2L.Hypermedia.Siren.Parse({
			actions: [searchAction],
			entities: [{
				rel: ['https://api.brightspace.com/rels/user-enrollment'],
				class: ['enrollment'],
				href: '/enrollments/users/1/organizations/1',
				links: [{
					rel: ['self'],
					href: '/enrollments/users/1/organizations/1'
				}, {
					rel: ['https://api.brightspace.com/rels/organization'],
					href: '/organizations/1'
				}]
			}],
			links: [{
				rel: ['self'],
				href: '/enrollments/users/1'
			}]
		});

		fetchStub = sandbox.stub(window.d2lfetch, 'fetch');
		SetupFetchStub(/\/enrollments$/, enrollmentsRootEntity);
		SetupFetchStub(/\/enrollment$/, miniEnrollmentsRootEntity);
		SetupFetchStub(/\/enrollments\/users\/169\/organizations\/1/, enrollmentEntity);
		SetupFetchStub(/\/enrollments\/users\/1\/organizations\/1/, enrollmentEntity);
		SetupFetchStub(/\/enrollments\/users\/169\/organizations\/2/, enrollmentEntity);
		SetupFetchStub(/\/organizations\/1$/, organizationEntity);
		SetupFetchStub(/\/organizations\/2$/, organizationEntity);
		SetupFetchStub(/\/organizations\/3$/, organizationEntity);
		SetupFetchStub(/\/organizations\/1\?embedDepth=1$/, organizationEntityHydrated);
		SetupFetchStub(/\/organizations\/2\?embedDepth=1$/, organizationEntityHydrated);
		SetupFetchStub(/\/organizations\/3\?embedDepth=1$/, organizationEntityHydrated);
		SetupFetchStub(/\/enrollments\/users\/169.*&.*$/, enrollmentsSearchEntity);
		SetupFetchStub(/\/enrollments\/users\/1.*&.*$/, oneEnrollmentSearchEntity);
		SetupFetchStub(/\/enrollments\/users\/169.*bookmark=2/, enrollmentsSearchPageTwoEntity);

		component = fixture('d2l-my-courses-content-fixture');
		component.enrollmentsUrl = '/enrollments';
		component.enrollmentsSearchAction = enrollmentsRootEntity.actions[0];

		setTimeout(() => {
			done();
		});
	});

	afterEach(() => {
		if (clock) {
			clock.restore();
		}
		sandbox.restore();
	});

	it('should properly implement d2l-my-courses-behavior', () => {
		expect(component.courseImageUploadCompleted).to.be.a('function');
		expect(component.getLastOrgUnitId).to.be.a('function');
		expect(component.updatedSortLogic).to.exist;
		expect(component.cssGridView).to.exist;
	});

	it('should properly implement d2l-my-courses-content-behavior', () => {
		expect(component).to.exist;
		expect(component._alertsView).to.be.an.instanceof(Array);
		expect(component._existingEnrollmentsMap).to.be.an('object');
		expect(component._nextEnrollmentEntityUrl).to.be.null;
		expect(component._orgUnitIdMap).to.be.an('object');
		expect(component._setImageOrg).to.be.an('object');
		expect(component._showContent).to.exist;
	});

	it('should reset enrollments related properties', () => {
		component._lastPinnedIndex = 10;
		component._existingEnrollmentsMap = { 1234: true };
		component._enrollments = [1234];
		component._numberOfEnrollments = 10;

		component._resetEnrollments();

		expect(component._lastPinnedIndex).to.equal(-1);
		expect(component._enrollments.length).to.equal(0);
		expect(component._numberOfEnrollments).to.equal(0);
		for (var key in component._existingEnrollmentsMap) {
			expect(component._existingEnrollmentsMap.hasOwnProperty(key)).to.be.false;
		}
	});

	describe('Set Refetch Enrollment Flag', () => {
		var newValue = { orgUnitId: 1234 };
		var href = '/enrollments/users/1';
		var fields = [
			{ name: 'search', type: 'search', value: '' },
			{ name: 'sort', type: 'text', value: 'current' }
		];

		beforeEach(() => {
			component._isRefetchNeeded = false;
			component._orgUnitIdMap = {};
			component.enrollmentsSearchAction = {
				name: 'test',
				href: href,
				fields: fields
			};
		});

		it('should set refetch when course enrollment changed and it is all tab', () => {
			component.enrollmentsSearchAction = {
				name: 'search-my-enrollments',
				href: href,
				fields: fields
			};
			component._onCourseEnrollmentChange(newValue);
			expect(component._isRefetchNeeded).to.be.true;
		});

		it('should set refetch when course enrollment changed and it is pinned tab', () => {
			component.enrollmentsSearchAction = {
				name: 'search-my-pinned-enrollments',
				href: href,
				fields: fields
			};
			component._onCourseEnrollmentChange(newValue);
			expect(component._isRefetchNeeded).to.be.true;
		});

		it('should set refetch when course enrollment changed and the search action contains this enrollment', () => {
			component._orgUnitIdMap = { 1234: true };
			component._onCourseEnrollmentChange(newValue);
			expect(component._isRefetchNeeded).to.be.true;
		});

		it('should not set refetch for other tabs', () => {
			component._onCourseEnrollmentChange(newValue);
			expect(component._isRefetchNeeded).to.be.false;
		});
	});

	describe('Tile grid', () => {
		beforeEach((done) => {
			component._fetchRoot();
			setTimeout(done, 300);
		});

		it('should set the columns-"n" class on the correct tile grid on resize', done => {
			var listener = () => {
				window.removeEventListener('resize', listener);

				setTimeout(() => {
					var courseTileGrid = component.$$('.course-tile-grid');
					expect(courseTileGrid.classList.toString()).to.contain('columns-');
					done();
				}, 500);
			};

			window.addEventListener('resize', listener);

			window.dispatchEvent(new Event('resize'));
		});

		it('should call refreshImage on each course image tile in courseImageUploadCompleted', () => {
			var courseTiles;
			if (component.shadowRoot) {
				courseTiles = component.shadowRoot.querySelectorAll('d2l-enrollment-card');
			} else {
				courseTiles = component.querySelectorAll('d2l-enrollment-card');
			}
			var stub1 = sandbox.stub(courseTiles[0], 'refreshImage');
			var stub2 = sandbox.stub(courseTiles[1], 'refreshImage');

			component.courseImageUploadCompleted(true);

			expect(stub1).to.have.been.called;
			expect(stub2).to.have.been.called;
		});

		it('should call focus on the correct tile grid when focus is called', () => {
			var courseTileGrid = component.$$('.course-tile-grid');
			var spy = sandbox.spy(courseTileGrid, 'focus');

			component.focus();

			expect(spy).to.have.been.called;
		});

		it('should correctly determine whether there are started-inactive courses in _onStartedInactiveAlert', () => {
			var spy = sandbox.spy(component, '_addAlert');

			var firstCourseTile = component.$$('.course-tile-grid d2l-enrollment-card');
			firstCourseTile.setAttribute('started-inactive', '');

			component._onStartedInactiveAlert();

			expect(spy).to.have.been.called;
		});

		it('should add the hide-past-attributes to the correct tile grid in _populateEnrollments', () => {
			var spy = sandbox.spy(component.$$('.course-tile-grid'), 'setAttribute');
			return component._fetchRoot().then(() => {
				expect(spy).to.have.been.calledWith('hide-past-courses', '');
			});
		});

	});

	describe('Listener setup', () => {
		[
			{ eventName: 'open-change-image-view', handler: '_onOpenChangeImageView' },
			{ eventName: 'clear-image-scroll-threshold', handler: '_onClearImageScrollThreshold' },
			{ eventName: 'd2l-simple-overlay-closed', handler: '_onSimpleOverlayClosed' },
			{ eventName: 'enrollment-pinned', handler: '_onEnrollmentPinAction' },
			{ eventName: 'enrollment-unpinned', handler: '_onEnrollmentPinAction' },
			{ eventName: 'course-tile-organization', handler: '_onCourseTileOrganization' },
			{ eventName: 'course-image-loaded', handler: '_onCourseImageLoaded' },
			{ eventName: 'initially-visible-course-tile', handler: '_onInitiallyVisibleCourseTile' },
			{ eventName: 'd2l-enrollment-card-fetched', handler: '_onD2lEnrollmentCardFetched' },
			{ eventName: 'd2l-enrollment-card-status', handler: '_onD2lEnrollmentCardStatus' },
		].forEach(testCase => {

			it('should listen for ' + testCase.eventName + ' events', done => {
				var stub = sandbox.stub(component, testCase.handler);

				var event = new CustomEvent(testCase.eventName);
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(stub).to.have.been.called;
					done();
				});
			});

		});
	});

	describe('Public API', () => {

		it('should implement courseImageUploadCompleted', () => {
			expect(component.courseImageUploadCompleted).to.be.a('function');
		});

		it('should implement focus', () => {
			expect(component.focus).to.be.a('function');
		});

		it('should implement getLastOrgUnitId', () => {
			expect(component.getLastOrgUnitId).to.be.a('function');
		});

	});

	describe('Events', () => {

		describe('d2l-tab-panel-selected', () => {
			var parentComponent;

			beforeEach(() => {
				parentComponent = fixture('tab-event-fixture');
				component = parentComponent.querySelector('d2l-my-courses-content');
				component.enrollmentsSearchAction = searchAction;
				component._numberOfEnrollments = 1;
				component.tabSearchActions = [];
			});

			[true, false].forEach(hasEnrollments => {
				it('should ' + (hasEnrollments ? '' : 'not ') + 'fetch enrollments', () => {
					component._numberOfEnrollments = hasEnrollments ? 1 : 0;

					var stub = sandbox.stub(component, '_fetchRoot').returns(Promise.resolve());

					parentComponent.dispatchEvent(new CustomEvent(
						'd2l-tab-panel-selected', { bubbles: true, composed: true }
					));

					expect(stub.called).to.equal(!hasEnrollments);
				});
			});

			it('should update the tabSearchActions to select the currently-active tab', () => {
				component.tabSearchActions = [{
					name: searchAction.name,
					title: '',
					selected: false,
					enrollmentsSearchAction: searchAction
				}, {
					name: 'foo',
					title: '',
					selected: true,
					enrollmentsSearchAction: searchAction
				}];

				parentComponent.dispatchEvent(new CustomEvent(
					'd2l-tab-panel-selected', { bubbles: true, composed: true }
				));

				component.tabSearchActions.forEach(function(action) {
					expect(action.selected).to.equal(action.name !== 'foo');
				});
			});

			[true, false].forEach(refetchNeeded => {
				it('should ' + (refetchNeeded ? '' : 'not ') + 'refetch enrollments', () => {
					component._isRefetchNeeded = refetchNeeded;

					var refetchStub = sandbox.stub(component, '_refetchEnrollments').returns(Promise.resolve());
					var resetStub = sandbox.stub(component, '_resetEnrollments');

					parentComponent.dispatchEvent(new CustomEvent(
						'd2l-tab-panel-selected', { bubbles: true, composed: true }
					));

					expect(refetchStub.called).to.equal(refetchNeeded);
					expect(resetStub.called).to.equal(refetchNeeded);
					expect(component._isRefetchNeeded).to.be.false;
				});
			});
		});

		describe('open-change-image-view', () => {
			var event;

			beforeEach(() => {
				// Prevents the _searchPath of the image selector from being null
				component.imageCatalogLocation = '/foo';
				SetupFetchStub('/foo', {});
				event = new CustomEvent('open-change-image-view', {
					detail: {
						organization: organizationEntity
					}
				});
			});

			it('should update _setImageOrg', done => {

				component.addEventListener('open-change-image-view', function() {
					expect(component._setImageOrg.properties.name).to.equal('Course One');
					done();
				});

				component.dispatchEvent(event);

			});

			it('should open the course image overlay', done => {
				var spy = sandbox.spy(component.$['basic-image-selector-overlay'], 'open');

				component.addEventListener('open-change-image-view', function() {
					expect(spy).to.have.been.called;
					done();
				});

				component.dispatchEvent(event);

			});

			it('should focus on course grid when focus called after course interacted with', done => {
				var tileGridFocusSpy = sandbox.spy(component.$$('.course-tile-grid'), 'focus');

				component.addEventListener('open-change-image-view', function() {
					expect(tileGridFocusSpy.called);
					done();
				});

				component.dispatchEvent(event);
				component.focus();

			});

			it('should return undefined for org unit id initally', () => {
				expect(component.getLastOrgUnitId()).to.equal(undefined);
			});

			it('should return correct org unit id if course tile used', done => {

				component.addEventListener('open-change-image-view', function() {
					expect(component.getLastOrgUnitId()).to.equal('1');
					done();
				});

				component.dispatchEvent(event);

			});

			it('should return correct org unit id from various href', () => {
				expect(component._getOrgUnitIdFromHref('/organizations/671')).to.equal('671');
				expect(component._getOrgUnitIdFromHref('/some/other/route/8798734534')).to.equal('8798734534');
			});

		});

		describe('d2l-course-pinned-change', () => {
			/*function createEvent(isPinned, orgUnitId, enrollment) {
				return new CustomEvent(
					'd2l-course-pinned-change', {
						detail: {
							isPinned: isPinned,
							orgUnitId: orgUnitId,
							enrollment: enrollment
						}
					}
				);
			}*/

			it('should fire d2l-course-enrollment-change event', () => {
				var orgUnitId = 121;
				var isPinned = false;
				var event = {
					detail: {
						isPinned: isPinned,
						orgUnitId: orgUnitId
					}
				};

				component.addEventListener('d2l-course-enrollment-change', function(event) {
					expect(event.detail.orgUnitId).to.equal(orgUnitId);
					expect(event.detail.isPinned).to.equal(isPinned);
				});

				return component._onEnrollmentPinnedMessage(event);
			});

			it('should refetch enrollments if the new pinned enrollment has not previously been fetched', () => {
				var event = {
					detail: {
						isPinned: true,
						orgUnitId: 2,
						enrollment: null
					}
				};

				component._orgUnitIdMap = {
					1: enrollmentEntity
				};

				var refetchSpy = sandbox.spy(component, '_refetchEnrollments');
				return component._onEnrollmentPinnedMessage(event).then(() => {
					expect(refetchSpy).to.have.been.called;
				});
			});

			/*
			[
				{ enrollmentPinStates: [false, false], pin: false, name: 'zero pins, unpin non-displayed course' },
				{ enrollmentPinStates: [true, false], pin: false, name: 'one pin, unpin non-displayed course' },
				{ enrollmentPinStates: [true, true], pin: false, name: 'two pins, unpin non-displayed course' },
				{ enrollmentPinStates: [false, false], pin: true, name: 'zero pins, pin non-displayed course' },
				{ enrollmentPinStates: [true, false], pin: true, name: 'one pins, pin non-displayed course' },
				{ enrollmentPinStates: [true, true], pin: true, name: 'two pins, pin non-displayed course' },
			].forEach(testCase => {

				it.skip(testCase.name, () => {
					for (var i = 0; i < testCase.enrollmentPinStates.length; i++) {
						var enrollment = window.D2L.Hypermedia.Siren.Parse({
							links: [
								{ rel: ['self'], href: '/enrollments/' + (i + 1) },
								{ rel: ['https://api.brightspace.com/rels/organization'], href: '/organizations/' + (i + 1) }
							],
							class: [testCase.enrollmentPinStates[i] ? 'pinned' : 'unpinned']
						});
						SetupFetchStub('/enrollments/' + (i + 1), enrollment);
						component._enrollments.push(enrollment);
						component._orgUnitIdMap[(i + 1)] = enrollment;
					}
					var eventEnrollment = window.D2L.Hypermedia.Siren.Parse({
						links: [
							{ rel: ['self'], href: '/enrollments/101010' },
							{ rel: ['https://api.brightspace.com/rels/organization'], href: '/organizations/101010' }
						],
						class: [testCase.pin ? 'pinned' : 'unpinned']
					});
					SetupFetchStub('/enrollments/101010', eventEnrollment);

					var event = createEvent(
						undefined,
						undefined,
						eventEnrollment
					);

					var spliceSpy = sandbox.spy(component, 'splice');

					return component._onEnrollmentPinnedMessage(event).then(() => {
						var expectedInsertionIndex = testCase.enrollmentPinStates.indexOf(false);
						if (expectedInsertionIndex < 0) {
							expectedInsertionIndex = testCase.enrollmentPinStates.length;
						}

						// A new course will either be inserted after the last pinned item,
						// or before the first unpinned item - same index, either way
						expect(spliceSpy).to.have.been.calledWith(
							'_enrollments',
							expectedInsertionIndex,
							0,
							sinon.match.object
						);
					});

				});

			});
			*/

			/*
			[
				{ enrollmentPinStates: [false, false, false], switchStateIndex: 0, name: 'zero pins, pin first course goes to index 0' },
				{ enrollmentPinStates: [false, false, false], switchStateIndex: 1, name: 'zero pins, pin second course goes to index 0' },
				{ enrollmentPinStates: [false, false, false], switchStateIndex: 2, name: 'zero pins, pin third course goes to index 0' },
				{ enrollmentPinStates: [true, false, false], switchStateIndex: 0, name: 'one pin, unpin first course remains in index 0' },
				{ enrollmentPinStates: [true, false, false], switchStateIndex: 1, name: 'one pin, pin second course goes to index 1' },
				{ enrollmentPinStates: [true, false, false], switchStateIndex: 2, name: 'one pin, pin third course goes to index 1' },
				{ enrollmentPinStates: [true, true, false], switchStateIndex: 0, name: 'two pins, unpin first course goes to index 1' },
				{ enrollmentPinStates: [true, true, false], switchStateIndex: 1, name: 'two pins, unpin second course remains in index 1' },
				{ enrollmentPinStates: [true, true, false], switchStateIndex: 2, name: 'two pins, pin third course goes to index 2' },
				{ enrollmentPinStates: [true, true, true], switchStateIndex: 0, name: 'three pins, unpin first course goes to index 2' },
				{ enrollmentPinStates: [true, true, true], switchStateIndex: 1, name: 'three pins, unpin second course goes to index 2' },
				{ enrollmentPinStates: [true, true, true], switchStateIndex: 2, name: 'three pins, unpin third course goes to index 2' },
			].forEach(testCase => {
				it.skip(testCase.name, () => {
					for (var i = 0; i < testCase.enrollmentPinStates.length; i++) {
						var enrollment = window.D2L.Hypermedia.Siren.Parse({
							links: [
								{ rel: ['self'], href: '/enrollments/' + (i + 1) },
								{ rel: ['https://api.brightspace.com/rels/organization'], href: '/organizations/' + (i + 1) }
							],
							class: [testCase.enrollmentPinStates[i] ? 'pinned' : 'unpinned']
						});
						SetupFetchStub('/enrollments/' + (i + 1), enrollment);
						component._enrollments.push(enrollment);
						component._orgUnitIdMap[(i + 1)] = enrollment;
					}

					var event = createEvent(
						!testCase.enrollmentPinStates[testCase.switchStateIndex],
						testCase.switchStateIndex + 1
					);

					var spliceSpy = sandbox.spy(component, 'splice');

					return component._onEnrollmentPinnedMessage(event).then(() => {
						var expectedInsertionIndex = testCase.enrollmentPinStates.indexOf(false);
						if (expectedInsertionIndex < 0) {
							expectedInsertionIndex = testCase.enrollmentPinStates.length;
						}

						if (expectedInsertionIndex === testCase.switchStateIndex) {
							// We just swap in-place
							expect(spliceSpy).to.have.been.calledWith(
								'_enrollments',
								expectedInsertionIndex,
								1,
								sinon.match.object
							);
						} else {
							if (testCase.switchStateIndex < expectedInsertionIndex) {
								// Accounts for removal of enrollment higher up in the list
								expectedInsertionIndex--;
							}

							// Removal of old enrollment
							expect(spliceSpy).to.have.been.calledWith(
								'_enrollments',
								testCase.switchStateIndex,
								1
							);
							// Insertion of new enrollment
							expect(spliceSpy).to.have.been.calledWith(
								'_enrollments',
								expectedInsertionIndex,
								0,
								sinon.match.object
							);
						}
					});
				});
			});
			*/
		});

		describe('d2l-simple-overlay-closed', () => {

			it('should remove any existing set-course-image-failure alerts', done => {
				var spy = sandbox.spy(component, '_removeAlert');

				var event = new CustomEvent('d2l-simple-overlay-closed');
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(spy).to.have.been.calledWith('setCourseImageFailure');
					done();
				});
			});

		});

		['enrollment-pinned', 'enrollment-unpinned'].forEach(eventName => {
			describe(eventName, () => {

				it('should not fire a d2l-course-pinned-change event', done => {
					var spy = sandbox.spy(component, 'fire');

					organizationEntity.links[0].href = 'not-a-parseable-organization-link';
					var event = new CustomEvent(eventName, {
						detail: {
							organization: organizationEntity
						}
					});
					component.dispatchEvent(event);

					setTimeout(() => {
						expect(spy).to.have.not.been.calledWith('d2l-course-pinned-change');
						done();
					});
				});

				it('should fire a d2l-course-pinned-change event', done => {
					var spy = sandbox.spy(component, 'fire');

					var event = new CustomEvent(eventName, {
						detail: {
							organization: organizationEntity
						}
					});
					component.dispatchEvent(event);

					setTimeout(() => {
						expect(spy).to.have.been.calledWith(
							'd2l-course-pinned-change',
							sinon.match.has('orgUnitId', '1')
								.and(sinon.match.has('isPinned', eventName === 'enrollment-pinned'))
						);
						done();
					});

				});

			});
		});

		describe('course-image-loaded', () => {

			it('should increment the count of course images loaded', done => {
				expect(component._courseImagesLoadedEventCount).to.equal(0);

				var event = new CustomEvent('course-image-loaded');
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(component._courseImagesLoadedEventCount).to.equal(1);
					done();
				});
			});

		});

		describe('initially-visible-course-tile', () => {

			it('should increment the count of initially visible course tiles', done => {
				expect(component._initiallyVisibleCourseTileCount).to.equal(0);

				var event = new CustomEvent('initially-visible-course-tile');
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(component._initiallyVisibleCourseTileCount).to.equal(1);
					done();
				});
			});

		});

		describe('set-course-image', () => {

			it('should close the image-selector overlay', done => {
				var spy = sandbox.spy(component.$['basic-image-selector-overlay'], 'close');

				var event = new CustomEvent('set-course-image');
				document.body.dispatchEvent(event);

				setTimeout(() => {
					expect(spy).to.have.been.called;
					done();
				});
			});

		});

	});

	describe('Performance measures', () => {
		var stub;

		beforeEach(() => {
			stub = sandbox.stub(component, 'performanceMeasure');
		});

		it('should measure d2l.my-courses when all visible course tile images have loaded', done => {
			var listener = () => {
				component.removeEventListener('initially-visible-course-tile', listener);
				component.dispatchEvent(new CustomEvent('course-image-loaded'));
			};
			component.addEventListener('initially-visible-course-tile', listener);

			component.dispatchEvent(new CustomEvent('initially-visible-course-tile'));

			setTimeout(() => {
				expect(stub).to.have.been.calledWith(
					'd2l.my-courses',
					'd2l.my-courses.attached',
					'd2l.my-courses.visible-images-complete'
				);
				done();
			});
		});

		it('should measure d2l.my-courses.root-enrollments when the root enrollments call has finished', () => {
			return component._fetchRoot().then(() => {
				expect(stub).to.have.been.calledWith(
					'd2l.my-courses.root-enrollments',
					'd2l.my-courses.root-enrollments.request',
					'd2l.my-courses.root-enrollments.response'
				);
			});
		});

		it('should measure d2l.my-courses.search-enrollments when the enrollment search call has finished', () => {
			sandbox.stub(component, 'fetchSirenEntity')
				.onFirstCall().returns(Promise.resolve(enrollmentsRootEntity))
				.onSecondCall().returns(Promise.resolve({}));
			component._createFetchEnrollmentsUrl = () => {};

			return component._fetchRoot().then(() => {
				expect(stub).to.have.been.calledWith(
					'd2l.my-courses.search-enrollments',
					'd2l.my-courses.search-enrollments.request',
					'd2l.my-courses.search-enrollments.response'
				);
			});
		});

	});

	describe('Fetching enrollments', () => {

		it('should not fetch enrollments if the root request fails', () => {
			fetchStub.restore();
			fetchStub = sandbox.stub(window.d2lfetch, 'fetch').returns(Promise.reject());
			var spy = sandbox.spy(component, '_fetchEnrollments');

			return component._fetchRoot().catch(() => {
				expect(spy).to.have.not.been.called;
			});
		});

		it('should hide the loading spinner if loading fails', () => {
			fetchStub.restore();
			fetchStub = sandbox.stub(window.d2lfetch, 'fetch').returns(Promise.reject());

			return component._fetchRoot().catch(() => {
				expect(component._showContent).to.be.true;
			});
		});

		it('should hide the loading spinner if loading succeeds', () => {
			fetchStub.restore();

			SetupFetchStub(/\/enrollments$/, enrollmentsRootEntity);
			SetupFetchStub(/\/enrollments\/users\/169.*&.*$/, window.D2L.Hypermedia.Siren.Parse({
				actions: [searchAction],
				entities: [],
				links: [{
					rel: ['self'],
					href: '/enrollments/users/169'
				}]
			}));

			return component._fetchRoot().then(() => {
				expect(component._showContent).to.be.true;
			});
		});

		it('should fetch enrollments using the constructed enrollmentsSearchUrl', () => {
			return component._fetchRoot().then(() => {
				expect(fetchStub).to.have.been.calledWith(sinon.match.has('url', sinon.match('autoPinCourses=false')));
				expect(fetchStub).to.have.been.calledWith(sinon.match.has('url', sinon.match('pageSize=20')));
				expect(fetchStub).to.have.been.calledWith(sinon.match.has('url', sinon.match('embedDepth=0')));
				expect(fetchStub).to.have.been.calledWith(sinon.match.has('url', sinon.match('sort=current')));
				expect(fetchStub).to.have.been.calledWith(sinon.match.has('url', sinon.match('promotePins=true')));
			});
		});

		it('should fetch all pinned enrollments', () => {
			return component._fetchRoot()
				.then(() => {
					expect(fetchStub).to.have.been.calledWith(
						sinon.match.has('url', sinon.match('/enrollments/users/169?bookmark=2'))
					);
				});
		});

		it('should rescale the course tile grid on search response', () => {
			var spy = sandbox.spy(component, 'fire');

			return component._fetchRoot().then(() => {
				expect(spy).to.have.been.calledWith('recalculate-columns');
			});
		});

		it('should display the appropriate alert when there are no enrollments', () => {
			fetchStub.restore();
			component._enrollments = [];
			component._numberOfEnrollments = 0;

			SetupFetchStub(/\/enrollments$/, enrollmentsRootEntity);
			SetupFetchStub(/\/enrollments\/users\/169.*&.*$/, window.D2L.Hypermedia.Siren.Parse({
				actions: [searchAction],
				entities: [],
				links: [{
					rel: ['self'],
					href: '/enrollments/users/169'
				}]
			}));

			return component._fetchRoot().then(() => {
				expect(component._showContent).to.be.true;
				expect(component._numberOfEnrollments).to.equal(0);
				expect(component._alertsView).to.include({
					alertName: 'noCourses',
					alertType: 'call-to-action',
					alertMessage: 'You don\'t have any courses to display.'
				});
			});
		});

		it('should update enrollment alerts when enrollment information is updated', () => {
			fetchStub.restore();
			component._enrollments = [];
			component._numberOfEnrollments = 0;

			SetupFetchStub(/\/enrollments$/, enrollmentsRootEntity);
			SetupFetchStub(/\/enrollments\/users\/169.*&.*$/, window.D2L.Hypermedia.Siren.Parse({
				actions: [searchAction],
				entities: [],
				links: [{
					rel: ['self'],
					href: '/enrollments/users/169'
				}]
			}));

			return component._fetchRoot().then(() => {
				expect(component._numberOfEnrollments).to.equal(0);
				expect(component._alertsView).to.include({
					alertName: 'noCourses',
					alertType: 'call-to-action',
					alertMessage: 'You don\'t have any courses to display.'
				});
				component._enrollments = ['/enrollments/users/169/organizations/1'];
				component._numberOfEnrollments = 1;
				expect(component._alertsView).to.be.empty;
			});
		});

	});

	describe('With enrollments', () => {
		it('should correctly evaluate whether it has enrollments', done => {
			setTimeout(() => {
				expect(component._numberOfEnrollments).not.to.equal(0);
				done();
			}, 3000);
		});

		it('should add a setCourseImageFailure warning alert when a request to set the image fails', () => {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			component._onSetCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(component._alertsView).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should not add a setCourseImageFailure warning alert when a request to set the image succeeds', () => {
			var setCourseImageEvent = { detail: { status: 'success'} };
			component._onSetCourseImage(setCourseImageEvent);
			expect(component._alertsView).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should remove a setCourseImageFailure warning alert when a request to set the image is made', () => {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			component._onSetCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(component._alertsView).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
			setCourseImageEvent = { detail: { status: 'set'} };
			component._onSetCourseImage(setCourseImageEvent);
			expect(component._alertsView).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should show the number of enrollments when there are no new pages of enrollments with the View All Courses link', () => {
			component._nextEnrollmentEntityUrl = null;
			component._numberOfEnrollments = 6;
			expect(component._viewAllCoursesText).to.equal('View All Courses (6)');
		});

		it('should show include "+" in the View All Courses link when there are more courses', () => {
			component._nextEnrollmentEntityUrl = 'enrollments/2';
			component._numberOfEnrollments = 6;
			expect(component._viewAllCoursesText).to.equal('View All Courses (6+)');
		});

		it('should round the number of courses in the View All Courses link when there are many courses', () => {
			component._nextEnrollmentEntityUrl = 'enrollments/2';
			component._numberOfEnrollments = 23;
			expect(component._viewAllCoursesText).to.equal('View All Courses (20+)');
		});

		describe('Only Past Courses alert', () => {
			beforeEach((done) => {
				component = fixture('d2l-my-courses-content-fixture');
				component.enrollmentsUrl = '/enrollment';
				component.enrollmentsSearchAction = miniSearchAction;
				setTimeout(() => {
					done();
				});
			});

			it('should not add the alert if not hiding past courses', () => {
				component._hidePastCourses = false;
				component.dispatchEvent(new CustomEvent(
					'd2l-enrollment-card-status', {
						bubbles: true,
						composed: true,
						detail: {
							status: { closed: true },
							enrollmentUrl: '/enrollments/users/1/organizations/1'
						}
					}
				));

				expect(component._hasOnlyPastCourses).to.be.false;

			});

			it('should add the alert if hiding past courses', () => {
				component._hidePastCourses = true;
				component.dispatchEvent(new CustomEvent(
					'd2l-enrollment-card-status', {
						bubbles: true,
						composed: true,
						detail: {
							status: { closed: true },
							enrollmentUrl: '/enrollments/users/1/organizations/1'
						}
					}
				));

				expect(component._hasOnlyPastCourses).to.be.true;
			});
		});

	});

});
