/* global describe, it, expect, fixture, beforeEach, afterEach, sinon */

'use strict';

describe('d2l-updates-behavior', function() {
	var component,
		server,
		updates = {
			'Objects': [{
				'OrgUnitId': '6609',
				'UserId': '169',
				'UnreadDiscussions': 0,
				'UnapprovedDiscussions': 0,
				'UnreadAssignmentFeedback': 0,
				'UnattemptedQuizzes': 2,
				'UnreadAssignmentSubmissions': 0,
				'UngradedQuizzes': 0
			}, {
				'OrgUnitId': '6613',
				'UserId': '169',
				'UnreadDiscussions': 1,
				'UnapprovedDiscussions': 1,
				'UnreadAssignmentFeedback': 1,
				'UnattemptedQuizzes': 1,
				'UnreadAssignmentSubmissions': 1,
				'UngradedQuizzes': 1
			}],
			'Next': null
		};

	beforeEach(function() {
		server = sinon.fakeServer.create();
		server.respondImmediately = true;
		component = fixture('default-fixture');
	});

	afterEach(function() {

		server.restore();
	});

	describe('getUpdates', function() {
/*
		it('calling get updates with a csv list of orgunitids should return a list of aggregated updates', function(done) {
			server.respondWith('GET', component._updatesURI + '6609,6613', JSON.stringify(updates));
			component.getUpdates('6609,6613');
			component.addEventListener('update-count-map-changed', function() {
				expect(component.get('updateCountMap')[6609]).to.equal(2);
				expect(component.get('updateCountMap')[6613]).to.equal(6);
				done();
			});

		});

		it('should do nothing if a bad response comes back', function() {
			server.respondWith('GET', component._updatesURI + '6609,6613', [500, {}, '']);
			component.getUpdates('6609,6613');
			expect(component.updateCountMap).to.be.empty;

		});*/
	});
});
