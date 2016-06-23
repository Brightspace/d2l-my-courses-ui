/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('smoke test', function() {
	var server,
		widget,
		emptyResponse = {
			headers: { },
			body: {
				class: ['enrollments'],
				rel: ['enrollments'],
				links: [],
				actions: [],
				properties: {},
				entities: []
			}
		},
		enrollmentsResponseInactiveCourse = {
			headers: { },
			body: {
				class: ['enrollments'],
				rel: ['enrollments'],
				links: [],
				actions: [],
				properties: {},
				entities: [{
					class: ['course-offering', 'inactive'],
					rel: ['enrollment'],
					properties: {
						name: 'Test Name',
						id: 'TestName'
					},
					links: [],
					actions: [],
					entities: [{
						rel: ['preferences'],
						actions: []
					}]
				}]
			}
		},
		enrollmentsResponseWithOrgOnly = {
			headers: { },
			body: {
				class: ['enrollments'],
				rel: ['enrollments'],
				links: [],
				actions: [],
				properties: {},
				entities: [{
					class: ['organization'],
					rel: ['enrollment'],
					properties: {
						name: 'Test Name',
						id: 'TestName'
					},
					links: [],
					actions: [],
					entities: [{
						rel: ['preferences'],
						actions: []
					}]
				}]
			}
		},
		enrollmentsResponseWithCourse = {
			headers: { },
			body: {
				class: ['enrollments'],
				rel: ['enrollments'],
				links: [],
				actions: [],
				properties: {},
				entities: [{
					class: ['organization'],
					rel: ['enrollment'],
					properties: {
						name: 'Test Name',
						id: 'TestName'
					},
					links: [],
					actions: [],
					entities: [{
						rel: ['preferences'],
						actions: []
					}]
				}, {
					class: ['course-offering', 'active'],
					rel: ['enrollment'],
					properties: {
						name: 'Test Name',
						id: 'TestName'
					},
					links: [],
					actions: [],
					entities: [{
						rel: ['preferences'],
						actions: []
					}]
				}]
			}
		},
		courseEntity = {
			properties: {
				name: 'Test Name'
			}
		},
		allEnrollmentsResponse = {
			headers: { },
			body: {
				class: ['enrollments'],
				rel: ['enrollments'],
				links: [],
				actions: [],
				properties: {},
				entities: [{
					class: ['course-offering', 'active'],
					rel: ['enrollment'],
					entities: [{
						rel: ['preferences'],
						class: [],
						properties: { }
					}],
					properties: {
						name: 'Course 1',
						id: 1
					},
					links: []
				}, {
					class: ['course-offering', 'active'],
					rel: ['enrollment'],
					entities: [{
						rel: ['preferences'],
						class: [
							'preferences',
							'pinned'
						],
						properties: {
							'pinDate': '2016-06-18T16:36:05Z'
						}
					}],
					properties: {
						name: 'Course 2',
						id: 2
					},
					links: []
				}, {
					class: ['course-offering', 'active'],
					rel: ['enrollment'],
					entities: [{
						rel: ['preferences'],
						class: [],
						properties: { }
					}],
					properties: {
						name: 'Course 3',
						id: 3
					},
					links: []
				}, {
					class: ['course-offering', 'active'],
					rel: ['enrollment'],
					entities: [{
						rel: ['preferences'],
						class: [
							'preferences',
							'pinned'
						],
						properties: {
							'pinDate': '2016-06-18T16:35:05Z'
						}
					}],
					properties: {
						name: 'Course 4',
						id: 4
					},
					links: []
				}, {
					class: ['course-offering', 'inactive'],
					rel: ['enrollment'],
					properties: {
						name: 'Inactive Course',
						id: 5
					},
					links: [],
					actions: [],
					entities: [{
						rel: ['preferences'],
						actions: []
					}]
				}]
			}
		};

	beforeEach(function() {
		server = sinon.fakeServer.create();
		server.respondImmediately = true;

		widget = fixture('d2l-my-courses-fixture');
	});

	afterEach(function() {
		server.restore();
	});

	it('should load', function() {
		expect(widget).to.exist;
	});

	describe('Inactive courses', function() {
		it('should not display inactive courses', function(done) {
			server.respondWith(
				'GET',
				widget._enrollmentsUrl,
				function(req) {
					req.respond(200, enrollmentsResponseInactiveCourse.headers, JSON.stringify(enrollmentsResponseInactiveCourse.body));
				});

			widget.$.enrollmentsRequest.generateRequest();

			widget.$.enrollmentsRequest.addEventListener('response', function() {
				expect(widget.courseTileItemCount).to.equal(0);
				done();
			});
		});
	});

	describe('Enrollments requests', function() {
		it('should send a request for courses', function(done) {
			server.respondWith(
				'GET',
				widget._enrollmentsUrl,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, emptyResponse.headers, JSON.stringify(emptyResponse.body));
				});

			var onEnrollmentsResponseSpy = sinon.spy(widget, 'onEnrollmentsResponse');

			widget.$.enrollmentsRequest.generateRequest();

			widget.$.enrollmentsRequest.addEventListener('response', function() {
				expect(Array.isArray(widget.pinnedCoursesEntities)).to.be.true;
				expect(onEnrollmentsResponseSpy.calledOnce).to.be.true;
				widget.onEnrollmentsResponse.restore();
				done();
			});
		});
	});

	describe('Empty states', function() {
		it('should display appropriate message when no enrolled courses', function(done) {
			server.respondWith(
				'GET',
				widget._enrollmentsUrl,
				function(req) {
					req.respond(200, emptyResponse.headers, JSON.stringify(emptyResponse.body));
				});

			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					req.respond(200, enrollmentsResponseWithOrgOnly.headers, JSON.stringify(enrollmentsResponseWithOrgOnly.body));
				});

			widget.$.enrollmentsRequest.generateRequest();

			widget.$.enrollmentsRequest.addEventListener('response', function() {
				expect(widget._hasCourses).to.equal(false);
				expect(widget._alertMessage).to.equal('Your courses aren\'t quite ready. Please check back soon.');
				done();
			});
		});

		it('should display appropriate message when no pinned courses', function(done) {
			server.respondWith(
				'GET',
				widget._enrollmentsUrl,
				function(req) {
					req.respond(200, emptyResponse.headers, JSON.stringify(emptyResponse.body));
				});

			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					req.respond(200, enrollmentsResponseWithCourse.headers, JSON.stringify(enrollmentsResponseWithCourse.body));
				});

			widget.$.enrollmentsRequest.generateRequest();

			widget.$.enrollmentsRequest.addEventListener('response', function() {
				expect(widget._hasCourses).to.equal(true);
				expect(widget._alertMessage).to.equal('You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.');
				done();
			});
		});
	});

	describe('A11Y', function() {
		it('should announce when course is pinned', function() {
			var event = new CustomEvent('course-pinned', {
				detail: {
					course: courseEntity
				}
			});
			widget.dispatchEvent(event);
			expect(widget.ariaMessage).to.equal(courseEntity.properties.name + ' has been pinned');
		});

		it('should announce when course is unpinned', function() {
			var event = new CustomEvent('course-unpinned', {
				detail: {
					course: courseEntity
				}
			});
			widget.dispatchEvent(event);
			expect(widget.ariaMessage).to.equal(courseEntity.properties.name + ' has been unpinned');
		});
	});

	describe('Course entity management', function() {
		beforeEach(function() {
			server.respondImmediately = true;
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, allEnrollmentsResponse.headers, JSON.stringify(allEnrollmentsResponse.body));
				});
		});

		it('should move an unpinned course to the pinned list when pinned', function(done) {
			widget.$.enrollmentsRequest.generateRequest();

			widget.$.enrollmentsRequest.addEventListener('response', function() {
				var course = {
					properties: {
						id: 1
					}
				};

				widget._moveCourseToPinnedList(course);
				expect(widget.pinnedCoursesEntities.length).to.equal(3);
				expect(widget.unpinnedCoursesEntities.length).to.equal(1);
				expect(widget.pinnedCoursesEntities[0].properties.id).to.equal(1);
				done();
			});
		});

		it('should move a pinned course to the unpinned list when unpinned', function(done) {
			widget.$.enrollmentsRequest.generateRequest();

			widget.$.enrollmentsRequest.addEventListener('response', function() {
				var course = {
					properties: {
						id: 2
					}
				};

				widget._moveCourseToUnpinnedList(course);
				expect(widget.pinnedCoursesEntities.length).to.equal(1);
				expect(widget.unpinnedCoursesEntities.length).to.equal(3);
				expect(widget.unpinnedCoursesEntities[0].properties.id).to.equal(2);
				done();
			});
		});

		it('should pin a course whose removal animation has completed, and add it to the beginning of the pinned courses list', function(done) {
			widget.$.enrollmentsRequest.generateRequest();

			widget._tilesInPinStateTransition.push(1);

			widget.$.enrollmentsRequest.addEventListener('response', function() {
				var pinAnimationEvent = new CustomEvent('tile-remove-complete', {
					detail: {
						course: widget.unpinnedCoursesEntities[0],
						pinned: true
					}
				});

				widget.dispatchEvent(pinAnimationEvent);
				expect(widget.pinnedCoursesEntities.length).to.equal(3);
				expect(widget.unpinnedCoursesEntities.length).to.equal(1);
				expect(widget.pinnedCoursesEntities[0].properties.id).to.equal(1);
				done();
			});
		});

		it('should unpin a course whose removal animation has completed, and add it to the beginning of the unpinned courses list', function(done) {
			widget.$.enrollmentsRequest.generateRequest();

			widget._tilesInPinStateTransition.push(2);

			widget.$.enrollmentsRequest.addEventListener('response', function() {
				var pinAnimationEvent = new CustomEvent('tile-remove-complete', {
					detail: {
						course: widget.pinnedCoursesEntities[0],
						pinned: false
					}
				});

				widget.dispatchEvent(pinAnimationEvent);
				expect(widget.pinnedCoursesEntities.length).to.equal(1);
				expect(widget.unpinnedCoursesEntities.length).to.equal(3);
				expect(widget.unpinnedCoursesEntities[0].properties.id).to.equal(2);
				done();
			});
		});
	});

	describe('layout', function() {
		describe('column calculations', function() {
			it('should be correct according to the crazy design', function() {
				[{
					width: 767,
					itemCount: 0,
					expectedColumns: 1
				}, {
					width: 767,
					itemCount: 3,
					expectedColumns: 1
				}, {
					width: 767,
					itemCount: 4,
					expectedColumns: 2
				}, {
					width: 991,
					itemCount: 0,
					expectedColumns: 3
				}, {
					width: 991,
					itemCount: 1,
					expectedColumns: 2
				}, {
					width: 991,
					itemCount: 2,
					expectedColumns: 2
				}, {
					width: 991,
					itemCount: 3,
					expectedColumns: 3
				}, {
					width: 991,
					itemCount: 4,
					expectedColumns: 2
				}, {
					width: 991,
					itemCount: 5,
					expectedColumns: 3
				}, {
					width: 992,
					itemCount: 0,
					expectedColumns: 4
				}, {
					width: 992,
					itemCount: 1,
					expectedColumns: 2
				}, {
					width: 992,
					itemCount: 2,
					expectedColumns: 2
				}, {
					width: 992,
					itemCount: 3,
					expectedColumns: 3
				}, {
					width: 992,
					itemCount: 4,
					expectedColumns: 4
				}, {
					width: 992,
					itemCount: 5,
					expectedColumns: 3
				}, {
					width: 992,
					itemCount: 6,
					expectedColumns: 3
				}, {
					width: 992,
					itemCount: 7,
					expectedColumns: 4
				}]
				.forEach(function(scenario) {
					var description = 'width: ' + scenario.width + '; itemCount: ' + scenario.itemCount;
					var numberOfColumns = widget._calcNumColumns(scenario.width, scenario.itemCount);
					expect(numberOfColumns, description).to.equal(scenario.expectedColumns);
				});
			});
		});
	});
});
