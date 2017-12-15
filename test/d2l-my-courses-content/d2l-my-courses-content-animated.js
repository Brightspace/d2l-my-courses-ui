describe('d2l-my-courses-content-animated', function() {
	var sandbox,
		widget,
		organization = {
			links: [{
				rel: ['self'],
				href: '/organizations/1'
			}]
		},
		rootHref = '/enrollments',
		searchHref = '/enrollments/users/169',
		searchAction = {
			name: 'search-my-enrollments',
			method: 'GET',
			href: searchHref,
			fields: [{
				name: 'search',
				type: 'search',
				value: ''
			}, {
				name: 'pageSize',
				type: 'number',
				value: 20
			}, {
				name: 'embedDepth',
				type: 'number',
				value: 0
			}, {
				name: 'sort',
				type: 'text',
				value: ''
			}, {
				name: 'autoPinCourses',
				type: 'checkbox',
				value: false
			}]
		},
		enrollmentsRootResponse = {
			class: ['enrollments', 'root'],
			actions: [searchAction],
			links: [{
				rel: ['self'],
				href: rootHref
			}]
		},
		enrollmentsSearchResponse = {
			actions: [searchAction],
			entities: [{
				class: ['pinned', 'enrollment'],
				rel: ['https://api.brightspace.com/rels/user-enrollment'],
				actions: [{
					name: 'unpin-course',
					method: 'PUT',
					href: '/enrollments/users/169/organizations/1',
					fields: [{
						name: 'pinned',
						type: 'hidden',
						value: false
					}]
				}],
				links: [{
					rel: ['https://api.brightspace.com/rels/organization'],
					href: '/organizations/1'
				}, {
					rel: ['self'],
					href: '/enrollments/users/169/organizations/1'
				}]
			}, {
				class: ['pinned', 'enrollment'],
				rel: ['https://api.brightspace.com/rels/user-enrollment'],
				actions: [{
					name: 'unpin-course',
					method: 'PUT',
					href: '/enrollments/users/169/organizations/2',
					fields: [{
						name: 'pinned',
						type: 'hidden',
						value: false
					}]
				}],
				links: [{
					rel: ['https://api.brightspace.com/rels/organization'],
					href: '/organizations/2'
				}, {
					rel: ['self'],
					href: '/enrollments/users/169/organizations/2'
				}]
			}],
			links: [{
				rel: ['self'],
				href: searchHref
			}]
		},
		enrollmentsNextPageSearchResponse = {
			entities: [{
				class: ['unpinned', 'enrollment'],
				rel: ['https://api.brightspace.com/rels/user-enrollment'],
				actions: [{
					name: 'unpin-course',
					method: 'PUT',
					href: '/enrollments/users/169/organizations/2',
					fields: [{
						name: 'pinned',
						type: 'hidden',
						value: false
					}]
				}],
				links: [{
					rel: ['https://api.brightspace.com/rels/organization'],
					href: '/organizations/2'
				}, {
					rel: ['self'],
					href: '/enrollments/users/169/organizations/2'
				}]
			}],
			links: [{
				rel: ['self'],
				href: searchHref
			}]
		},
		noEnrollmentsResponse = {
			entities: []
		},
		noPinnedEnrollmentsResponse = {
			entities: [{
				class: ['unpinned', 'enrollment'],
				rel: ['https://api.brightspace.com/rels/user-enrollment'],
				actions: [{
					name: 'pin-course',
					method: 'PUT',
					href: '/enrollments/users/169/organizations/1',
					fields: [{
						name: 'pinned',
						type: 'hidden',
						value: true
					}]
				}],
				links: [{
					rel: ['https://api.brightspace.com/rels/organization'],
					href: '/organizations/1'
				}, {
					rel: ['self'],
					href: '/enrollments/users/169/organizations/1'
				}]
			}],
			links: [{
				rel: ['self'],
				href: searchHref
			}]
		};

	var clock;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();

		widget = fixture('d2l-my-courses-content-animated-fixture');

		widget.fetchSirenEntity = sandbox.stub();
		widget.fetchSirenEntity.withArgs(rootHref).returns(Promise.resolve(
			window.D2L.Hypermedia.Siren.Parse(enrollmentsRootResponse)
		));
		widget.fetchSirenEntity.withArgs(searchHref).returns(Promise.resolve(
			window.D2L.Hypermedia.Siren.Parse(enrollmentsSearchResponse)
		));
	});

	afterEach(function() {
		if (clock) {
			clock.restore();
		}

		sandbox.restore();
	});

	it('should load', function() {
		expect(widget).to.exist;
	});

	describe('Enrollments requests and responses', function() {
		it('should send a search request for enrollments with the correct query params', function() {
			var spy = sandbox.spy(widget, '_fetchEnrollments');

			return widget._fetchRoot().then(function() {
				expect(spy).to.have.been.called;
				expect(widget.fetchSirenEntity).to.have.been.calledWith(sinon.match('autoPinCourses=true'));
				expect(widget.fetchSirenEntity).to.have.been.calledWith(sinon.match('pageSize=25'));
				expect(widget.fetchSirenEntity).to.have.been.calledWith(sinon.match('embedDepth=1'));
				expect(widget.fetchSirenEntity).to.have.been.calledWith(sinon.match('sort=-PinDate,OrgUnitName,OrgUnitId'));
			});
		});

		it('should append enrollments on successive search requests', function() {
			widget.fetchSirenEntity.withArgs(sinon.match('/enrollments/users/169?search='))
				.onFirstCall().returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(enrollmentsSearchResponse)
				))
				.onSecondCall().returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(enrollmentsNextPageSearchResponse)
				));

			return widget._fetchRoot()
				.then(widget._fetchRoot.bind(widget))
				.then(function() {
					expect(widget._pinnedEnrollments.length).to.equal(2);
				});
		});

		it('should fetch all pinned enrollments', function() {
			enrollmentsSearchResponse.links.push({
				rel: ['next'],
				href: '/more-pinned-enrollments'
			});
			widget.fetchSirenEntity.withArgs(sinon.match('/enrollments/users/169?search='))
				.returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(enrollmentsSearchResponse)
				))
				.withArgs(sinon.match('/more-pinned-enrollments'))
				.returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(enrollmentsNextPageSearchResponse)
				));

			return widget._fetchRoot()
				.then(function() {
					expect(widget.fetchSirenEntity).to.have.been.calledWith(sinon.match('/more-pinned-enrollments'));
				});
		});

		it('should rescale the course tile grid on search response', function() {
			var gridRescaleSpy = sandbox.spy(widget.$$('d2l-course-tile-grid'), '_rescaleCourseTileRegions');

			return widget._fetchRoot().then(function() {
				expect(gridRescaleSpy.called);
			});
		});

		it('should display appropriate alert when there are no enrollments', function() {
			widget.fetchSirenEntity.withArgs(sinon.match('/enrollments/users/169?search=')).returns(Promise.resolve(
				window.D2L.Hypermedia.Siren.Parse(noEnrollmentsResponse)
			));

			return widget._fetchRoot().then(function() {
				expect(widget._hasEnrollments).to.equal(false);
				expect(widget._alerts).to.include({ alertName: 'noCourses', alertType: 'call-to-action', alertMessage: 'Your courses aren\'t quite ready. Please check back soon.' });
			});
		});

		it('should display appropriate message when there are no pinned enrollments', function() {
			widget.fetchSirenEntity.withArgs(sinon.match('/enrollments/users/169?search=')).returns(Promise.resolve(
				window.D2L.Hypermedia.Siren.Parse(noPinnedEnrollmentsResponse)
			));

			return widget._fetchRoot().then(function() {
				expect(widget._hasEnrollments).to.equal(true);
				expect(widget._alerts).to.include({ alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' });
			});
		});

		it('should update enrollment alerts when enrollment information is updated', function() {
			widget.fetchSirenEntity.withArgs(sinon.match('/enrollments/users/169?search=')).returns(Promise.resolve(
				window.D2L.Hypermedia.Siren.Parse(noPinnedEnrollmentsResponse)
			));

			return widget._fetchRoot().then(function() {
				expect(widget._hasEnrollments).to.equal(true);
				expect(widget._alerts).to.include({ alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' });
				var enrollmentsLengthChangedSpy = sandbox.spy(widget, '_enrollmentsChanged');
				widget._hasPinnedEnrollments = true;
				expect(enrollmentsLengthChangedSpy.called);
			});
		});

		it('should remove all existing alerts when enrollment alerts are updated', function() {
			widget._addAlert('error', 'testError', 'this is a test');
			widget._addAlert('warning', 'testWarning', 'this is another test');
			expect(widget._alerts).to.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
			widget._enrollmentsChanged(true, true);
			expect(widget._alerts).to.not.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
		});
	});

	describe('With enrollments', function() {
		beforeEach(function() {
			// Prevents the _searchPath of the image selector from being null (causes failures in Firefox)
			widget.imageCatalogLocation = '/foo/bar';

			widget.fetchSirenEntity.withArgs(sinon.match('/enrollments/users/169?search=')).returns(Promise.resolve(
				window.D2L.Hypermedia.Siren.Parse(enrollmentsSearchResponse)
			));

			return widget._fetchRoot();
		});

		it('should return the correct value from getCourseTileItemCount', function() {
			expect(widget.getCourseTileItemCount()).to.equal(2);
		});

		it('should correctly evaluate whether it has pinned/unpinned enrollments', function() {
			expect(widget._hasEnrollments).to.be.true;
			expect(widget._hasPinnedEnrollments).to.be.true;
		});

		it('should add a setCourseImageFailure warning alert when a request to set the image fails', function() {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget._onSetCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should not add a setCourseImageFailure warning alert when a request to set the image succeeds', function() {
			var setCourseImageEvent = { detail: { status: 'success'} };
			widget._onSetCourseImage(setCourseImageEvent);
			expect(widget._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should remove a setCourseImageFailure warning alert when a request to set the image is made', function() {
			clock = sinon.useFakeTimers();
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget._onSetCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
			setCourseImageEvent = { detail: { status: 'set'} };
			widget._onSetCourseImage(setCourseImageEvent);
			expect(widget._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should show the number of enrollments when there are no new pages of enrollments with the View All Courses link', function() {
			widget.updatedSortLogic = true;
			widget._pinnedEnrollments = new Array(6);
			widget._allEnrollments = new Array(9);
			widget._hasMoreEnrollments = false;
			expect(widget._viewAllCoursesText).to.equal('View All Courses (9)');
		});

		it('should show 50+ with the View All Courses link when there are more than 50 courses', function() {
			widget.updatedSortLogic = true;
			widget._pinnedEnrollments = new Array(4);
			widget._allEnrollments = new Array(50);
			widget._hasMoreEnrollments = true;
			expect(widget._viewAllCoursesText).to.equal('View All Courses (50+)');
		});

		it('should not show the count in the View All Courses link when the updated sortfeature flag is off', function() {
			widget.updatedSortLogic = false;
			widget._pinnedEnrollments = new Array(4);
			widget._allEnrollments = new Array(50);
			widget._hasMoreEnrollments = true;
			expect(widget._viewAllCoursesText).to.equal('View All Courses');
		});

		describe('course image upload', function() {
			var openChangeImageViewEvent = new CustomEvent(
				'open-change-image-view', {
					detail: {
						organization: organization
					}
				}
			);

			it('should focus on view all courses link when focus called initially', function() {
				widget.focus();
				expect(widget.$$('#viewAllCourses')).to.equal(document.activeElement);
			});

			it('should focus on course grid when focus called after course interacted with', function(done) {
				var tileGridFocusSpy = sandbox.spy(widget.$$('d2l-course-tile-grid'), 'focus');
				widget.dispatchEvent(openChangeImageViewEvent);

				widget.focus();

				setTimeout(function() {
					expect(tileGridFocusSpy.called);
					done();
				});
			});

			it('should return undefined for org unit id initally', function() {
				expect(widget.getLastOrgUnitId()).to.equal(undefined);
			});

			it('should return correct org unit id if course tile used', function(done) {
				widget.dispatchEvent(openChangeImageViewEvent);

				setTimeout(function() {
					expect(widget.getLastOrgUnitId()).to.equal('1');
					done();
				});
			});

			it('should return correct org unit id from various href', function() {
				expect(widget._getOrgUnitIdFromHref('/organizations/671')).to.equal('671');
				expect(widget._getOrgUnitIdFromHref('/some/other/route/8798734534')).to.equal('8798734534');
			});
		});

		describe('d2l-course-pinned-change', function() {
			it('should bubble the correct d2l-course-pinned-change event when an enrollment is pinned', function(done) {
				widget.fire = sandbox.stub();

				var enrollmentPinEvent = new CustomEvent(
					'enrollment-pinned', {
						detail: {
							organization: organization,
							isPinned: true
						}
					}
				);

				widget.dispatchEvent(enrollmentPinEvent);

				setTimeout(function() {
					expect(widget.fire.calledWith('d2l-course-pinned-change',
						sinon.match({
							detail: {
								orgUnitId: 1,
								isPinned: true
							}
						})
					));
					done();
				});
			});

			it('should bubble the correct d2l-course-pinned-change event when an enrollment is unpinned', function(done) {
				widget.fire = sandbox.stub();

				var enrollmentUnpinEvent = new CustomEvent(
					'enrollment-unpinned', {
						detail: {
							organization: organization,
							isPinned: true
						}
					}
				);

				widget.dispatchEvent(enrollmentUnpinEvent);

				setTimeout(function() {
					expect(widget.fire.calledWith('d2l-course-pinned-change',
						sinon.match({
							detail: {
								orgUnitId: 1,
								isPinned: false
							}
						})
					));
					done();
				});
			});

			it('should remove the correct pinned enrollment receiving an external unpin event', function(done) {
				widget._addToPinnedEnrollments = sandbox.stub();
				widget._removeFromPinnedEnrollments = sandbox.stub();
				var coursePinnedChangeEvent = new CustomEvent(
					'd2l-course-pinned-change', {
						detail: {
							orgUnitId: 1,
							isPinned: false
						}
					});

				widget._orgUnitIdMap['1'] = 'enrollment1';

				document.body.dispatchEvent(coursePinnedChangeEvent);

				setTimeout(function() {
					expect(widget._removeFromPinnedEnrollments).to.have.been.calledWith('enrollment1');
					expect(widget._addToPinnedEnrollments).to.not.have.been.called;
					done();
				});
			});

			it('should add the correct enrollment to the pinned list when receiving an external unpin event', function(done) {
				widget._addToPinnedEnrollments = sandbox.stub();
				widget._removeFromPinnedEnrollments = sandbox.stub();
				var coursePinnedChangeEvent = new CustomEvent(
					'd2l-course-pinned-change', {
						detail: {
							orgUnitId: 2,
							isPinned: true
						}
					});

				widget._orgUnitIdMap['2'] = 'enrollment2';

				document.body.dispatchEvent(coursePinnedChangeEvent);

				setTimeout(function() {
					expect(widget._removeFromPinnedEnrollments).to.not.have.been.called;
					expect(widget._addToPinnedEnrollments).to.have.been.calledWith('enrollment2');
					done();
				});
			});

			it('should refetch enrollments if the pinned enrollment has no previously been fetched', function(done) {
				widget._addToPinnedEnrollments = sandbox.stub();
				widget._removeFromPinnedEnrollments = sandbox.stub();
				widget.fetchSirenEntity = sandbox.stub();
				widget.fetchSirenEntity.withArgs(rootHref).returns(Promise.resolve());
				widget._refetchEnrollments = sandbox.stub();
				var coursePinnedChangeEvent = new CustomEvent(
					'd2l-course-pinned-change', {
						detail: {
							orgUnitId: 2,
							isPinned: true
						}
					});

				widget._orgUnitIdMap = {};

				document.body.dispatchEvent(coursePinnedChangeEvent);

				setTimeout(function() {
					expect(widget._removeFromPinnedEnrollments).to.not.have.been.called;
					expect(widget._addToPinnedEnrollments).to.not.have.been.called;
					expect(widget._refetchEnrollments).to.have.been.called;
					done();
				});
			});
		});
	});

	describe('User interaction', function() {
		it('should rescale the all courses view when it is opened', function() {
			clock = sinon.useFakeTimers();
			widget._enrollmentsSearchUrl = '';
			widget.updatedSortLogic = false;

			widget.$$('#viewAllCourses').click();
			Polymer.dom.flush();
			var allCoursesRescaleSpy = sandbox.spy(widget.$$('d2l-all-courses').$$('d2l-all-courses-segregated-content'), '_rescaleCourseTileRegions');

			clock.tick(100);
			expect(allCoursesRescaleSpy.called);
			widget.$$('d2l-all-courses').$$('d2l-all-courses-segregated-content')._rescaleCourseTileRegions.restore();
		});

		it('should remove a setCourseImageFailure alert when the all-courses overlay is closed', function() {
			clock = sinon.useFakeTimers();
			widget._enrollmentsSearchUrl = '';

			widget._addAlert('warning', 'setCourseImageFailure', 'failed to do that thing it should do');
			widget._openAllCoursesView(new Event('foo'));
			clock.tick(1001);
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
			widget.$$('d2l-all-courses').children['all-courses']._handleClose();
			expect(widget._alerts).to.not.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
		});
	});
});
