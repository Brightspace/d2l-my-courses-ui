describe('d2l-filter-list-item-role', function() {
	it('should show the unchecked icon when the item is not selected', function() {
		var listItem = fixture('d2l-filter-list-item-role-fixture');
		listItem.selected = false;
		expect(listItem.$$('d2l-icon.icon-checked').getComputedStyleValue('display')).to.equal('none');
		expect(listItem.$$('d2l-icon.icon-unchecked').getComputedStyleValue('display')).to.not.equal('none');
	});

	it('should show the checked icon when the item is selected', function() {
		var listItem = fixture('d2l-filter-list-item-role-fixture');
		listItem.selected = true;
		expect(listItem.$$('d2l-icon.icon-unchecked').getComputedStyleValue('display')).to.equal('none');
		expect(listItem.$$('d2l-icon.icon-checked').getComputedStyleValue('display')).to.not.equal('none');
	});
});
