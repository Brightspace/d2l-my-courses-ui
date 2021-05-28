import { EnrollmentCollectionEntity } from 'siren-sdk/src/enrollments/EnrollmentCollectionEntity.js';
import { PromotedSearchEntity } from 'siren-sdk/src/promotedSearch/PromotedSearchEntity.js';
import { UserSettingsEntity } from 'siren-sdk/src/userSettings/UserSettingsEntity';

describe('d2l-my-courses', () => {
	let component,
		clock,
		sandbox,
		setLocalStorageStub,
		searchAction,
		searchPinnedEnrollmentsAction,
		enrollmentsSearchResponse,
		promotedSearchResponse,
		promotedSearchMultipleResponse,
		lastSearchResponse;

	const enrollmentsHref = '/enrollments/users/169',
		promotedSearchHref = '/promoted-search-url',
		lastSearchHref = 'homepages/components/1/user-settings/169';

	beforeEach(done => {
		sandbox = sinon.sandbox.create();

		searchAction = {
			name: 'search-my-enrollments',
			method: 'GET',
			href: enrollmentsHref,
			fields: [
				{ name: 'search', type: 'search', value: '' },
				{ name: 'pageSize', type: 'number', value: 20 },
				{ name: 'embedDepth', type: 'number', value: 0 },
				{ name: 'sort', type: 'text', value: 'current' },
				{ name: 'autoPinCourses', type: 'checkbox', value: false },
				{ name: 'promotePins', type: 'checkbox', value: false }
			]
		},
		searchPinnedEnrollmentsAction = {
			name: 'search-my-pinned-enrollments',
			method: 'GET',
			href: enrollmentsHref,
			fields: [
				{ name: 'search', type: 'search', value: '' },
				{ name: 'pageSize', type: 'number', value: 20 },
				{ name: 'embedDepth', type: 'number', value: 0 },
				{ name: 'sort', type: 'text', value: 'current' },
				{ name: 'autoPinCourses', type: 'checkbox', value: false },
				{ name: 'promotePins', type: 'checkbox', value: false }
			]
		},
		enrollmentsSearchResponse = window.D2L.Hypermedia.Siren.Parse({
			actions: [searchAction],
		}),
		promotedSearchResponse = window.D2L.Hypermedia.Siren.Parse({
			actions: [
				{
					title: 'Department 1',
					href: '/enrollments/users/169',
					name: '6604',
					method: 'GET',
					fields: [
						{ name: 'search', type: 'search', value: '' },
						{ name: 'pageSize', type: 'number', value: 20 },
						{ name: 'embedDepth', type: 'number', value: 0 },
						{ name: 'sort', type: 'text', value: 'current' },
						{ name: 'autoPinCourses', type: 'checkbox', value: false },
						{ name: 'promotePins', type: 'checkbox', value: false },
						{ name: 'orgUnitTypeId', type: 'hidden', value: 3 }
					]
				}
			]
		}),
		promotedSearchMultipleResponse = window.D2L.Hypermedia.Siren.Parse({
			actions: [
				{
					title: 'Semester 1',
					href: '/enrollments/users/169',
					name: '6607',
					method: 'GET',
					fields: [
						{ name: 'search', type: 'search', value: '' },
						{ name: 'pageSize', type: 'number', value: 20 },
						{ name: 'embedDepth', type: 'number', value: 0 },
						{ name: 'sort', type: 'text', value: 'current' },
						{ name: 'autoPinCourses', type: 'checkbox', value: false },
						{ name: 'promotePins', type: 'checkbox', value: false },
						{ name: 'orgUnitTypeId', type: 'hidden', value: 3 }
					]
				},
				{
					title: 'Semester 2',
					href: '/enrollments/users/169',
					name: '6609',
					method: 'GET',
					fields: [
						{ name: 'search', type: 'search', value: '' },
						{ name: 'pageSize', type: 'number', value: 20 },
						{ name: 'embedDepth', type: 'number', value: 0 },
						{ name: 'sort', type: 'text', value: 'current' },
						{ name: 'autoPinCourses', type: 'checkbox', value: false },
						{ name: 'promotePins', type: 'checkbox', value: false },
						{ name: 'orgUnitTypeId', type: 'hidden', value: 3 }
					]
				}
			]
		}),
		lastSearchResponse = window.D2L.Hypermedia.Siren.Parse({
			properties: {
				MostRecentEnrollmentsSearchType: 0,
				MostRecentEnrollmentsSearchName: '6607'
			}
		});

		component = fixture('d2l-my-courses-container-fixture');
		setLocalStorageStub = sandbox.stub(component, '_trySetItemLocalStorage');
		sandbox.stub(component, '_setUserSettingsEntity');
		sandbox.stub(component, '_setEnrollmentCollectionEntity');

		setTimeout(() => {
			component.enrollmentsUrl = enrollmentsHref;
			component.promotedSearches = promotedSearchHref;
			component.userSettingsUrl = lastSearchHref;
			component.token = 'fake';

			component._userSettingsEntity = new UserSettingsEntity(lastSearchResponse);
			component._promotedSearchEntity = new PromotedSearchEntity(promotedSearchResponse);
			component._enrollmentCollectionEntity = new EnrollmentCollectionEntity(enrollmentsSearchResponse);
			component._changedCourseEnrollment = null;
			done();
		});
	});

	afterEach(function() {
		if (clock) {
			clock.restore();
		}
		sandbox.restore();
	});

	it('should hide the only saved search action', () => {
		component._onPromotedSearchEntityChange();
		expect(component._tabSearchActions.length).to.equal(0);
	});

	it('should properly fetch default search data and hide the only saved search action', () => {
		component._enrollmentsSearchAction = searchAction;
		component._onPromotedSearchEntityChange();
		expect(component._tabSearchActions.length).to.equal(1);
	});

	it('should properly fetch saved search data with two saved search actions', () => {
		component._promotedSearchEntity = new PromotedSearchEntity(promotedSearchMultipleResponse);
		component._onPromotedSearchEntityChange();
		expect(component._tabSearchActions.length).to.equal(2);
		expect(component._tabSearchActions[0].selected).to.be.true;
	});

	it('should properly fetch default search data when set with two saved search actions', () => {
		component._promotedSearchEntity = new PromotedSearchEntity(promotedSearchMultipleResponse);
		component._enrollmentsSearchAction = searchAction;
		component._onPromotedSearchEntityChange();
		expect(component._tabSearchActions.length).to.equal(3);
		expect(component._tabSearchActions[1].selected).to.be.true;
	});

	it('should have search pinned enrollments action and hide the only saved search action', () => {
		sandbox.stub(component, '_tryGetItemLocalStorage').withArgs('myCourses.pinnedTab').returns({ previouslyShown: true });
		component._enrollmentsSearchAction = searchAction;
		component._pinnedTabAction = searchPinnedEnrollmentsAction;
		component._onPromotedSearchEntityChange();
		expect(component._tabSearchActions.length).to.equal(2);
	});

	it('should have search pinned enrollments action with two saved search actions', () => {
		sandbox.stub(component, '_tryGetItemLocalStorage').withArgs('myCourses.pinnedTab').returns({ previouslyShown: true });
		component._promotedSearchEntity = new PromotedSearchEntity(promotedSearchMultipleResponse);
		component._enrollmentsSearchAction = searchAction;
		component._pinnedTabAction = searchPinnedEnrollmentsAction;
		component._onPromotedSearchEntityChange();
		expect(component._tabSearchActions.length).to.equal(4);
		expect(component._tabSearchActions[2].selected).to.be.true;
	});

	[
		{ orgUnitId: 111, isPinned: true },
		{ orgUnitId: 222, isPinned: false }
	].forEach(testCase => {
		it(`should have updated _changedCourseEnrollment property based on the event of org ${testCase.orgUnitId}`, done => {
			const event = {
				detail: {
					orgUnitId: testCase.orgUnitId,
					isPinned: testCase.isPinned
				}
			};

			component._changedCourseEnrollment = null;
			setTimeout(() => {
				component._onCourseEnrollmentChange(event);
				expect(component._changedCourseEnrollment.orgUnitId).to.equal(testCase.orgUnitId);
				expect(component._changedCourseEnrollment.isPinned).to.equal(testCase.isPinned);
				done();
			}, 0);
		});
	});

	describe('Adding and removing the pinned action', () => {
		let getStub;

		function setupGetPinnedEnrollmentsStub(hasPinnedCourses) {
			getStub.withArgs(sinon.match(/\/enrollments\/users\/169.*&.*$/), sinon.match.string).returns(Promise.resolve({
				getSubEntitiesByClass: function() {
					return hasPinnedCourses ? ['pinnedCourse'] : [];
				}
			}));
		}

		beforeEach(() => {
			getStub = sandbox.stub(window.D2L.Siren.EntityStore, 'get');
			component._enrollmentsSearchAction = searchAction;
			component._pinnedTabAction = searchPinnedEnrollmentsAction;
		});

		it('should not add the pinned action if it cannot read the cache', () => {
			sandbox.stub(component, '_tryGetItemLocalStorage').withArgs('myCourses.pinnedTab').returns(null);
			const verifyStub = sandbox.stub(component, '_verifyPinnedTab');

			const resultActions = component._getPinTabAndAllTabActions();

			expect(verifyStub).to.have.been.calledOnce;
			expect(resultActions.length).to.equal(1);
			expect(resultActions[0].name).to.equal('search-my-enrollments');
		});

		it('should not add the pinned action if the cache says the pinned tab was previously hidden', () => {
			sandbox.stub(component, '_tryGetItemLocalStorage').withArgs('myCourses.pinnedTab').returns({ previouslyShown: false });
			const verifyStub = sandbox.stub(component, '_verifyPinnedTab');

			const resultActions = component._getPinTabAndAllTabActions();

			expect(verifyStub).to.have.been.calledOnce;
			expect(resultActions.length).to.equal(1);
			expect(resultActions[0].name).to.equal('search-my-enrollments');
		});

		it('should add the pinned action if the cache says the pinned tab was previously shown', () => {
			sandbox.stub(component, '_tryGetItemLocalStorage').withArgs('myCourses.pinnedTab').returns({ previouslyShown: true });
			const verifyStub = sandbox.stub(component, '_verifyPinnedTab');

			const resultActions = component._getPinTabAndAllTabActions();

			expect(verifyStub).to.have.been.calledOnce;
			expect(resultActions.length).to.equal(2);
			expect(resultActions[0].name).to.equal('search-my-enrollments');
			expect(resultActions[1].name).to.equal('search-my-pinned-enrollments');
		});

		it('should add the pinned tab if we verify there actually is a pinned course', done => {
			sandbox.stub(component, '_tryGetItemLocalStorage').withArgs('myCourses.pinnedTab').returns({ previouslyShown: false });
			setupGetPinnedEnrollmentsStub(true);
			const verifySpy = sandbox.spy(component, '_verifyPinnedTab');

			component._onPromotedSearchEntityChange();

			expect(component._tabSearchActions.length).to.equal(1);
			expect(component._tabSearchActions[0].name).to.equal('search-my-enrollments');

			expect(verifySpy).to.have.been.calledOnce;

			setTimeout(() => {
				expect(component._tabSearchActions.length).to.equal(2);
				expect(component._tabSearchActions[0].name).to.equal('search-my-enrollments');
				expect(component._tabSearchActions[1].name).to.equal('search-my-pinned-enrollments');
				done();
			}, 0);
		});

		it('should remove the pinned tab if we verify there actually is no pinned courses', done => {
			sandbox.stub(component, '_tryGetItemLocalStorage').withArgs('myCourses.pinnedTab').returns({ previouslyShown: true });
			setupGetPinnedEnrollmentsStub(false);
			const verifySpy = sandbox.spy(component, '_verifyPinnedTab');

			component._onPromotedSearchEntityChange();

			expect(component._tabSearchActions.length).to.equal(2);
			expect(component._tabSearchActions[0].name).to.equal('search-my-enrollments');
			expect(component._tabSearchActions[1].name).to.equal('search-my-pinned-enrollments');

			expect(verifySpy).to.have.been.calledOnce;

			setTimeout(() => {
				expect(component._tabSearchActions.length).to.equal(1);
				expect(component._tabSearchActions[0].name).to.equal('search-my-enrollments');
				done();
			}, 0);
		});

		describe('_addPinnedTab', () => {
			it('should add the pinned tab to content and force each tab to refresh because of dom-repeat issues', (done) => {
				component._currentTabId = 'panel-search-my-enrollments';
				component._tabSearchActions = [{
					name: 'search-my-enrollments',
					enrollmentsSearchAction: searchAction
				}];

				setTimeout(() => {
					const allCoursesSpliceStub = sandbox.stub(component._getAllCoursesComponent(), 'splice');
					const contentRefreshStub = sandbox.stub(component._getContentComponent(), 'requestRefresh');

					component._addPinnedTab();

					expect(component._tabSearchActions.length).to.equal(2);
					expect(allCoursesSpliceStub).to.not.have.been.called;
					expect(contentRefreshStub).to.have.been.called;
					expect(setLocalStorageStub).to.have.been.calledWith('myCourses.pinnedTab', { 'previouslyShown': true });
					done();
				}, 0);
			});
			it('should add the pinned tab to all-courses as well if it has been opened already', () => {
				const allCourses = component._getAllCoursesComponent();
				const allCoursesSpliceStub = sandbox.stub(allCourses, 'splice');
				component._tabSearchActions = [{ name: 'search-my-enrollments' }];
				component._openAllCoursesOverlay();

				component._addPinnedTab();

				expect(allCoursesSpliceStub).to.have.been.calledOnce;
				expect(setLocalStorageStub).to.have.been.calledWith('myCourses.pinnedTab', { 'previouslyShown': true });
			});
			it('should only add the pinned tab if it is not already there', () => {
				const spliceStub = sandbox.stub(component, 'splice');
				component._tabSearchActions = [{ name: 'search-my-enrollments' }, { name: 'search-my-pinned-enrollments' }];

				component._addPinnedTab();

				expect(spliceStub).to.not.have.been.called;
				expect(setLocalStorageStub).to.have.been.calledWith('myCourses.pinnedTab', { 'previouslyShown': true });
			});
		});

		describe('_removePinnedTab', () => {
			it('should remove the pinned tab to content and force each tab to refresh because of dom-repeat issues', (done) => {
				component._currentTabId = 'panel-search-my-enrollments';
				component._tabSearchActions = [{
					name: 'search-my-enrollments',
					enrollmentsSearchAction: searchAction
				},
				{
					name: 'search-my-pinned-enrollments',
					enrollmentsSearchAction: { name: 'search-my-pinned-enrollments' }
				}];

				setTimeout(() => {
					const allCoursesSpliceStub = sandbox.stub(component._getAllCoursesComponent(), 'splice');
					const contentRefreshStub = sandbox.stub(component._getContentComponent(), 'requestRefresh');

					component._removePinnedTab();

					expect(component._tabSearchActions.length).to.equal(1);
					expect(allCoursesSpliceStub).to.not.have.been.called;
					expect(contentRefreshStub).to.have.been.called;
					expect(setLocalStorageStub).to.have.been.calledWith('myCourses.pinnedTab', { 'previouslyShown': false });
					done();
				}, 0);
			});
			it('should remove the pinned tab from all-courses as well if it has been opened already', () => {
				const allCourses = component._getAllCoursesComponent();
				const allCoursesSpliceStub = sandbox.stub(allCourses, 'splice');
				component._tabSearchActions = [{ name: 'search-my-enrollments' }, { name: 'search-my-pinned-enrollments' }];
				component._openAllCoursesOverlay();

				component._removePinnedTab();

				expect(allCoursesSpliceStub).to.have.been.calledOnce;
				expect(setLocalStorageStub).to.have.been.calledWith('myCourses.pinnedTab', { 'previouslyShown': false });
			});
			it('should only remove the pinned tab if it exists', () => {
				const spliceStub = sandbox.stub(component, 'splice');
				component._tabSearchActions = [{ name: 'search-my-enrollments' }];

				component._removePinnedTab();

				expect(spliceStub).to.not.have.been.called;
				expect(setLocalStorageStub).to.have.been.calledWith('myCourses.pinnedTab', { 'previouslyShown': false });
			});
		});
	});

	describe('Public API', () => {

		describe('courseImageUploadCompleted', () => {
			it('should do nothing if image setting was not a success', done => {
				component.promotedSearches = null;
				component._onEnrollmentAndUserSettingsEntityChange();
				flush(() => {
					setTimeout(() => {
						const stubContent = sandbox.stub(component._getContentComponent(), 'refreshCardGridImages');
						const stubAllCourses = sandbox.stub(component._getAllCoursesComponent(), 'refreshCardGridImages');
						component.courseImageUploadCompleted(false);
						expect(stubContent).to.not.have.been.called;
						expect(stubAllCourses).to.not.have.been.called;
						done();
					}, 20);
				});
			});
			it('should call refreshCardGridImages on the content and all-courses (just all tab)', done => {
				component.promotedSearches = null;
				component._onEnrollmentAndUserSettingsEntityChange();
				flush(() => {
					setTimeout(() => {
						const stubContent = sandbox.stub(component._getContentComponent(), 'refreshCardGridImages');
						const stubAllCourses = sandbox.stub(component._getAllCoursesComponent(), 'refreshCardGridImages');
						component.courseImageUploadCompleted(true);
						expect(stubContent).to.have.been.called;
						expect(stubAllCourses).to.have.been.called;
						done();
					}, 20);
				});
			});
			it('should call refreshCardGridImages on the content and all-courses (grouped by semesters)', done => {
				component._promotedSearchEntity = new PromotedSearchEntity(promotedSearchMultipleResponse);
				component._onPromotedSearchEntityChange();
				component._currentTabId = 'panel-6607';
				flush(() => {
					setTimeout(() => {
						const stubContent = sandbox.stub(component._getContentComponent(), 'refreshCardGridImages');
						const stubAllCourses = sandbox.stub(component._getAllCoursesComponent(), 'refreshCardGridImages');
						component.courseImageUploadCompleted(true);
						expect(stubContent).to.have.been.called;
						expect(stubAllCourses).to.have.been.called;
						done();
					}, 20);
				});
			});
		});

		describe('getLastOrgUnitId', () => {
			it('should get the orgunit id from the organization entity in _setImageOrg (just all tab)', done => {
				component.promotedSearches = null;
				component._onEnrollmentAndUserSettingsEntityChange();
				component._setImageOrg = window.D2L.Hypermedia.Siren.Parse({
					properties: {
						name: 'Course One'
					},
					links: [{
						rel: ['self'],
						href: '/organizations/123'
					}]
				});
				flush(() => {
					const response = component.getLastOrgUnitId();
					expect(response).to.equal('123');
					done();
				});
			});

			it('should get the orgunit id from the organization entity in _setImageOrg (grouped by semesters)', done => {
				component._promotedSearchEntity = new PromotedSearchEntity(promotedSearchMultipleResponse);
				component._onPromotedSearchEntityChange();
				component._currentTabId = '6607';
				component._setImageOrg = window.D2L.Hypermedia.Siren.Parse({
					properties: {
						name: 'Course One'
					},
					links: [{
						rel: ['self'],
						href: '/organizations/123'
					}]
				});
				flush(() => {
					const response = component.getLastOrgUnitId();
					expect(response).to.equal('123');
					done();
				});
			});
		});
	});

	describe('Alerts', function() {
		it('should remove the course image failure alert before determining if it needs to add it back', function() {
			component._showImageError = true;
			component._onSetCourseImage();
			expect(component._showImageError).to.be.false;
		});

		it('should add the course image alert after receiving a failure result (after a timeout)', function() {
			clock = sinon.useFakeTimers();
			const setCourseImageEvent = { detail: { status: 'failure' } };
			component._onSetCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(component._showImageError).to.be.true;
		});

		it('should not add a course image failure alert when a request to set the image succeeds', function() {
			const setCourseImageEvent = { detail: { status: 'success' } };
			component._onSetCourseImage(setCourseImageEvent);
			expect(component._showImageError).to.be.false;
		});

		it('should remove a course image failure alert when a request to set the image is made', function() {
			clock = sinon.useFakeTimers();
			let setCourseImageEvent = { detail: { status: 'failure' } };
			component._onSetCourseImage(setCourseImageEvent);
			clock.tick(1001);
			expect(component._showImageError).to.be.true;
			setCourseImageEvent = { detail: { status: 'set' } };
			component._onSetCourseImage(setCourseImageEvent);
			expect(component._showImageError).to.be.false;
		});

		it('should remove a course image failure alert when the all courses overlay is opened', function() {
			component._showImageError = true;

			component._openAllCoursesOverlay();
			expect(component._showImageError).to.be.false;
		});

		it('should remove a course image failure alert when the all courses overlay is closed', function(done) {
			component._currentTabId = 'panel-search-my-enrollments';
			component._tabSearchActions = [{
				name: 'search-my-enrollments',
				enrollmentsSearchAction: searchAction
			}];
			component._showImageError = true;

			setTimeout(() => {
				component._onAllCoursesClose();
				expect(component._showImageError).to.be.false;
				done();
			}, 0);
		});
	});

	describe('Events', function() {
		beforeEach(done => {
			setTimeout(() => {
				done();
			});
		});
		describe('open-change-image-view', () => {
			let event,
				fetchStub;

			beforeEach(() => {
				// Prevents the _searchPath of the image selector from being null
				component.imageCatalogLocation = '/foo';
				fetchStub = sandbox.stub(window.D2L.Siren.EntityStore, 'fetch');
				fetchStub.withArgs('/foo', sinon.match.string).returns(Promise.resolve({ entity: {} }));
				event = new CustomEvent('open-change-image-view', {
					detail: {
						organization: window.D2L.Hypermedia.Siren.Parse({
							properties: {
								name: 'Course One'
							},
							links: [{
								rel: ['self'],
								href: '/organizations/1'
							}]
						})
					}
				});
			});

			it('should update _setImageOrg', done => {

				component.addEventListener('open-change-image-view', function() {
					expect(component._setImageOrg.properties.name).to.equal('Course One');
					done();
				});

				component.dispatchEvent(event);

			});

			it('should open the course image overlay', done => {
				const spy = sandbox.spy(component.shadowRoot.querySelector('d2l-basic-image-selector'), 'initializeSearch');

				component.addEventListener('open-change-image-view', function() {
					setTimeout(() => {
						expect(spy).to.have.been.called;
						done();
					}, 0);
				});

				component.dispatchEvent(event);

			});

			it('should return undefined for org unit id initally', () => {
				expect(component.getLastOrgUnitId()).to.equal(undefined);
			});

			it('should return correct org unit id if course tile used', done => {

				component.addEventListener('open-change-image-view', function() {
					setTimeout(() => {
						expect(component.getLastOrgUnitId()).to.equal('1');
						done();
					}, 0);
				});

				setTimeout(() => {
					component.dispatchEvent(event);
				}, 0);
			});

		});

		describe('clear-image-scroll-threshold', () => {

			it('should clear triggers on the image-selector-threshold', (done) => {
				flush(() => {
					const threshold = component.shadowRoot.querySelector('#image-selector-threshold');
					const spy = sandbox.spy(threshold, 'clearTriggers');

					const event = new CustomEvent('clear-image-scroll-threshold');
					component.dispatchEvent(event);
					setTimeout(() => {
						expect(spy).to.have.been.calledOnce;
						done();
					}, 0);
				});

			});

		});

		describe('set-course-image', () => {

			it('should close the image-selector overlay', done => {
				const spy = sandbox.spy(component.shadowRoot.querySelector('d2l-basic-image-selector'), 'clearSearch');
				const event = new CustomEvent('set-course-image');
				component.dispatchEvent(event);

				setTimeout(() => {
					expect(spy).to.have.been.called;
					done();
				});
			});
		});

		describe('d2l-all-courses-close', () => {
			it('should remove an existing course image failure alert and tell d2l-my-courses-content that the overlay closed', done => {
				component._currentTabId = 'panel-search-my-enrollments';
				component._tabSearchActions = [{
					name: 'search-my-enrollments',
					enrollmentsSearchAction: searchAction
				}];

				requestAnimationFrame(() => {
					const stub = sandbox.stub(component._getContentComponent(), 'allCoursesOverlayClosed');
					component._showImageError = true;

					const event = new CustomEvent('d2l-all-courses-close');
					component._getAllCoursesComponent().dispatchEvent(event);

					setTimeout(() => {
						expect(stub).to.have.been.called;
						expect(component._showImageError).to.be.false;
						done();
					});
				});
			});
		});

		describe('d2l-my-courses-content-open-all-courses', () => {
			it('should remove an existing course image failure alert and prep all courses for opening', () => {
				const tabSearchActions = [{ name: 'testing', href: 'something' }];
				component._showImageError = true;
				component._tabSearchActions = tabSearchActions;

				component._openAllCoursesOverlay();

				expect(component._getAllCoursesComponent().tabSearchActions[0]).to.not.equal(tabSearchActions[0]);
				expect(component._getAllCoursesComponent().tabSearchActions).to.deep.equal(tabSearchActions);
				expect(component._showImageError).to.be.false;
			});
		});

		describe('d2l-tab-panel-selected', () => {
			it('should have updated _currentTabId and _tabSearchActions based on the event', (done) => {
				const event = {
					composedPath: () => {
						return [{
							id: 'panel-1254'
						}];
					},
					stopPropagation: () => {}
				};
				const tabSearchActions = [{
					name: '1254',
					title: 'WillBeSelected',
					selected: false,
					enrollmentsSearchAction: { name: '1254' }
				},
				{
					name: '8787',
					title: 'WillBeUnSelected',
					selected: true,
					enrollmentsSearchAction: { name: '8787' }
				}];
				component._currentTabId = 'panel-8787';
				component._tabSearchActions = tabSearchActions.map(action => Object.assign({}, action));

				requestAnimationFrame(() => {
					component._tabSelectedChanged(event);

					expect(component._currentTabId).to.equal('panel-1254');
					for (let i = 0; i < tabSearchActions.length; i++) {
						expect(component._tabSearchActions[i].name).to.equal(tabSearchActions[i].name);
						expect(component._tabSearchActions[i].title).to.equal(tabSearchActions[i].title);
						expect(component._tabSearchActions[i].enrollmentsSearchAction).to.equal(tabSearchActions[i].enrollmentsSearchAction);
					}
					expect(component._tabSearchActions[0].selected).to.be.true;
					expect(component._tabSearchActions[1].selected).to.be.false;
					done();
				});
			});

			it('should tell each d2l-my-courses-content component a new tab was selected', (done) => {
				const event = {
					composedPath: () => {
						return [{
							id: 'panel-1254'
						}];
					},
					stopPropagation: () => {}
				};
				const tabSearchActions = [{ name: '1254' }, { name: '8787' }];
				component._currentTabId = null;
				component._tabSearchActions = tabSearchActions.map(action => Object.assign({}, action));

				requestAnimationFrame(() => {
					const contents = component.shadowRoot.querySelectorAll('d2l-my-courses-content');
					const contentTabStub1 = sandbox.stub(contents[0], 'newTabSelected');
					const contentTabStub2 = sandbox.stub(contents[1], 'newTabSelected');

					component._tabSelectedChanged(event);
					expect(component._currentTabId).to.equal('panel-1254');
					expect(contentTabStub1).to.have.been.calledOnce;
					expect(contentTabStub2).to.have.been.calledOnce;
					done();
				});
			});
		});

		describe('d2l-course-pinned-change', () => {
			let _enrollmentEntity,
				event;

			beforeEach((done) => {
				_enrollmentEntity = {
					_entity: {},
					organizationHref: function() { return '1234'; },
				};

				event = new CustomEvent('d2l-course-pinned-change', {
					detail: {
						isPinned: true,
						enrollment: _enrollmentEntity
					}
				});

				component._currentTabId = 'panel-search-my-enrollments';
				component._enrollmentsSearchAction = searchAction;
				component._onPromotedSearchEntityChange();

				requestAnimationFrame(() => {
					done();
				});
			});

			[
				{ },
				{ orgUnitId: '1234', isPinned: false },
				{ orgUnitId: '5678', isPinned: true }
			].forEach(initialChangedCourseEnrollment => {
				it(`should update the _changedCourseEnrollment property from ${JSON.stringify(initialChangedCourseEnrollment)}, and pass to content and all courses`, () => {
					const stubContent = sandbox.stub(component._getContentComponent(), 'courseEnrollmentChanged');
					const stubAllCourses = sandbox.stub(component._getAllCoursesComponent(), 'courseEnrollmentChanged');

					component._changedCourseEnrollment = initialChangedCourseEnrollment;
					component._onCourseEnrollmentChange(event);

					expect(component._changedCourseEnrollment.orgUnitId).to.equal('1234');
					expect(component._changedCourseEnrollment.isPinned).to.equal(true);
					expect(stubContent).to.have.been.called;
					expect(stubAllCourses).to.have.been.called;
				});
			});

			it('should not update the _changedCourseEnrollment property if nothing has changed', () => {
				const stubContent = sandbox.stub(component._getContentComponent(), 'courseEnrollmentChanged');
				const stubAllCourses = sandbox.stub(component._getAllCoursesComponent(), 'courseEnrollmentChanged');
				component._changedCourseEnrollment = {
					orgUnitId: '1234',
					isPinned: true,
					didNotReplaceObject: true
				};

				component._onCourseEnrollmentChange(event);

				expect(component._changedCourseEnrollment.orgUnitId).to.equal('1234');
				expect(component._changedCourseEnrollment.isPinned).to.equal(true);
				expect(component._changedCourseEnrollment.didNotReplaceObject).to.equal(true);
				expect(stubContent).not.to.have.been.called;
				expect(stubAllCourses).not.to.have.been.called;
			});

			[
				{ orgUnitId: '1234', isPinned: false },
				{ orgUnitId: '5678', isPinned: true }
			].forEach(eventDetail => {
				it(`should handle pinned tab accordingly when the changed course was ${eventDetail.isPinned ? 'pinned' : 'unpinned'}`, () => {
					const stubAddPinnedTab = sandbox.stub(component, '_addPinnedTab');
					const stubVerifyPinnedTab = sandbox.stub(component, '_verifyPinnedTab');

					const event = new CustomEvent('d2l-course-pinned-change', {
						detail: eventDetail
					});

					component._pinnedTabAction = searchPinnedEnrollmentsAction;
					component._onCourseEnrollmentChange(event);

					expect(component._changedCourseEnrollment.orgUnitId).to.equal(eventDetail.orgUnitId);
					expect(component._changedCourseEnrollment.isPinned).to.equal(eventDetail.isPinned);
					expect(stubAddPinnedTab.called).to.equal(eventDetail.isPinned);
					expect(stubVerifyPinnedTab.called).to.equal(!eventDetail.isPinned);
				});
			});

		});
	});
});
