describe('d2l-my-courses-content-behavior', () => {
	var sandbox,
		component,
		searchAction,
		enrollmentsRootEntity,
		organizationEntity;

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
				{ name: 'autoPinCourses', type: 'checkbox', value: false }
			]
		},
		organizationEntity = window.D2L.Hypermedia.Siren.Parse({
			properties: {
				name: 'Course One'
			},
			links: [{
				rel: ['self'],
				href: '/organizations/1'
			}]
		});
		enrollmentsRootEntity = window.D2L.Hypermedia.Siren.Parse({
			actions: [searchAction]
		});
		component = fixture('d2l-my-courses-content-behavior-fixture');
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should be properly inherited by the consumer element', () => {
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
			it('should update _setImageOrg', done => {
				var event = new CustomEvent('open-change-image-view', {
					detail: {
						organization: organizationEntity
					}
				});
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(component._setImageOrg.properties.name).to.equal('Course One');
					done();
				});
			});

			it('should open the course image overlay', done => {
				var spy = sandbox.spy(component.$['basic-image-selector-overlay'], 'open');
				var event = new CustomEvent('open-change-image-view', { detail: {} });
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(spy).to.have.been.called;
					done();
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
						expect(spy).to.have.not.been.called;
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
						expect(spy).to.have.been.called;
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
			component.fetchSirenEntity = sandbox.stub().returns(
				Promise.resolve(window.D2L.Hypermedia.Siren.Parse({}))
			);
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
			var spy = sandbox.spy(component, '_fetchEnrollments');
			sandbox.stub(component, 'fetchSirenEntity').returns(Promise.reject());

			return component._fetchRoot().catch(() => {
				expect(spy).to.have.not.been.called;
			});
		});

		it('should hide the loading spinner if loading fails', () => {
			sandbox.stub(component, 'fetchSirenEntity').returns(
				Promise.resolve(window.D2L.Hypermedia.Siren.Parse({}))
			);
			component._fetchEnrollments = sandbox.stub().returns(Promise.reject());

			return component._fetchRoot().catch(() => {
				expect(component._showContent).to.be.true;
			});
		});

		it('should hide the loading spinner if loading succeeds', () => {
			sandbox.stub(component, 'fetchSirenEntity').returns(
				Promise.resolve(window.D2L.Hypermedia.Siren.Parse({}))
			);
			component._fetchEnrollments = sandbox.stub().returns(Promise.resolve());

			return component._fetchRoot().then(() => {
				expect(component._showContent).to.be.true;
			});
		});

		it('should fetch enrollments using the constructed enrollmentsSearchUrl', () => {
			component._populateEnrollments = () => {};
			var fetchStub = sandbox.stub(component, 'fetchSirenEntity');
			fetchStub.onFirstCall().returns(Promise.resolve(enrollmentsRootEntity));
			fetchStub.onSecondCall().returns(Promise.resolve(window.D2L.Hypermedia.Siren.Parse({})));
			fetchStub.returns(Promise.resolve({}));
			var createUrlStub = sandbox.stub(component, '_createFetchEnrollmentsUrl').returns('bar');

			return component._fetchRoot().then(() => {
				expect(createUrlStub).to.have.been.called;
				expect(fetchStub).to.have.been.calledWith('bar');
			});
		});
	});
});
