describe('d2l-filter-menu-tab-roles', function() {
	var sandbox,
		component,
		myEnrollmentsEntity,
		roleFiltersEntity;

	function parse(entity) {
		return window.D2L.Hypermedia.Siren.Parse(entity);
	}

	function getFilter(name, onOrOff) {
		return {
			rel: ['filter'],
			class: [onOrOff || 'off'],
			title: name,
			actions: [{
				name: 'add-filter',
				href: 'http://example.com/add'
			}, {
				name: 'remove-filter',
				href: 'http://example.com/remove'
			}]
		};
	}

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		myEnrollmentsEntity = {
			actions: [{
				name: 'set-role-filters',
				href: 'http://example.com',
				fields: [{
					name: 'include',
					value: ''
				}]
			}]
		};
		roleFiltersEntity = parse({
			entities: [getFilter('foo')],
			actions: [{
				name: 'apply-role-filters',
				href: 'http://example.com',
				fields: [{
					name: 'roles',
					value: '1,2,3,4'
				}]
			}]
		});
		component = fixture('d2l-filter-menu-tab-roles-fixture');
		component.fetchSirenEntity = sandbox.stub().returns(Promise.resolve({}));
		component.myEnrollmentsEntity = myEnrollmentsEntity;
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('d2l-filter-menu-tab-roles', function() {
		describe('DOM manipulation', function() {
			it('should show the empty state message initially', function() {
				expect(component.$$('.no-items-text').getAttribute('hidden')).to.be.null;
			});

			it('should show the empty state message if there are no role filters', function(done) {
				component.fetchSirenEntity = sandbox.stub().returns(Promise.resolve({
					entities: []
				}));
				component._myEnrollmentsEntityChanged(myEnrollmentsEntity);

				setTimeout(function() {
					expect(component._showContent).to.be.false;
					expect(component.$$('.no-items-text').getAttribute('hidden')).to.be.null;
					expect(component.fetchSirenEntity).to.have.been.called;
					done();
				});
			});

			it('should show content once the role filters have been fetched', function(done) {
				component.fetchSirenEntity = sandbox.stub().returns(Promise.resolve({
					entities: [1]
				}));
				component._myEnrollmentsEntityChanged(myEnrollmentsEntity);

				setTimeout(function() {
					expect(component._showContent).to.be.true;
					expect(component.$$('.no-items-text').getAttribute('hidden')).to.not.be.null;
					done();
				});
			});
		});

		describe('when a d2l-menu-item-change event occurs', function() {
			[
				{name: 'should add the filter when selected', url: 'http://example.com/add', selected: true},
				{name: 'should remove the filter when de-selected', url: 'http://example.com/remove', selected: false}
			].forEach(function(testCase) {
				it(testCase.name, function(done) {
					component._roleFiltersEntity = roleFiltersEntity;
					component.fetchSirenEntity = sandbox.stub().returns(Promise.resolve(roleFiltersEntity));
					var listener = function() {
						component.removeEventListener('role-filters-changed', listener);
						expect(component.fetchSirenEntity).to.have.been.calledWith(testCase.url);
						done();
					};
					component.addEventListener('role-filters-changed', listener);

					component.fire('d2l-menu-item-change', {
						selected: testCase.selected,
						value: 'foo'
					});
				});
			});

			it('should fire a role-filters-changed event with the new URL', function(done) {
				component._roleFiltersEntity = roleFiltersEntity;
				component.fetchSirenEntity = sandbox.stub().returns(Promise.resolve(roleFiltersEntity));
				var listener = function(e) {
					component.removeEventListener('role-filters-changed', listener);
					expect(e.detail.url).to.equal('http://example.com?roles=1,2,3,4');
					done();
				};
				component.addEventListener('role-filters-changed', listener);

				component.fire('d2l-menu-item-change', {
					selected: true,
					value: 'foo'
				});
			});

			it('should work with a filter title that corresponds to more than one filter', function(done) {
				var filterOn = getFilter('foo', 'on');
				var filterOff = getFilter('foo', 'off');
				component._roleFiltersEntity = parse({entities: [filterOff, filterOff]});
				component.createActionUrl = sinon.stub();

				var stub = sandbox.stub();
				stub.onFirstCall().returns(Promise.resolve(parse({entities: [filterOn, filterOff]})));
				stub.onSecondCall().returns(Promise.resolve(parse({entities: [filterOn, filterOn]})));
				component.fetchSirenEntity = stub;

				var listener = function() {
					component.removeEventListener('role-filters-changed', listener);
					// Once per filter with the name 'foo'
					expect(component.fetchSirenEntity.callCount).to.equal(2);
					done();
				};
				component.addEventListener('role-filters-changed', listener);

				component.fire('d2l-menu-item-change', {
					selected: true,
					value: 'foo'
				});
			});
		});

		describe('clear', function() {
			it('should reset the "selected" state to false on all filter items', function() {
				component._filterTitles = ['one', 'two', 'three'];
				var filters = component.$$('d2l-menu').querySelectorAll('d2l-filter-list-item-role');
				for (var i = 0; i < filters.length; i++) {
					filters[i].selected = true;
				}

				return component.clear().then(function() {
					for (var i = 0; i < filters.length; i++) {
						expect(filters[i].selected).to.be.false;
					}
				});
			});

			it('should re-fetch the role filters with their updated states (all "off")', function() {
				return component.clear().then(function() {
					expect(component.fetchSirenEntity).to.have.been.calledWith(sinon.match(/\?include=$/));
				});
			});
		});

		describe('_parseFilterItems', function() {
			it('should have separate entries for filters with different title attributes', function() {
				component._parseFilterItems({entities: [getFilter('foo'), getFilter('bar')]});

				expect(component._filterTitles.length).to.equal(2);
			});

			it('should combine entries for filters with the same title attribute', function() {
				component._parseFilterItems({entities: [getFilter('foo'), getFilter('foo')]});

				expect(component._filterTitles.length).to.equal(1);
			});
		});
	});
});
