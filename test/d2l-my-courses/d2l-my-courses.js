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
					name: 'sortField',
					type: 'radio',
					value: ''
				}, {
					name: 'sortDescending',
					type: 'checkbox',
					value: false
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
		},
		organization = {
			class: ['active', 'course-offering'],
			properties: {
				name: 'Course name',
				code: 'COURSE100'
			},
			links: [{
				rel: ['self'],
				href: '/organizations/1'
			}, {
				rel: ['https://api.brightspace.com/rels/organization-homepage'],
				href: 'http://example.com/1/home',
				type: 'text/html'
			}],
			entities: [{
				class: ['course-image'],
				propeties: {
					name: '1.jpg',
					type: 'image/jpeg'
				},
				rel: ['https://api.brightspace.com/rels/organization-image'],
				links: [{
					rel: ['self'],
					href: '/organizations/1/image'
				}, {
					rel: ['alternate'],
					href: ''
				}]
			}]
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

	describe('Enrollments requests and responses', function() {
		beforeEach( function() {
			server.respondWith(
				'GET',
				widget.enrollmentsUrl,
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(enrollmentsRootResponse));
				}
			);
		});

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
				new RegExp(searchHref),
				function(req) {
					expect(req.requestHeaders['accept']).to.equal('application/vnd.siren+json');
					req.respond(200, {}, JSON.stringify(enrollmentsSearchResponse));
				});

			var enrollmentsSearchSpy = sinon.spy(widget, '_onEnrollmentsSearchResponse');

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				if (enrollmentsSearchSpy.calledOnce) {
					widget.$.enrollmentsRootRequest.generateRequest();
				} else if (enrollmentsSearchSpy.calledTwice) {
					expect(widget.pinnedEnrollments.length).to.equal(2);
					widget._onEnrollmentsSearchResponse.restore();
					done();
				}
			});
		});

		it('should set the request URL for pinned courses, sortDescending', function(done) {
			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsRootRequest.addEventListener('iron-ajax-response', function() {
				expect(widget._enrollmentsSearchUrl).to.match(/sortField=pinDate/);
				expect(widget._enrollmentsSearchUrl).to.match(/sortDescending=true/);
				done();
			});
		});

		it('should rescale the course tile grid on search response', function(done) {
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

		it('should display appropriate message when there are no enrollments', function(done) {
			server.respondWith(
				'GET',
				new RegExp(searchHref),
				function(req) {
					req.respond(200, {}, JSON.stringify(noEnrollmentsResponse));
				});

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				expect(widget._hasEnrollments).to.equal(false);
				expect(widget._alertMessage).to.equal('Your courses aren\'t quite ready. Please check back soon.');
				done();
			});
		});

		it('should display appropriate message when there are no pinned enrollments', function(done) {
			server.respondWith(
				'GET',
				new RegExp(searchHref),
				function(req) {
					req.respond(200, {}, JSON.stringify(noPinnedEnrollmentsResponse));
				});

			widget.$.enrollmentsRootRequest.generateRequest();

			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				expect(widget._hasEnrollments).to.equal(true);
				expect(widget._alertMessage).to.equal('You don\'t have any pinned courses. Pin your favorite courses to make them easier to find.');
				done();
			});
		});
	});

	describe('With enrollments', function() {
		beforeEach(function(done) {
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

			// Wait until the second (search) request finishes before checking things
			widget.$.enrollmentsSearchRequest.addEventListener('iron-ajax-response', function() {
				done();
			});
		});

		it('should return the correct value from getCourseTileItemCount', function() {
			expect(widget.getCourseTileItemCount()).to.equal(1);
		});

		it('should correctly evaluate whether it has pinned/unpinned enrollments', function() {
			expect(widget._hasEnrollments).to.be.true;
			expect(widget._hasPinnedEnrollments).to.be.true;
		});
	});

	describe('User interaction', function() {
		it('should rescale the all courses view when it is opened', function(done) {
			var allCoursesRescaleSpy = sinon.spy(widget.$$('d2l-all-courses'), '_rescaleCourseTileRegions');

			widget.$$('button').click();

			setTimeout(function() {
				expect(allCoursesRescaleSpy.called);
				widget.$$('d2l-all-courses')._rescaleCourseTileRegions.restore();
				done();
			}, 100);
		});

		describe('A11Y', function() {
			it('should announce when enrollment is pinned', function() {
				var event = new CustomEvent('enrollment-pinned', {
					detail: {
						organization: organization
					}
				});
				widget.dispatchEvent(event);
				expect(widget.ariaMessage).to.equal(organization.properties.name + ' has been pinned');
			});

			it('should announce when enrollment is unpinned', function() {
				var event = new CustomEvent('enrollment-unpinned', {
					detail: {
						organization: organization
					}
				});
				widget.dispatchEvent(event);
				expect(widget.ariaMessage).to.equal(organization.properties.name + ' has been unpinned');
			});
		});
	});
});
