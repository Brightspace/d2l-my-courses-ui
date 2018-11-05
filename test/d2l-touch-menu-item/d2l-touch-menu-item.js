describe('<d2l-touch-menu-item>', function() {
	var newImageName = 'newImage';
	var	newDisplayText = 'newDisplayText';

	it('loads element', function() {
		var touchMenuItem = CreateFixture();
		expect(touchMenuItem).to.exist;
	});

	describe('setting display data', function() {
		it('should update its display image', function() {
			var touchMenuItem = CreateFixture();
			touchMenuItem.backgroundImage = newImageName;
			expect(touchMenuItem._displayBackgroundImage).to.equal(newImageName);
		});

		it('should update its display text', function() {
			var touchMenuItem = CreateFixture();
			touchMenuItem.text = newDisplayText;
			expect(touchMenuItem._displayText).to.equal(newDisplayText);
		});

		it('should not update its image during transitions', function() {
			var touchMenuItem = CreateFixture();
			touchMenuItem._inTransition = true;
			touchMenuItem.text = newDisplayText;

			expect(touchMenuItem._displayText).to.equal('originalText');
		});

		it('should not update its display image during transitions', function() {
			var touchMenuItem = CreateFixture();
			touchMenuItem._inTransition = true;
			touchMenuItem.backgroundImage = newImageName;

			expect(touchMenuItem._displayBackgroundImage).to.equal('originalImage');
		});
	});

	describe('interaction', function() {
		it('should register a point within its touch region when one is defined', function(done) {
			var touchMenuItem = CreateTouchFixture();
			touchMenuItem.touchRegion = {
				top: 100,
				left: 100
			};
			var point = {
				x: touchMenuItem.touchRegion.top + (touchMenuItem.height / 2),
				y: touchMenuItem.touchRegion.left + (touchMenuItem.width / 2)
			};

			var inTouchRegion = touchMenuItem.pointInTouchRegion(point);
			expect(inTouchRegion).to.equal(true);
			done();
		});

		it('should not register a point outside its touch region', function() {
			var touchMenuItem = CreateTouchFixture();
			var point = {
				x: touchMenuItem.touchRegion.top - 40, // Includes _touchRadiusPadding
				y: touchMenuItem.touchRegion.left - 10
			};

			var inTouchRegion = touchMenuItem.pointInTouchRegion(point);
			expect(inTouchRegion).to.equal(false);
		});
	});

	function CreateFixture() {
		return fixture('d2l-touch-menu-item-fixture');
	}

	function CreateTouchFixture() {
		var component = CreateFixture();
		sinon.stub(component, 'width', {
			get: function()	{
				return 24;
			}
		});

		sinon.stub(component, 'height', {
			get: function() {
				return 24;
			}
		});
	}
});
