describe('d2l-course-tile-grid', () => {
	var component,
		sandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		component = fixture('d2l-course-tile-grid-fixture');
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should properly instantiate', () => {
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
			{ eventName: 'dom-change', handler: '_onCourseTilesChanged' }
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
		[
			'getCourseTileItemCount',
			'setCourseImage',
			'focus',
			'refreshCourseTileImage'
		].forEach(methodName => {
			it('should implement ' + methodName, () => {
				expect(component[methodName]).to.be.a('function');
			});
		});
	});

	describe('DOM styling', () => {
		function getEnrollment() {
			return {
				links: [{ rel: ['self'], href: 'foo' }],
				rel: ['enrollment']
			};
		}

		beforeEach(done => {
			var enrollments = window.D2L.Hypermedia.Siren.Parse({
				entities: Array(20).fill(getEnrollment())
			});

			component.enrollments = enrollments.entities;

			setTimeout(() => {
				done();
			});
		});

		it('should hide past courses when hide-past-courses attribute is set', () => {
			component.setAttribute('hide-past-courses', true);

			var pastCourseTile = component.$$('.course-tile-container d2l-course-tile');
			expect(window.getComputedStyle(pastCourseTile).getPropertyValue('display')).to.equal('block');

			pastCourseTile.setAttribute('past-course', true);

			expect(window.getComputedStyle(pastCourseTile).getPropertyValue('display')).to.equal('none');
		});

		it('should not hide a pinned past course, even if hide-past-courses is set', () => {
			var courseTile = component.$$('.course-tile-container d2l-course-tile');
			courseTile.setAttribute('pinned', true);
			expect(window.getComputedStyle(courseTile).getPropertyValue('display')).to.equal('block');

			component.setAttribute('hide-past-courses', true);
			courseTile.setAttribute('past-course', true);

			expect(window.getComputedStyle(courseTile).getPropertyValue('display')).to.equal('block');
		});

	});

});
