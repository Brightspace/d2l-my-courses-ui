describe('d2l-my-courses-content', () => {
	var sandbox,
		clock,
		component,
		fetchStub,
		searchAction,
		enrollmentEntity,
		enrollmentsRootEntity,
		enrollmentsSearchEntity,
		enrollmentsSearchPageTwoEntity,
		organizationEntity,
		organizationEntityHydrated;

	var self = this;

	function SetupFetchStub(url, entity) {
		fetchStub.withArgs(sinon.match.has('url', sinon.match(url)))
			.returns(Promise.resolve({
				ok: true,
				json: () => { return Promise.resolve(entity); }
			}));
	}

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		searchAction = {
			name: 'search-my-enrollments',
			method: 'GET',
			href: '/enrollments/users/169',
			fields: [
				{ name: 'search', type: 'search', value: '' },
				{ name: 'pageSize', type: 'number', value: 20 },
				{ name: 'embedDepth', type: 'number', value: 0 },
				{ name: 'sort', type: 'text', value: '' },
				{ name: 'autoPinCourses', type: 'checkbox', value: false },
				{ name: 'promotePins', type: 'checkbox', value: false }
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
		}),
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
		enrollmentsSearchEntity = window.D2L.Hypermedia.Siren.Parse({
			actions: [searchAction],
			entities: [{
				rel: ['https://api.brightspace.com/rels/user-enrollment'],
				class: ['enrollment', 'pinned'],
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

		fetchStub = sandbox.stub(window.d2lfetch, 'fetch');
		SetupFetchStub(/\/enrollments$/, enrollmentsRootEntity);
		SetupFetchStub(/\/organizations\/1$/, organizationEntity);
		SetupFetchStub(/\/organizations\/2$/, organizationEntity);
		SetupFetchStub(/\/organizations\/3$/, organizationEntity);
		SetupFetchStub(/\/organizations\/1\?embedDepth=1$/, organizationEntityHydrated);
		SetupFetchStub(/\/organizations\/2\?embedDepth=1$/, organizationEntityHydrated);
		SetupFetchStub(/\/organizations\/3\?embedDepth=1$/, organizationEntityHydrated);
		SetupFetchStub(/\/enrollments\/users\/169.*&.*$/, enrollmentsSearchEntity);
		SetupFetchStub(/\/enrollments\/users\/169.*bookmark=2/, enrollmentsSearchPageTwoEntity);

		component = fixture('d2l-my-courses-content-fixture');
		component.enrollmentsUrl = '/enrollments';
	});

	afterEach(() => {
		if (clock) {
			clock.restore();
		}
		sandbox.restore();
	});

	it('should properly implement d2l-my-courses-content-behavior', () => {
		expect(component).to.exist;
		expect(component._alerts).to.be.an.instanceof(Array);
		expect(component._existingEnrollmentsMap).to.be.an('object');
		expect(component._hasEnrollments).to.be.false;
		expect(component._hasMoreEnrollments).to.be.false;
		expect(component._orgUnitIdMap).to.be.an('object');
		expect(component._setImageOrg).to.be.an('object');
		expect(component._showContent).to.be.false;
		expect(component._tileSizes).to.be.an('object');
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

		it('should implement getCourseTileItemCount', () => {
			expect(component.getCourseTileItemCount).to.be.a('function');
		});

		it('should implement getLastOrgUnitId', () => {
			expect(component.getLastOrgUnitId).to.be.a('function');
		});
	});

	describe('Events', () => {
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
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(component._setImageOrg.properties.name).to.equal('Course One');
					done();
				});
			});

			it('should open the course image overlay', done => {
				var spy = sandbox.spy(component.$['basic-image-selector-overlay'], 'open');
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(spy).to.have.been.called;
					done();
				});
			});

			it('should focus on course grid when focus called after course interacted with', done => {
				var tileGridFocusSpy = sandbox.spy(component.$$('d2l-course-tile-grid'), 'focus');
				component.dispatchEvent(event);

				component.focus();

				setTimeout(() => {
					expect(tileGridFocusSpy.called);
					done();
				});
			});

			it('should return undefined for org unit id initally', () => {
				expect(component.getLastOrgUnitId()).to.equal(undefined);
			});

			it('should return correct org unit id if course tile used', done => {
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(component.getLastOrgUnitId()).to.equal('1');
					done();
				});
			});

			it('should return correct org unit id from various href', () => {
				expect(component._getOrgUnitIdFromHref('/organizations/671')).to.equal('671');
				expect(component._getOrgUnitIdFromHref('/some/other/route/8798734534')).to.equal('8798734534');
			});
		});

		describe('d2l-course-pinned-change', () => {
			function createEvent(isPinned, orgUnitId, enrollment) {
				return new CustomEvent(
					'd2l-course-pinned-change', {
						detail: {
							isPinned: isPinned,
							orgUnitId: orgUnitId,
							enrollment: enrollment
						}
					}
				);
			}

			it('should refetch enrollments if the new pinned enrollment has not previously been fetched', () => {
				component._orgUnitIdMap = {
					1: enrollmentEntity
				};
				var event = createEvent(true, 2);
				var refetchSpy = sandbox.spy(component, '_refetchEnrollments');

				return component._onEnrollmentPinnedMessage(event).then(() => {
					expect(refetchSpy).to.have.been.called;
				});
			});

			[
				{ enrollmentPinStates: [false, false], pin: false, name: 'zero pins, unpin non-displayed course' },
				{ enrollmentPinStates: [true, false], pin: false, name: 'one pin, unpin non-displayed course' },
				{ enrollmentPinStates: [true, true], pin: false, name: 'two pins, unpin non-displayed course' },
				{ enrollmentPinStates: [false, false], pin: true, name: 'zero pins, pin non-displayed course' },
				{ enrollmentPinStates: [true, false], pin: true, name: 'one pins, pin non-displayed course' },
				{ enrollmentPinStates: [true, true], pin: true, name: 'two pins, pin non-displayed course' },
			].forEach(testCase => {
				(window.navigator.platform.indexOf('Mac') > -1 ? it.skip : it)(testCase.name, () => {
					if (window.navigator.platform.match(/Mac/)) {
						self.skip();
					}

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
				(window.navigator.platform.indexOf('Mac') > -1 ? it.skip : it)(testCase.name, () => {
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
				expect(fetchStub).to.have.been.calledWith(sinon.match.has('url', sinon.match('embedDepth=1')));
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
				expect(component._hasEnrollments).to.be.false;
				expect(component._alerts).to.include({
					alertName: 'noCourses',
					alertType: 'call-to-action',
					alertMessage: 'Your courses aren\'t quite ready. Please check back soon.'
				});
			});
		});

		it('should update enrollment alerts when enrollment information is updated', () => {
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
				expect(component._hasEnrollments).to.be.false;
				expect(component._alerts).to.include({
					alertName: 'noCourses',
					alertType: 'call-to-action',
					alertMessage: 'Your courses aren\'t quite ready. Please check back soon.'
				});
				component._enrollments = [enrollmentEntity];
				expect(component._alerts).to.be.empty;
			});
		});

		it('should remove all existing alerts when enrollment alerts are updated', () => {
			component._addAlert('error', 'testError', 'this is a test');
			component._addAlert('warning', 'testWarning', 'this is another test');
			expect(component._alerts).to.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
			component._enrollmentsChanged([1]);
			expect(component._alerts).to.not.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
		});
	});

	describe('With enrollments', () => {
		it('should return the corret value from getCoursetileItemCount', () => {
			return component._fetchRoot().then(() => {
				expect(component.getCourseTileItemCount()).to.equal(2);
			});
		});

		it('should correctly evaluate whether it has enrollments', () => {
			return component._fetchRoot().then(() => {
				expect(component._hasEnrollments).to.be.true;
			});
		});

		it('should add a setCourseImageFailure warning alert when a request to set the image fails', () => {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			component._onSetCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(component._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should not add a setCourseImageFailure warning alert when a request to set the image succeeds', () => {
			var setCourseImageEvent = { detail: { status: 'success'} };
			component._onSetCourseImage(setCourseImageEvent);
			expect(component._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should remove a setCourseImageFailure warning alert when a request to set the image is made', () => {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			component._onSetCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(component._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
			setCourseImageEvent = { detail: { status: 'set'} };
			component._onSetCourseImage(setCourseImageEvent);
			expect(component._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should show the number of enrollments when there are no new pages of enrollments with the View All Courses link', () => {
			component._hasMoreEnrollments = false;
			component._enrollments = new Array(6);
			expect(component._viewAllCoursesText).to.equal('View All Courses (6)');
		});

		it('should show include "+" in the View All Courses link when there are more courses', () => {
			component._hasMoreEnrollments = true;
			component._enrollments = new Array(6);
			expect(component._viewAllCoursesText).to.equal('View All Courses (6+)');
		});

		it('should round the number of courses in the View All Courses link when there are many courses', () => {
			component._hasMoreEnrollments = true;
			component._enrollments = new Array(23);
			expect(component._viewAllCoursesText).to.equal('View All Courses (20+)');
		});
	});
});
