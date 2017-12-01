describe('<d2l-course-tile>', function() {
	var sandbox,
		server,
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
			}, {
				rel: ['https://notifications.api.brightspace.com/rels/organization-notifications'],
				href: '/organizations/1/my-notifications'
			}, {
				rel: ['https://api.brightspace.com/rels/parent-semester'],
				href: '/organizations/2'
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
			}, {
				class: ['relative-uri'],
				rel: ['item', 'https://api.brightspace.com/rels/organization-homepage'],
				properties: {
					path: 'http://example.com/2/home'
				}
			}]
		},
		semesterOrganization = {
			class: ['active', 'semester'],
			properties: {
				name: 'Test Semester',
				code: 'SEM169'
			},
			links: [{
				rel: ['https://api.brightspace.com/rels/organization-homepage'],
				href: 'http://example.com/1/home',
				type: 'text/html'
			}, {
				rel: ['https://notifications.api.brightspace.com/rels/organization-notifications'],
				href: '/organizations/1/my-notifications'
			}, {
				rel: ['self'],
				href: '/organizations/2'
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
			}, {
				class: ['relative-uri'],
				rel: ['item', 'https://api.brightspace.com/rels/organization-homepage'],
				properties: {
					path: 'http://example.com/2/home'
				}
			}]
		},
		enrollmentEntity,
		organizationEntity,
		semesterOrganizationEntity;

	before(function() {
		enrollmentEntity = window.D2L.Hypermedia.Siren.Parse(enrollment);
		organizationEntity = window.D2L.Hypermedia.Siren.Parse(organization);
		semesterOrganizationEntity = window.D2L.Hypermedia.Siren.Parse(semesterOrganization);
	});

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		server = sinon.fakeServer.create();
		server.respondImmediately = true;

		widget = fixture('d2l-course-tile-fixture');
		window.d2lfetch.fetch = sandbox.stub()
			.withArgs(sinon.match.has('url', sinon.match('/organizations/1?embedDepth=1')))
			.returns(Promise.resolve({
				ok: true,
				json: function() { return Promise.resolve(organization); }
			}));
	});

	afterEach(function() {
		sandbox.restore();
		server.restore();
	});

	it('loads element', function() {
		expect(widget).to.exist;
	});

	describe('setting the enrollment attribute', function() {
		beforeEach(function(done) {
			var spy = sandbox.spy(widget, '_onOrganizationResponse');

			widget._load = true;
			widget.enrollment = enrollmentEntity;

			setTimeout(function() {
				expect(spy).to.have.been.calledOnce;
				done();
			});
		});

		it('should have the correct href', function() {
			var anchor = widget.$$('a');
			var homepageLink = organizationEntity.getSubEntityByRel(widget.HypermediaRels.organizationHomepage);
			expect(anchor.href).to.equal(homepageLink.properties.path);
		});

		it('should update the course name', function() {
			var courseText = widget.$$('.course-text');
			expect(courseText.innerText).to.contain(organizationEntity.properties.name);
		});

		it('should show the course code if configured true', function() {
			widget.showCourseCode = true;
			var courseCode = widget.$$('.course-code-text');
			expect(window.getComputedStyle(courseCode).getPropertyValue('display')).to.equal('inline-block');
		});

		it('should not show the course code if not configured', function() {
			var courseCode = widget.$$('.course-code-text');
			expect(window.getComputedStyle(courseCode).getPropertyValue('display')).to.equal('none');
		});

		it('should not show the course code if configured false', function() {
			widget.showCourseCode = false;
			var courseCode = widget.$$('.course-code-text');
			expect(window.getComputedStyle(courseCode).getPropertyValue('display')).to.equal('none');
		});

		it('should show the semester if the showSemester is set', function() {
			widget._semesterName = 'Test Semester';
			widget.showSemester = true;
			var semester = widget.$$('.course-semester-text');
			expect(semester.innerText).to.equal(semesterOrganizationEntity.properties.name);
			expect(window.getComputedStyle(semester).getPropertyValue('display')).to.equal('inline-block');
		});

		it('should not show the semester if the showSemester is not set', function() {
			widget._semesterName = '';
			var semester = widget.$$('.course-semester-text');
			expect(semester.innerText).to.equal('');
		});

		it('should not show the seperator if the course code is on and semester name is null', function() {
			widget.showCourseCode = true;
			widget._semesterName = '';
			widget.showSemester = true;
			var separator = widget.$$('.separator-icon');
			expect(separator.hasAttribute('hidden')).to.be.true;
		});

		it('should show the seperator if the course code is on and semester name is a real thing', function() {
			widget.showCourseCode = true;
			widget._semesterName = 'Doop';
			widget.showSemester = true;
			var separator = widget.$$('.separator-icon');
			expect(separator.hasAttribute('hidden')).to.be.false;
		});

		it('should hide the separator if course code is off', function() {
			widget.showCourseCode = false;
			widget._semesterName = 'Doop';
			widget.showSemester = true;
			var separator = widget.$$('.separator-icon');
			expect(window.getComputedStyle(separator).getPropertyValue('display')).to.equal('none');
		});

		it('should not hide the separator if course code is off', function() {
			widget.showCourseCode = true;
			widget._semesterName = 'Doop';
			widget.showSemester = true;
			var separator = widget.$$('.separator-icon');
			expect(window.getComputedStyle(separator).getPropertyValue('display')).to.equal('inline-block');
		});

		it('should not set the semester name if the show semester config is false', function() {
			widget.fetchSirenEntity = sinon.stub().returns(Promise.resolve(semesterOrganizationEntity));

			widget.showSemester = false;
			widget._semesterUrl = '/organizations/2';
			return widget._fetchSemester().then(function() {
				expect(widget.fetchSirenEntity).to.have.not.been.called;
			});

		});

		it('should set the semester name if the show semester config is set to true', function() {
			widget.fetchSirenEntity = sinon.stub().returns(Promise.resolve(semesterOrganizationEntity));

			widget.showSemester = true;
			widget._semesterUrl = '/organizations/2';
			return widget._fetchSemester().then(function() {
				expect(widget.fetchSirenEntity).to.have.been.called;
				expect(widget._semesterName).to.equal(semesterOrganizationEntity.properties.name);
			});

		});

		it('should not show the semester if the show semester config is not configured', function() {
			widget.fetchSirenEntity = sinon.stub().returns(Promise.resolve(semesterOrganizationEntity));

			widget._semesterUrl = '/organizations/2';
			return widget._fetchSemester().then(function() {
				expect(widget.fetchSirenEntity).to.have.not.been.called;
			});
		});

		it('should set the internal pinned state correctly', function() {
			expect(widget.pinned).to.be.true;
		});

		it('should hide image from screen readers', function() {
			var courseImage = widget.$$('.course-image-container');
			expect(courseImage.getAttribute('aria-hidden')).to.equal('true');
		});

		it('should have an unpin button if the course is pinned', function(done) {
			// Menu isn't initially rendered - trigger it and wait until it's rendered
			widget._showHoverMenu = true;

			setTimeout(function() {
				var pinButton = widget.$$('#pin-button');
				expect(pinButton.text).to.equal('Unpin');
				done();
			});
		});
	});

	describe('changing the pinned state', function() {
		var event = { preventDefault: function() {} };

		beforeEach(function(done) {
			var spy = sandbox.spy(widget, '_onOrganizationResponse');

			widget._load = true;
			widget.enrollment = enrollmentEntity;

			setTimeout(function() {
				expect(spy).to.have.been.calledOnce;
				done();
			});
		});

		it('should set the update action parameters correctly and call the pinning API', function(done) {
			window.d2lfetch.fetch = sandbox.stub()
				.withArgs(sinon.match.has('url', sinon.match('/enrollments/users/169/organizations/1'))
					.and(sinon.match.has('method', 'PUT')))
				.returns(Promise.resolve({
					ok: true,
					json: function() { return Promise.resolve(enrollment); }
				}));

			widget._pinClickHandler(event);

			setTimeout(function() {
				expect(window.d2lfetch.fetch).to.have.been
					.calledWith(sinon.match.has('url', sinon.match('/enrollments/users/169/organizations/1'))
						.and(sinon.match.has('method', 'PUT')));
				done();
			});
		});

		it('should update the local pinned state with the received pin state', function(done) {
			window.d2lfetch.fetch = sandbox.stub()
				.withArgs(sinon.match.has('url', sinon.match('/enrollments/users/169/organizations/1'))
					.and(sinon.match.has('method', 'PUT')))
				.returns(Promise.resolve({
					ok: true,
					json: function() { return Promise.resolve(enrollment); }
				}));

			expect(widget.pinned).to.be.true;
			widget._pinClickHandler(event);
			expect(widget.pinned).to.be.false;

			setTimeout(function() {
				expect(window.d2lfetch.fetch).to.have.been
					.calledWith(sinon.match.has('url', sinon.match('/enrollments/users/169/organizations/1'))
						.and(sinon.match.has('method', 'PUT')));
				// We responded with pinned = true, so it gets set back to true by the response
				expect(widget.pinned).to.be.true;
				done();
			});
		});

		it('should update the overflow menu button with the new pinned state', function(done) {
			window.d2lfetch.fetch = sandbox.stub()
				.withArgs(sinon.match.has('url', sinon.match('/enrollments/users/169/organizations/1'))
					.and(sinon.match.has('method', 'PUT')))
				.returns(Promise.resolve({
					ok: true,
					json: function() { return Promise.resolve(enrollment); }
				}));

			widget._showHoverMenu = true;

			setTimeout(function() {
				widget._pinClickHandler(event);
				expect(widget.pinned).to.be.false;

				var pinButton = widget.$$('#pin-button');
				expect(pinButton.text).to.equal('Pin');
				done();
			});
		});

		it('should aria-announce the change in pin state', function(done) {
			window.d2lfetch.fetch = sandbox.stub()
				.withArgs(sinon.match.has('url', sinon.match('/enrollments/users/169/organizations/1'))
					.and(sinon.match.has('method', 'PUT')))
				.returns(Promise.resolve({
					ok: true,
					json: function() { return Promise.resolve(enrollment); }
				}));

			widget.addEventListener('iron-announce', function(e) {
				expect(widget.pinned).to.be.false;
				expect(e.detail.text).to.equal('Course name has been unpinned');
				done();
			});

			widget._pinClickHandler(event);
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

			var result = widget._getCanChangeCourseImage(window.D2L.Hypermedia.Siren.Parse(orgWithSetCatalogImageAction));
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
				widget._displaySetImageResult(success);
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

	describe('setting course updates attribute', function() {
		it('should set the notifications URL from the organization response', function(done) {
			server.respondWith(
				'GET',
				'/organizations/1?embedDepth=1',
				[200, {}, JSON.stringify(organization)]);

			widget._load = true;
			widget.enrollment = enrollmentEntity;

			setTimeout(function() {
				expect(widget._notificationsUrl).to.equal('/organizations/1/my-notifications');
				done();
			});
		});

		it('should show update number when less than 99', function() {
			widget._setCourseUpdates(85);
			expect(widget.$.courseUpdates.hasAttribute('hidden')).to.be.false;
			expect(widget._courseUpdates).to.equal(85);
			expect(widget.$$('.update-text-box').innerText).to.equal('85');

		});

		it('should show 99 when 99 updates', function() {
			widget._setCourseUpdates(99);
			expect(widget.$.courseUpdates.hasAttribute('hidden')).to.be.false;
			expect(widget._courseUpdates).to.equal(99);
			expect(widget.$$('.update-text-box').innerText).to.equal('99');
		});

		it('should show 99+ when more than 99 updates', function() {
			widget._setCourseUpdates(100);
			expect(widget.$.courseUpdates.hasAttribute('hidden')).to.be.false;
			expect(widget._courseUpdates).to.equal('99+');
			expect(widget.$$('.update-text-box').innerText).to.equal('99+');

		});

		it('should not show updates number when 0', function() {
			widget._setCourseUpdates(0);
			expect(widget.$.courseUpdates.hasAttribute('hidden')).to.be.true;
			expect(widget.$$('.update-text-box').innerText).to.equal('0');
		});

		it('should not display when given less than 0', function() {
			widget._setCourseUpdates(-1);
			expect(widget.$.courseUpdates.hasAttribute('hidden')).to.be.true;
			expect(widget.$$('.update-text-box').innerText).to.equal('0');
		});
	});

	describe('pin indicator button', function() {
		beforeEach(function() {
			widget = fixture('d2l-course-tile-fixture');
		});

		it('should show the pin indicator button when a course is pinned and feature flag is on', function() {
			widget.pinned = true;
			widget.updatedSortLogic = true;
			Polymer.dom.flush();

			expect(widget.pinned).to.be.true;
			var pinIndicatorButton = widget.$$('#pin-indicator-button');
			expect(pinIndicatorButton).to.exist;
		});

		it('should not show the pin indicator button when a course is not pinned', function() {
			widget.pinned = false;
			widget.updatedSortLogic = true;
			Polymer.dom.flush();

			expect(widget.pinned).to.be.false;
			var pinIndicatorButton = widget.$$('#pin-indicator-button');
			expect(pinIndicatorButton).to.not.exist;
		});

		it('should not show the pin indicator button when a course is pinned but the feature flag is off', function() {
			widget.pinned = true;
			widget.updatedSortLogic = false;
			Polymer.dom.flush();

			expect(widget.pinned).to.be.true;
			var pinIndicatorButton = widget.$$('#pin-indicator-button');
			expect(pinIndicatorButton).to.not.exist;
		});

		it('should unpin the course when pressed', function() {
			widget = fixture('d2l-course-tile-fixture');
			widget._pinClickHandler = sinon.stub();
			widget.pinned = true;
			widget.updatedSortLogic = true;
			Polymer.dom.flush();

			var pinIndicatorButton = widget.$$('#pin-indicator-button');
			pinIndicatorButton.click();
			expect(widget._pinClickHandler).to.have.been.calledOnce;
		});
	});

	describe('Notification Overlay', function() {
		var org,
			curDate,
			futureDate,
			pastDate,
			formattedDate = 'FORMATTED_DATE',
			formattedFutureDateTime,
			formattedPastDateTime,
			inactiveText = '(Inactive)';

		function verifyOverlay(params) {
			var title = params.title;
			var inactive = params.showInactiveIndicator;
			var showFutureDate = params.showFutureDate;
			var showPastDate = params.showPastDate;

			expect(widget.$$('.overlay-text').textContent.trim()).to.equal(title);
			var overlayDate = widget.$$('.overlay-date');
			var overlayInactive = widget.$$('.overlay-inactive');
			if (showFutureDate) {
				expect(overlayDate.textContent).to.equal(formattedFutureDateTime);
			} else if (showPastDate) {
				expect(overlayDate.textContent).to.equal(formattedPastDateTime);
			} else {
				expect(overlayDate.textContent).to.not.equal(formattedFutureDateTime);
				expect(overlayDate.textContent).to.not.equal(formattedPastDateTime);
			}

			if (inactive) {
				expect(overlayInactive.textContent).to.equal(inactiveText);
			} else {
				expect(overlayInactive.textContent).to.not.equal(inactiveText);
			}
		}

		beforeEach(function() {
			curDate = Date.now();
			futureDate = new Date(curDate + 8000).toISOString();
			pastDate = new Date(curDate - 8000).toISOString();
			formattedFutureDateTime = formattedDate + ' at ' + (new Date(futureDate)).toLocaleTimeString('en', { hour: 'numeric', minute: 'numeric', hour12 : true });
			formattedPastDateTime = formattedDate + ' at ' + (new Date(pastDate)).toLocaleTimeString('en', { hour: 'numeric', minute: 'numeric', hour12 : true });
			org = {
				properties: {
					endDate: futureDate,
					startDate: pastDate,
					isActive: true
				}
			};
			window.d2lIntl = {
				DateTimeFormat: function() {
					this.format = sinon.stub().returns(formattedDate);
				}
			};
		});

		describe('given the course not started', function() {
			describe('when the course is active', function() {
				it('Adds an overlay with the date and time', function() {
					org.properties.startDate = futureDate;
					widget._checkDateBounds(org);
					verifyOverlay({
						title: 'Course Starts',
						showInactiveIndicator: false,
						showFutureDate: true
					});
				});
			});

			describe('when the course is inactive', function() {
				it('Adds an overlay with the date/time and "inactive"', function() {
					org.properties.startDate = futureDate;
					org.properties.isActive = false;
					widget._checkDateBounds(org);
					verifyOverlay({
						title: 'Course Starts',
						showInactiveIndicator: true,
						showFutureDate: true
					});
				});
			});
		});

		describe('given the course has ended', function() {
			describe('when the course is active', function() {
				it('Adds an overlay with the date and time', function() {
					org.properties.endDate = pastDate;
					widget._checkDateBounds(org);
					verifyOverlay({
						title: 'Course Ended',
						showPastDate: true,
						showInactiveIndicator: false
					});
				});
			});

			describe('when the course is inactive', function() {
				it('Adds an overlay with the date and time', function() {
					org.properties.endDate = pastDate;
					org.properties.isActive = false;
					widget._checkDateBounds(org);
					verifyOverlay({
						title: 'Course Ended',
						showPastDate: true,
						showInactiveIndicator: false
					});
				});
			});
		});

		describe('given the course is in progress', function() {
			describe('when the course is active', function() {
				it('does not add an overlay', function() {
					widget._checkDateBounds(org);
					verifyOverlay({
						title: '',
						showInactiveIndicator: false
					});
				});
			});

			describe('when the course is inactive', function() {
				it('adds an "inactive" overlay', function() {
					org.properties.isActive = false;
					widget._checkDateBounds(org);
					verifyOverlay({
						title: 'Course Started',
						showInactiveIndicator: true
					});
				});
			});
		});

		describe('given there is no start date, and the course has not ended', function() {
			describe('when the course is active', function() {
				it('does not add an overlay', function() {
					org.properties.startDate = null;
					widget._checkDateBounds(org);
					verifyOverlay({
						title: '',
						showInactiveIndicator: false
					});
				});
			});

			describe('when the course is inactive', function() {
				it('adds an overlay with the "inactive" tile', function() {
					org.properties.startDate = null;
					org.properties.isActive = false;
					widget._checkDateBounds(org);
					verifyOverlay({
						title: 'Inactive',
						showInactiveIndicator: false
					});
				});
			});
		});
	});
});
