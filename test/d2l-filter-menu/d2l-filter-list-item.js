describe('d2l-filter-list-item', function() {
	var sandbox,
		listItem,
		enrollment,
		organization;

	beforeEach(function() {
		enrollment = {
			rel: ['enrollment'],
			links: [{
				rel: ['self'],
				href: '/enrollments'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: '/organizations/1'
			}]
		};
		organization = {
			properties: {
				name: 'foo'
			},
			links: [{
				rel: ['self'],
				href: 'bar'
			}]
		};
	});

	afterEach(function() {
	});

	it('should show the unchecked icon when the item is not selected', function() {
		sandbox = sinon.sandbox.create();
		listItem = fixture('d2lFilterListItemFixture');
		listItem.fetchSirenEntity = sandbox.stub().returns(Promise.resolve(
			window.D2L.Hypermedia.Siren.Parse(organization)
		));
		listItem.selected = false;
		expect(listItem.$$('d2l-icon.icon-checked').getComputedStyleValue('display')).to.equal('none');
		expect(listItem.$$('d2l-icon.icon-unchecked').getComputedStyleValue('display')).to.not.equal('none');
		sandbox.restore();
	});

	it('should show the checked icon when the item is selected', function() {
		sandbox = sinon.sandbox.create();
		listItem = fixture('d2lFilterListItemFixture');
		listItem.fetchSirenEntity = sandbox.stub().returns(Promise.resolve(
			window.D2L.Hypermedia.Siren.Parse(organization)
		));
		listItem.selected = true;
		expect(listItem.$$('d2l-icon.icon-unchecked').getComputedStyleValue('display')).to.equal('none');
		expect(listItem.$$('d2l-icon.icon-checked').getComputedStyleValue('display')).to.not.equal('none');
		sandbox.restore();
	});

	it('should fetch the organization when the enrollment changes', function(done) {
		sandbox = sinon.sandbox.create();
		listItem = fixture('d2lFilterListItemFixture');
		listItem.fetchSirenEntity = sandbox.stub().returns(Promise.resolve(
			window.D2L.Hypermedia.Siren.Parse(organization)
		));
		listItem.set('enrollmentEntity', window.D2L.Hypermedia.Siren.Parse(enrollment));

		setTimeout(function() {
			expect(listItem.fetchSirenEntity).to.have.been.calledWith('/organizations/1');
			expect(listItem._organizationUrl).to.equal('/organizations/1');
			done();
		});
		sandbox.restore();
	});

	it('should update text and value based off of organizations response', function(done) {
		sandbox = sinon.sandbox.create();
		listItem = fixture('d2lFilterListItemFixture');
		listItem.fetchSirenEntity = sandbox.stub().returns(Promise.resolve(
			window.D2L.Hypermedia.Siren.Parse(organization)
		));
		listItem.set('enrollmentEntity', window.D2L.Hypermedia.Siren.Parse(enrollment));

		setTimeout(function() {
			expect(listItem.text).to.equal('foo');
			expect(listItem.value).to.equal('bar');
			done();
		});
		sandbox.restore();
	});
});
