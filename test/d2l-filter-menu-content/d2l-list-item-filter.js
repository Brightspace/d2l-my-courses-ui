/* global describe, it, beforeEach, fixture, expect, sinon */

'use strict';

var listItem,
	enrollment,
	parser;

beforeEach(function() {
	parser = document.createElement('d2l-siren-parser');
	enrollment = {
		rel: ['enrollment'],
		links: [{
			rel: ['self'],
			href: '/enrollments'
		}, {
			rel: ['/organization'],
			href: '/organizations/1'
		}]
	};
	listItem = fixture('d2l-list-item-filter-fixture');
});

describe('d2l-list-item-filter', function() {
	it('should change icon when selected state changes', function() {
		expect(listItem.$$('d2l-icon').icon).to.equal('d2l-tier2:check-box-unchecked');

		listItem.set('selected', true);

		expect(listItem.$$('d2l-icon').icon).to.equal('d2l-tier2:check-box');
	});

	it('should fetch the organization when the enrollment changes', function() {
		var stub = sinon.stub(listItem.$$('d2l-ajax'), 'generateRequest');

		listItem.set('enrollmentEntity', parser.parse(enrollment));

		expect(stub.called).to.be.true;
		expect(listItem._organizationUrl).to.equal('/organizations/1');
	});

	it('should update text and value based off of organizations response', function(done) {
		var server = sinon.fakeServer.create();
		server.respondImmediately = true;
		server.respondWith(
			'GET',
			'/organizations/1',
			[200, '{}', JSON.stringify({
				properties: {
					name: 'foo'
				},
				links: [{
					rel: ['self'],
					href: 'bar'
				}]
			})]);

		listItem.set('enrollmentEntity', parser.parse(enrollment));

		setTimeout(function() {
			expect(listItem.text).to.equal('foo');
			expect(listItem.value).to.equal('bar');
			server.restore();
			done();
		});
	});
});
