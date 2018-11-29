describe('d2l-utility-behavior', function() {
	var
		component,
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
			}, {
				name: 'action-with-query-params',
				href: '/enrollments?param1=foo',
				fields: [{
					name: 'param2',
					value: 'bar'
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
		enrollmentEntity;

	before(function() {
		enrollmentEntity = window.D2L.Hypermedia.Siren.Parse(enrollment);
	});

	beforeEach(function() {
		component = fixture('defaultFixture');
	});

	describe('createActionUrl', function() {
		it('should return the URL with default values if no parameters are specified', function() {
			var url = component.createActionUrl(enrollmentEntity.getActionByName(component.HypermediaActions.enrollments.unpinCourse));

			expect(url).to.equal(enrollment.actions[0].href + '?pinned=false');
		});

		it('should return the URL with the specified query parameter(s)', function() {
			var url = component.createActionUrl(
				enrollmentEntity.getActionByName(component.HypermediaActions.enrollments.unpinCourse),
				{ pinned: 'foo' }
			);

			expect(url).to.equal(enrollment.actions[0].href + '?pinned=foo');
		});

		it('should not add any fields that are not on the action', function() {
			var url = component.createActionUrl(
				enrollmentEntity.getActionByName(component.HypermediaActions.enrollments.unpinCourse),
				{ foo: 'bar' }
			);

			expect(url).to.not.match(/foo=bar/);
		});

		it('should work with hrefs that already have query params', function() {
			var url = component.createActionUrl(
				enrollmentEntity.getActionByName('action-with-query-params'),
				{ param2: 'baz' }
			);

			expect(url).to.equal('/enrollments?param1=foo&param2=baz');
		});
	});

	describe('getEntityIdentifier', function() {
		it('should get the unique enrollment ID based off the self link', function() {
			var id = component.getEntityIdentifier(enrollmentEntity);

			expect(id).to.equal(enrollment.links[1].href);
		});
	});
});
