describe('<d2l-touch-menu-item>', function() {
	var touchMenuItem;
	var newImageName = 'newImage';
	var	newDisplayText = 'newDisplayText';

	beforeEach(function() {
		touchMenuItem = fixture('d2lTouchMenuItemFixture');
	});

	it('loads element', function() {
		expect(touchMenuItem).to.exist;
	});

	describe('setting display data', function() {
		it('should update its display image', function() {
			touchMenuItem.backgroundImage = newImageName;
			expect(touchMenuItem._displayBackgroundImage).to.equal(newImageName);
		});

		it('should update its display text', function() {
			touchMenuItem.text = newDisplayText;
			expect(touchMenuItem._displayText).to.equal(newDisplayText);
		});

		it('should not update its image during transitions', function() {
			touchMenuItem._inTransition = true;
			touchMenuItem.text = newDisplayText;

			expect(touchMenuItem._displayText).to.equal('originalText');
		});

		it('should not update its display image during transitions', function() {
			touchMenuItem._inTransition = true;
			touchMenuItem.backgroundImage = newImageName;

			expect(touchMenuItem._displayBackgroundImage).to.equal('originalImage');
		});
	});

	describe('interaction', function() {
		beforeEach(function() {
			sinon.stub(touchMenuItem, 'width', {
				get: function()	{
					return 24;
				}
			});

			sinon.stub(touchMenuItem, 'height', {
				get: function() {
					return 24;
				}
			});

			touchMenuItem.touchRegion = {
				top: 100,
				left: 100
			};
		});

		it('should register a point within its touch region when one is defined', function(done) {
			var point = {
				x: touchMenuItem.touchRegion.top + (touchMenuItem.height / 2),
				y: touchMenuItem.touchRegion.left + (touchMenuItem.width / 2)
			};

			var inTouchRegion = touchMenuItem.pointInTouchRegion(point);
			expect(inTouchRegion).to.equal(true);
			done();
		});

		it('should not register a point outside its touch region', function() {
			var point = {
				x: touchMenuItem.touchRegion.top - 40, // Includes _touchRadiusPadding
				y: touchMenuItem.touchRegion.left - 10
			};

			var inTouchRegion = touchMenuItem.pointInTouchRegion(point);
			expect(inTouchRegion).to.equal(false);
		});
	});
});
