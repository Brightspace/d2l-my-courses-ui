describe('d2l-course-tile-grid', () => {
	var sandbox;

	function getFixture() {
		return fixture('d2l-course-tile-grid-fixture');
	}

	beforeEach(done => {
		sandbox = sinon.sandbox.create();
		setTimeout(function() {
			done();
		});
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should properly instantiate', () => {
		var component = getFixture();
		expect(component).to.exist;
		expect(component.enrollments).to.be.an.instanceof(Array);
		expect(component.animate).to.equal(true);
		expect(component.enrollmentsToAnimate).to.be.an.instanceof(Array);
		expect(component.tileSizes).to.be.an('object');
		expect(component.courseUpdatesConfig).to.be.an('object');
	});

	describe('Listener setup', () => {
		[
			{ eventName: 'enrollment-pinned', handler: '_onEnrollmentPinAction' },
			{ eventName: 'enrollment-unpinned', handler: '_onEnrollmentPinAction' },
			{ eventName: 'touch-pin-hover', handler: '_onUnpinHover' },
			{ eventName: 'touch-pin-select', handler: '_onTouchPinSelect' },
			{ eventName: 'touch-menu-open', handler: '_onTouchMenuOpen' },
			{ eventName: 'touch-menu-close', handler: '_onTouchMenuClose' },
			{ eventName: 'dom-change', handler: '_onCourseTilesChanged' }
		].forEach(testCase => {
			it('should listen for ' + testCase.eventName + ' events', done => {
				var component = getFixture();
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
		[
			'getCourseTileItemCount',
			'setCourseImage',
			'focus',
			'refreshCourseTileImage'
		].forEach(methodName => {
			it('should implement ' + methodName, () => {
				var component = getFixture();
				expect(component[methodName]).to.be.a('function');
			});
		});
	});

	describe('DOM styling', () => {
		var enrollmentsEntities;

		function getEnrollments() {
			return Array(20).fill({
				links: [{ rel: ['self'], href: 'foo' }],
				rel: ['enrollment']
			});
		}

		function getEnrollmentsFixture(entities) {
			var widget = getFixture();
			widget.enrollments = entities;
			return widget;
		}

		beforeEach(done => {
			enrollmentsEntities = window.D2L.Hypermedia.Siren.Parse(
				getEnrollments()
			).entities;

			setTimeout(() => {
				done();
			});
		});

		it('should only show 12 tiles when limit-to-12 attribute is set', () => {
			var component = getEnrollmentsFixture(enrollmentsEntities);
			component.setAttribute('limit-to-12', true);

			var twelfthTile = component.$$('.course-tile-container d2l-course-tile:nth-of-type(12)');
			expect(window.getComputedStyle(twelfthTile).getPropertyValue('display')).to.equal('block');
			var thirteenthTile = component.$$('.course-tile-container d2l-course-tile:nth-of-type(13)');
			expect(window.getComputedStyle(thirteenthTile).getPropertyValue('display')).to.equal('none');
		});

		it('should hide past courses when hide-past-courses attribute is set', () => {
			var component = getEnrollmentsFixture(enrollmentsEntities);
			component.setAttribute('hide-past-courses', true);

			var pastCourseTile = component.$$('.course-tile-container d2l-course-tile');
			expect(window.getComputedStyle(pastCourseTile).getPropertyValue('display')).to.equal('block');

			pastCourseTile.setAttribute('past-course', true);

			expect(window.getComputedStyle(pastCourseTile).getPropertyValue('display')).to.equal('none');
		});

		it('should not hide a pinned past course, even if hide-past-courses is set', () => {
			var component = getEnrollmentsFixture(enrollmentsEntities);
			var courseTile = component.$$('.course-tile-container d2l-course-tile');
			courseTile.setAttribute('pinned', true);
			expect(window.getComputedStyle(courseTile).getPropertyValue('display')).to.equal('block');

			component.setAttribute('hide-past-courses', true);
			courseTile.setAttribute('past-course', true);

			expect(window.getComputedStyle(courseTile).getPropertyValue('display')).to.equal('block');
		});

		it('should only show 12 current courses when limit-to-12 and hide-past-courses are both set', () => {
			var component = getEnrollmentsFixture(enrollmentsEntities);
			var courseTile = component.$$('.course-tile-container d2l-course-tile');

			component.setAttribute('limit-to-12', true);
			component.setAttribute('hide-past-courses', true);
			courseTile.setAttribute('past-course', true);

			expect(window.getComputedStyle(courseTile).getPropertyValue('display')).to.equal('none');

			var twelfthTile = component.$$('.course-tile-container d2l-course-tile:nth-of-type(12)');
			expect(window.getComputedStyle(twelfthTile).getPropertyValue('display')).to.equal('block');
			var thirteenthTile = component.$$('.course-tile-container d2l-course-tile:nth-of-type(13)');
			expect(window.getComputedStyle(thirteenthTile).getPropertyValue('display')).to.equal('none');
		});

	});

});
