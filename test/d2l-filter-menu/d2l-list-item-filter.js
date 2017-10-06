/* global Promise, describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

var sandbox,
	listItem,
	enrollment,
	organization;

beforeEach(function() {
	sandbox = sinon.sandbox.create();
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

	listItem = fixture('d2l-list-item-filter-fixture');
	listItem.fetchSirenEntity = sandbox.stub().returns(Promise.resolve(
		window.D2L.Hypermedia.Siren.Parse(organization)
	));
});

afterEach(function() {
	sandbox.restore();
});

describe('d2l-list-item-filter', function() {
	it('should change icon when selected state changes', function() {
		expect(listItem.$$('d2l-icon').icon).to.equal('d2l-tier2:check-box-unchecked');

		listItem.set('selected', true);

		expect(listItem.$$('d2l-icon').icon).to.equal('d2l-tier2:check-box');
	});

	it('should fetch the organization when the enrollment changes', function(done) {
		listItem.set('enrollmentEntity', window.D2L.Hypermedia.Siren.Parse(enrollment));

		setTimeout(function() {
			expect(listItem.fetchSirenEntity).to.have.been.calledWith('/organizations/1');
			expect(listItem._organizationUrl).to.equal('/organizations/1');
			done();
		});
	});

	it('should update text and value based off of organizations response', function(done) {
		listItem.set('enrollmentEntity', window.D2L.Hypermedia.Siren.Parse(enrollment));

		setTimeout(function() {
			expect(listItem.text).to.equal('foo');
			expect(listItem.value).to.equal('bar');
			done();
		});
	});
});
