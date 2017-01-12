/* global describe, it, expect, fixture, before, beforeEach */

'use strict';

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
			}],
			links: [{
				rel: ['https://api.brightspace.com/rels/organization'],
				href: '/organizations/1'
			}, {
				rel: ['self'],
				href: '/enrollments/users/169/organizations/1'
			}]
		},
		image = {
			class: ['course-image'],
			properties: {
				name: 'image1'
			},
			rel: ['https://api.brightspace.com/rels/organization-image'],
			links: [
				{
					class: ['tile', 'low-density', 'max'],
					href: 'http://image.com/tile-low-density-max',
					rel: ['alternate'],
					type: 'image/jpeg'
				},
				{
					class: ['tile', 'high-density', 'max'],
					href: 'http://image.com/tile-high-density-max',
					rel: ['alternate'],
					type: 'image/jpeg'
				},
				{
					class: ['banner', 'low-density', 'max', 'narrow'],
					href: 'http://image.com/banner-narrow-low-density-max',
					rel: ['alternate'],
					type: 'image/jpeg'
				},
				{
					class: ['banner', 'high-density', 'max', 'narrow'],
					href: 'http://image.com/banner-narrow-high-density-max',
					rel: ['alternate'],
					type: 'image/jpeg'
				}
			]
		},
		imageLowd = {
			class: ['course-image'],
			properties: {
				name: 'image2'
			},
			rel: ['https://api.brightspace.com/rels/organization-image'],
			links: [
				{
					class: ['tile', 'low-density', 'max'],
					href: 'http://image.com/tile-low-density-max',
					rel: ['alternate'],
					type: 'image/jpeg'
				},
				{
					class: ['banner', 'low-density', 'max', 'narrow'],
					href: 'http://image.com/banner-narrow-low-density-max',
					rel: ['alternate'],
					type: 'image/jpeg'
				}
			]
		},
		enrollmentEntity,
		imageEntity,
		imageLowdEntity;

	before(function() {
		var parser = document.createElement('d2l-siren-parser');
		enrollmentEntity = parser.parse(enrollment);
		imageEntity = parser.parse(image);
		imageLowdEntity = parser.parse(imageLowd);
	});

	beforeEach(function() {
		component = fixture('default-fixture');
	});

	describe('createActionUrl', function() {
		it('should return the URL with default values if no parameters are specified', function() {
			var url = component.createActionUrl(enrollmentEntity.getActionByName('unpin-course'));

			expect(url).to.equal(enrollment.actions[0].href + '?pinned=false');
		});

		it('should return the URL with the specified query parameter(s)', function() {
			var url = component.createActionUrl(
				enrollmentEntity.getActionByName('unpin-course'),
				{ pinned: 'foo' }
			);

			expect(url).to.equal(enrollment.actions[0].href + '?pinned=foo');
		});

		it('should not add any fields that are not on the action', function() {
			var url = component.createActionUrl(
				enrollmentEntity.getActionByName('unpin-course'),
				{ foo: 'bar' }
			);

			expect(url).to.not.match(/foo=bar/);
		});
	});

	describe('getEntityIdentifier', function() {
		it('should get the unique enrollment ID based off the self link', function() {
			var id = component.getEntityIdentifier(enrollmentEntity);

			expect(id).to.equal(enrollment.links[1].href);
		});
	});

	describe('getOrgunitId', function() {
		var enrollmentid = '/enrollments/users/169/organizations/1';
		it('should parse orgunitid from enrollment id', function() {
			expect(component.getOrgUnitId(enrollmentid)).to.equal('1');
		});

		it('should return nothing if nothing is passed in', function() {
			expect(component.getOrgUnitId(undefined)).to.equal(undefined);
		});
	});

	describe('getDefaultImageLink', function() {
		it('should return high-density max image as a default image', function() {
			var link = component.getDefaultImageLink(imageEntity, 'tile');
			expect(link).to.equal(image.links[1].href);
		});
		it('should return low-density max image as a backup default image', function() {
			var link = component.getDefaultImageLink(imageLowdEntity, 'tile');
			expect(link).to.equal(imageLowd.links[0].href);
		});
		it('should get the appropiate image links from the class', function() {
			var link = component.getDefaultImageLink(imageEntity, 'narrow');
			expect(link).to.equal(image.links[3].href);
		});
	});

	describe.only('getImageSrcset', function() {
		it('should return a tile srcset based on the links available', function() {
			var link = component.getImageSrcset(imageEntity, 'tile');
			expect(link).to.equal('http://image.com/tile-low-density-max 540w, http://image.com/tile-high-density-max 1080w');
		});
		it('should return a banner srcset on the links available', function() {
			var link = component.getImageSrcset(imageEntity, 'narrow');
			expect(link).to.equal('http://image.com/banner-narrow-low-density-max 767w, http://image.com/banner-narrow-high-density-max 1534w');
		});
	});
});
