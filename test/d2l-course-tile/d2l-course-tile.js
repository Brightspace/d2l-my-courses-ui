/* global describe, it, before, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('<d2l-course-tile>', function() {
	var server,
		widget,
		enrollment = {
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
		},
		enrollmentEntity,
		organizationEntity;

	before(function() {
		var parser = document.createElement('d2l-siren-parser');
		enrollmentEntity = parser.parse(enrollment);
		organizationEntity = parser.parse(organization);
	});

	beforeEach(function() {
		server = sinon.fakeServer.create();
		server.respondImmediately = true;

		widget = fixture('d2l-course-tile-fixture');
	});

	afterEach(function() {
		server.restore();
	});

	it('loads element', function() {
		expect(widget).to.exist;
	});

	it('should fetch the organization on ready', function(done) {
		server.respondWith(
			'GET',
			'/organizations/1?embedDepth=1',
			[200, {}, JSON.stringify(organization)]);

		widget.$.organizationRequest.addEventListener('iron-ajax-response', function() {
			expect(widget._organization.properties).to.be.an('object');
			done();
		});

		widget.enrollment = enrollmentEntity;
		// The widget will generate a ready signal before we've set the
		// enrollment, so manually call it again after we have
		widget.ready();
	});

	describe('setting the enrollment attribute', function() {
		beforeEach(function(done) {
			server.respondWith(
				'GET',
				'/organizations/1?embedDepth=1',
				[200, {}, JSON.stringify(organization)]);

			widget.$.organizationRequest.addEventListener('iron-ajax-response', function() {
				// Ensure organization has been received before doing tests
				done();
			});

			widget.enrollment = enrollmentEntity;
			// Setting the enrollment post-ready, so call it again once it's set
			widget.ready();
		});

		it('should have the correct href', function() {
			var anchor = widget.$$('a');
			var homepageLink = organizationEntity.getLinkByRel('https://api.brightspace.com/rels/organization-homepage');
			expect(anchor.href).to.equal(homepageLink.href);
		});

		it('should update the course name', function() {
			var courseText = widget.$$('.course-text');
			expect(courseText.innerText).to.equal(organizationEntity.properties.name);
		});

		it('should show the course code if configured true', function() {
			widget.showCourseCode = true;
			widget.$$('#courseCodeTemplate').render();
			var courseCode = widget.$$('.course-code-text');
			expect(courseCode.innerText).to.equal(organizationEntity.properties.code);
		});

		it('should not show the course code if not configured', function() {
			widget.$.courseCodeTemplate.render();
			var courseCode = widget.$$('.course-code-text');
			expect(courseCode).to.be.null;
		});

		it('should not show the course code if configured false', function() {
			widget.showCourseCode = false;
			widget.$.courseCodeTemplate.render();
			var courseCode = widget.$$('.course-code-text');
			expect(courseCode).to.be.null;
		});

		it('should set the internal pinned state correctly', function() {
			expect(widget.pinned).to.be.true;
		});

		it('should hide image from screen readers', function() {
			var courseImage = widget.$$('.course-image d2l-course-image');
			expect(courseImage.getAttribute('aria-hidden')).to.equal('true');
		});

		it('should have an unpin button if the course is pinned', function() {
			var pinButton = widget.$$('#pin-button');
			expect(pinButton.text).to.equal('Unpin');
		});
	});

	describe('delay-load attribute', function() {
		it('should not fetch the organization if delay-load=true', function() {
			var delayedWidget = fixture('d2l-course-tile-fixture-delayed');

			server.respondWith(
				'GET',
				'/organizations/1?embedDepth=1',
				[200, {}, JSON.stringify(organization)]);

			var organizationSpy = sinon.spy(delayedWidget.$.organizationRequest, 'generateRequest');

			delayedWidget.enrollment = enrollmentEntity;
			delayedWidget.ready();

			expect(organizationSpy.called).to.be.false;
		});

		it('should fetch the organization if delay-load is set to false', function(done) {
			var delayedWidget = fixture('d2l-course-tile-fixture-delayed');

			server.respondWith(
				'GET',
				'/organizations/1?embedDepth=1',
				[200, {}, JSON.stringify(organization)]);

			var organizationSpy = sinon.spy(delayedWidget.$.organizationRequest, 'generateRequest');

			delayedWidget.$.organizationRequest.addEventListener('iron-ajax-response', function() {
				expect(delayedWidget._organization.properties).to.be.an('object');
				done();
			});

			delayedWidget.enrollment = enrollmentEntity;
			delayedWidget.ready();

			expect(organizationSpy.called).to.be.false;

			delayedWidget.delayLoad = false;
		});
	});

	describe('changing the pinned state', function() {
		var event = { preventDefault: function() {} };

		beforeEach(function(done) {
			server.respondWith(
				'GET',
				'/organizations/1?embedDepth=1',
				[200, {}, JSON.stringify(organization)]);

			server.respondWith(
				'GET',
				'/d2l/lp/auth/xsrf-tokens',
				[200, {}, JSON.stringify({
					referrerToken: 'foo'
				})]);

			widget.$.organizationRequest.addEventListener('iron-ajax-response', function() {
				// Ensure organization has been received before doing tests
				done();
			});

			widget.enrollment = enrollmentEntity;
			widget.ready();
		});

		afterEach(function() {
			server.restore();
		});

		it('should set the update action parameters correctly', function() {
			widget._hoverPinClickHandler(event);

			expect(widget._enrollmentPinUrl).to.equal('/enrollments/users/169/organizations/1');
			expect(widget._enrollmentPinMethod).to.equal('PUT');
		});

		it('should call the pinning API', function(done) {
			server.respondWith(
				'PUT',
				'/enrollments/users/169/organizations/1',
				function(req) {
					expect(req.requestBody).to.contain('pinned=false');
					done();
				});

			widget._hoverPinClickHandler(event);
		});

		it('should update the local pinned state with the received pin state', function(done) {
			server.respondWith(
				'PUT',
				'/enrollments/users/169/organizations/1',
				[200, {}, JSON.stringify(enrollment)]);

			expect(widget.pinned).to.be.true;
			widget._hoverPinClickHandler(event);
			expect(widget.pinned).to.be.false;

			setTimeout(function() {
				// We responded with pinned = true, so it gets set back to true by the response
				expect(widget.pinned).to.be.true;
				done();
			}, 10);
		});

		it('should update the overflow menu button with the new pinned state', function() {
			server.respondWith(
				'PUT',
				'/enrollments/users/169/organizations/1',
				[200, {}, JSON.stringify(enrollment)]);

			widget._hoverPinClickHandler(event);
			expect(widget.pinned).to.be.false;

			var pinButton = widget.$$('#pin-button');
			expect(pinButton.text).to.equal('Pin');
		});

		it('should aria-announce the change in pin state', function(done) {
			server.respondWith(
				'PUT',
				'/enrollments/users/169/organizations/1',
				[200, {}, JSON.stringify(enrollment)]);

			widget.addEventListener('iron-announce', function(e) {
				expect(widget.pinned).to.be.false;
				expect(e.detail.text).to.equal('Course name has been unpinned');
				done();
			});

			widget._hoverPinClickHandler(event);
		});
	});

	describe('setCourseImage', function() {
		var details,
			href;

		beforeEach(function() {
			href = 'http://testImage.ninja';

			details = {
				image: {
					href: href,
					getLinksByClass: sinon.stub().returns([])
				},
				status: null
			};

			widget.getDefaultImageLink = sinon.stub().returns(href);
		});

		it('should have a change-image-button if the set-catalog-image action exists on the organization', function() {
			var orgWithSetCatalogImageAction = JSON.parse(JSON.stringify(organization));
			orgWithSetCatalogImageAction.actions = [{
				name: 'set-catalog-image',
				method: 'POST',
				href: ''
			}];
			var parser = document.createElement('d2l-siren-parser');

			var result = widget._getCanChangeCourseImage(parser.parse(orgWithSetCatalogImageAction));
			expect(result).to.be.ok;
		});

		it('should not have a change-image-button if the set-catalog-image action does not exist on the organization', function() {
			var result = widget._getCanChangeCourseImage(organizationEntity);
			expect(result).to.not.be.ok;
		});

		describe('status: set', function() {
			it('toggles on the "change-image-loading" class on the tile-container', function() {
				details.status = 'set';
				expect(widget.$$('.tile-container.change-image-loading')).to.equal(null);
				widget.setCourseImage(details);
				expect(widget.$$('.tile-container.change-image-loading')).to.not.equal(null);
			});
		});

		describe('status: success', function() {
			it('calls _displaySetImageResult with success = true', function() {
				details.status = 'success';
				widget._displaySetImageResult = sinon.stub();
				widget.setCourseImage(details);
				expect(widget._displaySetImageResult.calledWith(true)).to.equal(true);
			});
		});

		describe('status: failure', function() {
			it('calls _displaySetImageResult with success = false', function() {
				details.status = 'failure';
				widget._displaySetImageResult = sinon.stub();
				widget.setCourseImage(details);
				expect(widget._displaySetImageResult.calledWith(false)).to.equal(true);
			});
		});
	});

	describe('_displaySetImageResult', function() {
		var newImage = { getLinksByClass: sinon.stub().returns([]) },
			clock,
			success;

		beforeEach(function() {
			clock = sinon.useFakeTimers();
		});

		afterEach(function() {
			clock.restore();
		});

		describe('success: true', function() {
			beforeEach(function() {
				success = true;
				expect(widget.$$('.change-image-success')).to.equal(null);
				widget._nextImage = newImage;
				widget._displaySetImageResult(success, newImage);
				clock.tick(1001);
			});

			it('sets the "change-image-success" class', function() {
				expect(widget.$$('.change-image-success')).to.not.equal(null);
				expect(widget.$$('.change-image-failure')).to.equal(null);
			});

			it('removes the "change-image-loading" class', function() {
				expect(widget.$$('.change-image-loading')).to.equal(null);
			});

			it('sets the icon to a checkmark', function() {
				expect(widget._iconDetails).to.deep.equal(
					{ className: 'checkmark', iconName: 'd2l-tier2:check'}
				);
			});

			describe('after another second', function() {
				beforeEach(function() {
					clock.tick(1000);
				});

				it('sets the new image href', function() {
					expect(widget.$$('.course-image d2l-course-image').image).to.equal(newImage);
				});

				it('removes the "change-image-success" class', function() {
					expect(widget.$$('.change-image-success')).to.equal(null);
				});
			});
		});

		describe('success: false', function() {
			beforeEach(function() {
				success = false;
				widget._displaySetImageResult(success, newImage);
				clock.tick(1001);
			});

			it('sets the "change-image-failure" class', function() {
				expect(widget.$$('.change-image-success')).to.equal(null);
				expect(widget.$$('.change-image-failure')).to.not.equal(null);
			});

			it('removes the "change-image-loading" class', function() {
				expect(widget.$$('.change-image-loading')).to.equal(null);
			});

			it('sets the icon to an X', function() {
				expect(widget._iconDetails).to.deep.equal(
					{ className: 'fail-icon', iconName: 'd2l-tier3:close'}
				);
			});

			describe('after a second', function() {
				beforeEach(function() {
					clock.tick(1000);
				});

				it('doesnt set a new image href', function() {
					expect(widget.$$('.course-image d2l-course-image').image).to.not.equal(newImage);
				});

				it('removes the "change-image-failure" class', function() {
					expect(widget.$$('.change-image-failure')).to.equal(null);
				});
			});
		});
	});

	describe('_launchCourseTileImageSelector', function() {
		var e;
		beforeEach(function() {
			e = {
				preventDefault: function() {},
				stopPropagation: function() {}
			};
			widget.$.telemetryRequest.generateRequest = sinon.stub();
		});

		it('should send a telemetry event', function() {
			widget._launchCourseTileImageSelector(e);
			expect(widget.$.telemetryRequest.generateRequest.called).to.equal(true);
		});
	});

	describe('setting course updates attribute', function() {
		it('should show update number when less than 99', function() {
			widget.setCourseUpdates(85);
			expect(widget.$.courseUpdates.getAttribute('class')).to.not.contain('d2l-updates-hidden');
			expect(widget._courseUpdates).to.equal(85);
			expect(widget._hasCourseUpdates).to.be.true;
			expect(widget.$$('.update-text-box').innerText).to.equal('85');

		});

		it('should show 99 when 99 updates', function() {
			widget.setCourseUpdates(99);
			expect(widget.$.courseUpdates.getAttribute('class')).to.not.contain('d2l-updates-hidden');
			expect(widget._courseUpdates).to.equal(99);
			expect(widget._hasCourseUpdates).to.be.true;
			expect(widget.$$('.update-text-box').innerText).to.equal('99');
		});

		it('should show 99+ when more than 99 updates', function() {
			widget.setCourseUpdates(100);
			expect(widget.$.courseUpdates.getAttribute('class')).to.not.contain('d2l-updates-hidden');
			expect(widget._courseUpdates).to.equal('99+');
			expect(widget._hasCourseUpdates).to.be.true;
			expect(widget.$$('.update-text-box').innerText).to.equal('99+');

		});

		it('should not show updates number when 0', function() {
			widget.setCourseUpdates(0);
			expect(widget.$.courseUpdates.getAttribute('class')).to.contain('d2l-updates-hidden');
			expect(widget.$$('.update-text-box').innerText).to.equal('0');
		});

		it('should not display when given less than 0', function() {
			widget.setCourseUpdates(-1);
			expect(widget.$.courseUpdates.getAttribute('class')).to.contain('d2l-updates-hidden');
			expect(widget.$$('.update-text-box').innerText).to.equal('-1');
		});

		it('should not display when given null', function() {
			widget.setCourseUpdates(null);
			expect(widget.$.courseUpdates.getAttribute('class')).to.contain('d2l-updates-hidden');
			expect(widget.$$('.update-text-box').innerText).to.equal('');
		});

		it('should not display when given undefined', function() {
			widget.setCourseUpdates(undefined);
			expect(widget.$.courseUpdates.getAttribute('class')).to.contain('d2l-updates-hidden');
			expect(widget.$$('.update-text-box').innerText).to.equal('');
		});
	});
});
