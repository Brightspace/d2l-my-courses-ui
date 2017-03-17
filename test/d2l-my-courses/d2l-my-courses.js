/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('d2l-my-courses', function() {
	var server,
		widget,
		// Using relative URLs here so that d2l-ajax just uses cookies (no need to mock the token fetching this way)
		rootHref = '/enrollments',
		searchHref = '/enrollments/users/169',
		enrollmentsRootResponse = {
			class: ['enrollments', 'root'],
			actions: [{
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
				}]
			}],
			links: [{
				rel: ['self'],
				href: rootHref
			}]
		},
		enrollmentsSearchResponse = {
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
				class: ['unpinned', 'enrollment'],
				rel: ['https://api.brightspace.com/rels/user-enrollment'],
				actions: [{
					name: 'pin-course',
					method: 'PUT',
					href: '/enrollments/users/169/organizations/2',
					fields: [{
						name: 'pinned',
						type: 'hidden',
						value: true
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
		server = sinon.fakeServer.create();
		server.respondImmediately = true;
		clock = sinon.useFakeTimers();

		widget = fixture('d2l-my-courses-fixture');
	});

	afterEach(function() {
		clock.restore();
		server.restore();
	});

	it('should load', function() {
		expect(widget).to.exist;
	});

	describe('Enrollments requests and responses', function() {
		it('should not send a search request if the root request fails', function(done) {
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(404, {}, '');
				});

			var enrollmentsSearchSpy = sinon.spy(widget.$.enrollmentsSearchRequest, 'generateRequest');

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsRootRequest.addEventListener('iron-ajax-error', function() {
				expect(enrollmentsSearchSpy.callCount === 0);
				widget.$.enrollmentsSearchRequest.generateRequest.restore();
				done();
			});
		});

		it('should send a search request for enrollments', function(done) {
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(enrollmentsRootResponse));
				});

			server.respondWith(
				'GET',
				new RegExp(searchHref),
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(enrollmentsSearchResponse));
				});

			var enrollmentsSearchSpy = sinon.spy(widget, '_onEnrollmentsSearchResponse');

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				expect(enrollmentsSearchSpy.called);
				widget._onEnrollmentsSearchResponse.restore();
				done();
			});
		});

		it('should append enrollments on successive search requests', function(done) {
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(enrollmentsRootResponse));
				});

			server.respondWith(
				'GET',
				new RegExp(searchHref),
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					if (widget.pinnedEnrollments.length === 0) {
						req.respond(200, {}, JSON.stringify(enrollmentsSearchResponse));
					} else {
						req.respond(200, {}, JSON.stringify(enrollmentsNextPageSearchResponse));
					}
				});

			var enrollmentsSearchSpy = sinon.spy(widget, '_onEnrollmentsSearchResponse');

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				if (enrollmentsSearchSpy.calledOnce) {
					widget.$.enrollmentsSearchRequest.generateRequest();
				} else if (enrollmentsSearchSpy.calledTwice) {
					expect(widget.pinnedEnrollments.length).to.equal(2);
					widget._onEnrollmentsSearchResponse.restore();
					done();
				}
			});
		});

		it('should set the request URL for pinned courses', function(done) {
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(enrollmentsRootResponse));
				});

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsRootRequest.addEventListener('iron-ajax-response', function() {
				expect(widget._enrollmentsSearchUrl).to.match(/sort=-PinDate/);
				done();
			});
		});

		it('should rescale the course tile grid on search response', function(done) {
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(enrollmentsRootResponse));
				});

			server.respondWith(
				'GET',
				new RegExp(searchHref),
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(enrollmentsSearchResponse));
				});

			var gridRescaleSpy = sinon.spy(widget.$$('d2l-course-tile-grid'), '_rescaleCourseTileRegions');

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				expect(gridRescaleSpy.called);
				widget.$$('d2l-course-tile-grid')._rescaleCourseTileRegions.restore();
				done();
			});
		});

		it('should display appropriate alert when there are no enrollments', function(done) {
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					req.respond(200, {}, JSON.stringify(enrollmentsRootResponse));
				});

			server.respondWith(
				'GET',
				new RegExp(searchHref),
				function(req) {
					req.respond(200, {}, JSON.stringify(noEnrollmentsResponse));
				});

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				expect(widget._hasEnrollments).to.equal(false);
				expect(widget._alerts).to.include({ alertName: 'noCourses', alertType: 'call-to-action', alertMessage: 'Your courses aren\'t quite ready. Please check back soon.' });
				done();
			});
		});

		it('should display appropriate message when there are no pinned enrollments', function(done) {
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					req.respond(200, {}, JSON.stringify(enrollmentsRootResponse));
				});

			server.respondWith(
				'GET',
				new RegExp(searchHref),
				function(req) {
					req.respond(200, {}, JSON.stringify(noPinnedEnrollmentsResponse));
				});

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				expect(widget._hasEnrollments).to.equal(true);
				expect(widget._alerts).to.include({ alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' });
				done();
			});
		});

		it('should update enrollment alerts when enrollment information is updated', function(done) {
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					req.respond(200, {}, JSON.stringify(enrollmentsRootResponse));
				});

			server.respondWith(
				'GET',
				new RegExp(searchHref),
				function(req) {
					req.respond(200, {}, JSON.stringify(noPinnedEnrollmentsResponse));
				});

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				expect(widget._hasEnrollments).to.equal(true);
				expect(widget._alerts).to.include({ alertName: 'noPinnedCourses', alertType: 'call-to-action', alertMessage: 'You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.' });
				var updateEnrollmentAlertsSpy = sinon.spy(widget, '_updateEnrollmentAlerts');
				widget._hasPinnedEnrollments = true;
				expect(updateEnrollmentAlertsSpy.called);
				done();
			});
		});

		it('should remove all existing alerts when enrollment alerts are updated', function() {
			widget._addAlert('error', 'testError', 'this is a test');
			widget._addAlert('warning', 'testWarning', 'this is another test');
			expect(widget._alerts).to.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
			widget._updateEnrollmentAlerts(true, true);
			expect(widget._alerts).to.not.include({ alertName: 'testError', alertType: 'error', alertMessage: 'this is a test'});
		});
	});

	describe('With enrollments', function() {
		var pinnedEnrollmentEntity,
			unpinnedEnrollmentEntity,
			parser;

		beforeEach(function(done) {
			parser = document.createElement('d2l-siren-parser');
			pinnedEnrollmentEntity = parser.parse(enrollmentsSearchResponse.entities[0]);
			unpinnedEnrollmentEntity = parser.parse(noPinnedEnrollmentsResponse.entities[0]);
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					req.respond(200, {}, JSON.stringify(enrollmentsRootResponse));
				});

			server.respondWith(
				'GET',
				new RegExp(searchHref),
				function(req) {
					req.respond(200, {}, JSON.stringify(enrollmentsSearchResponse));
				});

			widget.$.enrollmentsRootRequest.generateRequest();
			var doneFunc = function() {
				done();
				widget.$.enrollmentsSearchRequest.removeEventListener('iron-ajax-response', doneFunc);
			};
			// Wait until the second (search) request finishes before checking things
			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', doneFunc);
		});

		it('should return the correct value from getCourseTileItemCount', function() {
			expect(widget.getCourseTileItemCount()).to.equal(1);
		});

		it('should correctly evaluate whether it has pinned/unpinned enrollments', function() {
			expect(widget._hasEnrollments).to.be.true;
			expect(widget._hasPinnedEnrollments).to.be.true;
		});

		it('should add a setCourseImageFailure warning alert when a request to set the image fails', function() {
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget._setCourseImageEvent(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should not add a setCourseImageFailure warning alert when a request to set the image succeeds', function() {
			var setCourseImageEvent = { detail: { status: 'success'} };
			widget._setCourseImageEvent(setCourseImageEvent);
			expect(widget._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		it('should remove a setCourseImageFailure warning alert when a request to set the image is made', function() {
			var setCourseImageEvent = { detail: { status: 'failure'} };
			widget._setCourseImageEvent(setCourseImageEvent);
			clock.tick(1001);
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
			setCourseImageEvent = { detail: { status: 'set'} };
			widget._setCourseImageEvent(setCourseImageEvent);
			expect(widget._alerts).not.to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'Sorry, we\'re unable to change your image right now. Please try again later.' });
		});

		describe('d2l-course-pinned-change', function() {
			beforeEach(function() {
				// Needed to use setTimeout normally here
				clock.restore();
			});

			it('should bubble the correct d2l-course-pinned-change event when an enrollment is pinned', function(done) {
				widget.fire = sinon.stub();

				var enrollmentPinEvent = new CustomEvent(
					'enrollment-pinned', {
						detail: {
							enrollment: pinnedEnrollmentEntity,
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
				widget.fire = sinon.stub();

				var enrollmentUnpinEvent = new CustomEvent(
					'enrollment-unpinned', {
						detail: {
							enrollment: unpinnedEnrollmentEntity,
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

			it('should move the correct pinned enrollment to the unpinned list when receiving an external unpin event', function(done) {
				var coursePinnedChangeEvent = new CustomEvent(
					'd2l-course-pinned-change', {
						detail: {
							orgUnitId: 1,
							isPinned: false
						}
					}
				);

				expect(widget.pinnedEnrollments.length).to.equal(1);
				expect(widget.unpinnedEnrollments.length).to.equal(1);

				document.body.dispatchEvent(coursePinnedChangeEvent);

				setTimeout(function() {
					expect(widget.pinnedEnrollments.length).to.equal(0);
					expect(widget.unpinnedEnrollments.length).to.equal(2);
					done();
				});
			});

			it('should move the correct unpinned enrollment to the pinned list when receiving an external pin event', function(done) {
				var coursePinnedChangeEvent = new CustomEvent(
					'd2l-course-pinned-change', {
						detail: {
							orgUnitId: 2,
							isPinned: true
						}
					}
				);

				expect(widget.pinnedEnrollments.length).to.equal(1);
				expect(widget.unpinnedEnrollments.length).to.equal(1);

				document.body.dispatchEvent(coursePinnedChangeEvent);

				setTimeout(function() {
					expect(widget.pinnedEnrollments.length).to.equal(2);
					expect(widget.unpinnedEnrollments.length).to.equal(0);
					done();
				});
			});
		});
	});

	describe('User interaction', function() {
		it('should rescale the all courses view when it is opened', function() {
			widget.$$('#viewAllCourses').click();
			var allCoursesRescaleSpy = sinon.spy(widget.$$('d2l-all-courses'), '_rescaleCourseTileRegions');

			clock.tick(100);
			expect(allCoursesRescaleSpy.called);
			widget.$$('d2l-all-courses')._rescaleCourseTileRegions.restore();
		});

		it('should remove a setCourseImageFailure alert when the all-courses overlay is closed', function() {
			widget._addAlert('warning', 'setCourseImageFailure', 'failed to do that thing it should do');
			widget._openAllCoursesView(new Event('foo'));
			clock.tick(1001);
			expect(widget._alerts).to.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
			widget.$$('d2l-all-courses').children['all-courses']._handleClose();
			expect(widget._alerts).to.not.include({ alertName: 'setCourseImageFailure', alertType: 'warning', alertMessage: 'failed to do that thing it should do' });
		});
	});
});
