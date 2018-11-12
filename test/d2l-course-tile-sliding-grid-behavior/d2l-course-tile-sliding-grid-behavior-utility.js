describe('d2l-course-tile-sliding-grid-behavior-utility', () => {
	var utility = D2L.MyCourses.CourseTileSlidingGridBehaviorUtility;

	describe.skip('calculatePositionChange', function() {
		[
			[1, 2, true, 1, 0, 1, 'one column, one insertion'],
			[1, 0, true, 4, 0, 4, 'one column, multiple insertions'],
			[1, 2, false, 1, 0, -1, 'one column, one removal'],
			[1, 10, false, 4, 0, -4, 'one column, multiple removals'],
			[2, 0, true, 1, 1, 0, 'two columns, first column, one insertion'],
			[2, 0, true, 2, 0, 1, 'two columns, first column, two insertions'],
			[2, 0, true, 3, 1, 1, 'two columns, first column, three insertions'],
			[2, 0, true, 5, 1, 2, 'two columns, first column, five insertions'],
			[2, 6, false, 1, 1, -1, 'two columns, first column, one removal'],
			[2, 6, false, 2, 0, -1, 'two columns, first column, two removals'],
			[2, 6, false, 3, 1, -2, 'two columns, first column, three removals'],
			[2, 6, false, 5, 1, -3, 'two columns, first column, five removals'],
			[2, 1, true, 1, -1, 1, 'two columns, second column, one insertion'],
			[2, 1, true, 2, 0, 1, 'two columns, second column, two insertions'],
			[2, 1, true, 3, -1, 2, 'two columns, second column, three insertions'],
			[2, 1, true, 5, -1, 3, 'two columns, second column, five insertions'],
			[2, 7, false, 1, -1, 0, 'two columns, second column, one removal'],
			[2, 7, false, 2, 0, -1, 'two columns, second column, two removals'],
			[2, 7, false, 3, -1, -1, 'two columns, second column, three removals'],
			[2, 7, false, 5, -1, -2, 'two columns, second column, five removals']
		].forEach(function(test) {
			it('should work for ' + test[6], function() {
				expect(utility.calculatePositionChange(
					test[0],
					test[1],
					test[2],
					test[3]
				)).to.deep.equal({
					col: test[4],
					row: test[5]
				});
			});
		});

		describe('findDifferenceInLists', function() {
			[
				[[0, 1, 2, 3, 4], [0, 1, 2], 3, 2],
				[[0, 1, 2], [0, 1, 2, 3, 4], 3, 2],
				[[0, 1, 2, 3, 4, 5, 6], [0, 1, 2, 5, 6], 3, 2],
				[[0, 1, 2, 5, 6], [0, 1, 2, 3, 4, 5, 6], 3, 2],
				[[], [], 0, 0],
				[[0], [0], 1, 0],
				[[0], [0, 1, 2, 3], 1, 3],
				[[0, 1, 2, 3], [0], 1, 3],
				[[], [1], 0, 1]
			].forEach(function(test, i) {
				it('should work [' + i + ']', function() {
					expect(utility.findDifferenceInLists(
						test[0],
						test[1]
					)).to.deep.equal({
						pos: test[2],
						count: test[3]
					});
				});
			});
		});
	});
});
