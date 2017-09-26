/* global describe, it, beforeEach, afterEach, fixture, expect, sinon */

'use strict';

describe('d2l-filter-menu-content-tabbed', function() {
	var component,
		sandbox,
		myEnrollmentsEntity;

	beforeEach(function() {
		myEnrollmentsEntity = window.D2L.Hypermedia.Siren.Parse({
			actions: [{
				name: 'add-semester-filter',
				href: '/enrollments'
			}, {
				name: 'add-department-filter',
				href: '/enrollments'
			}]
		});
		sandbox = sinon.sandbox.create();
		component = fixture('d2l-filter-menu-content-fixture');
	});

	afterEach(function() {
		sandbox.restore();
	});

	it('should observe changes to myEnrollmentsEntity', function() {
		var spy = sandbox.spy(component, '_myEnrollmentsEntityChanged');

		component.myEnrollmentsEntity = myEnrollmentsEntity;

		expect(spy.called).to.be.true;
		expect(component._searchDepartmentsAction.name).to.equal('add-department-filter');
		expect(component._searchDepartmentsAction.href).to.equal('/enrollments');
		expect(component._searchSemestersAction.name).to.equal('add-semester-filter');
		expect(component._searchSemestersAction.href).to.equal('/enrollments');
	});

	describe('OrgUnitType names in filter dropdown', function() {
		describe('default labels', function() {
			it('should render default "Standard Semester OrgUnitType" name', function() {
				var spy = sandbox.spy(component, '_updateSemesterFilterLabel');

				expect(spy.called).to.be.false;
				expect(component.$.semesterListButton.textContent).to.equal('Semester');
			});

			it('should render default "Standard Semester OrgUnitType" name with 1 filter', function() {
				var spy = sandbox.spy(component, '_updateSemesterFilterLabel');

				component._numSemesterFilters = 1;

				expect(spy.called).to.be.true;
				expect(component.$.semesterListButton.textContent).to.equal('Semester (1)');
			});

			it('should render default "Standard Department OrgUnitType" name', function() {
				var spy = sandbox.spy(component, '_updateDepartmentFilterLabel');

				expect(spy.called).to.be.false;
				expect(component.$.departmentListButton.textContent).to.equal('Department');
			});

			it('should render default "Standard Department OrgUnitType" name with 1 filter', function() {
				var spy = sandbox.spy(component, '_updateDepartmentFilterLabel');

				component._numDepartmentFilters = 1;

				expect(spy.called).to.be.true;
				expect(component.$.departmentListButton.textContent).to.equal('Department (1)');
			});
		});
		describe('custom labels', function() {
			it('should render custom "Standard Semester OrgUnitType" name', function() {
				var spy = sandbox.spy(component, '_updateSemesterFilterLabel');
				var testSemesterName = 'testSemesterName';

				component.filterStandardSemesterName = testSemesterName;

				expect(spy.called).to.be.true;
				expect(component.$.semesterListButton.textContent).to.equal(testSemesterName);
			});

			it('should render custom "Standard Semester OrgUnitType" name with 1 filter', function() {
				var spy = sandbox.spy(component, '_updateSemesterFilterLabel');
				var testSemesterName = 'testSemesterName';

				component.filterStandardSemesterName = testSemesterName;
				component._numSemesterFilters = 1;

				expect(spy.called).to.be.true;
				expect(component.$.semesterListButton.textContent).to.equal(testSemesterName + ' (1)');
			});

			it('should render custom "Standard Department OrgUnitType" name', function() {
				var spy = sandbox.spy(component, '_updateDepartmentFilterLabel');
				var testDepartmentName = 'testDepartmentName';

				component.filterStandardDepartmentName = testDepartmentName;

				expect(spy.called).to.be.true;
				expect(component.$.departmentListButton.textContent).to.equal(testDepartmentName);
			});

			it('should render custom "Standard Department OrgUnitType" name with 1 filter', function() {
				var spy = sandbox.spy(component, '_updateDepartmentFilterLabel');
				var testDepartmentName = 'testDepartmentName';

				component.filterStandardDepartmentName = testDepartmentName;
				component._numDepartmentFilters = 1;

				expect(spy.called).to.be.true;
				expect(component.$.departmentListButton.textContent).to.equal(testDepartmentName + ' (1)');
			});
		});
	});
});
