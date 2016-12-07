/* global describe, it, beforeEach, fixture, expect, sinon */

'use strict';

describe('<d2l-course-tile>', function() {
	var widget;

	beforeEach(function() {
		widget = fixture('d2l-basic-image-selector-fixture');
		sinon.stub(widget, '_doTelemetryNextPageRequest');
	});

	it('loads element', function() {
		expect(widget).to.exist;
	});

	describe('loadMore', function() {
		beforeEach(function() {
			widget._showGrid = true;
			widget.$.moreSearchImagesRequest.generateRequest = sinon.stub();
			widget.$.moreDefaultImagesRequest.generateRequest = sinon.stub();
			widget.$.lazyLoadSpinner.scrollIntoView = sinon.stub();
		});

		it('generates a moreSearchImagesRequest when a nextSearchResults page exists', function() {
			widget._nextSearchResultPage = 'http://test.com';
			widget.loadMore();
			expect(widget.$.moreSearchImagesRequest.generateRequest.called).to.equal(true);
		});

		it('does not generate a moreSearchImagesRequest when showGrid is false', function() {
			widget._nextSearchResultPage = 'http://test.com';
			widget._showGrid = false;
			widget.$.moreSearchImagesRequest.generateRequest = sinon.stub();
			widget.loadMore();
			expect(widget.$.moreSearchImagesRequest.generateRequest.called).to.equal(false);
		});

		it('does not generate a moreSearchImagesRequest when there is no next search page', function() {
			widget._nextSearchResultPage = null;
			widget.loadMore();
			expect(widget.$.moreSearchImagesRequest.generateRequest.called).to.equal(false);
		});

		it('shows the spinner when generating a moreSearchImagesRequest', function() {
			widget._nextSearchResultPage = 'http://test.com';
			widget.loadMore();
			expect(widget._loadingSpinnerClass).to.equal('');
			expect(widget.$.lazyLoadSpinner.scrollIntoView.called).to.equal(true);
		});

		it('generates a moreDefaultImagesRequest when a nextSearchResults page does not exist, there are no search images, and the no results message is not showing', function() {
			widget._nextSearchResultPage = null;
			widget._nextDefaultResultPage = 'http://test.com';
			widget.searchImages = [];

			widget.loadMore();
			expect(widget.$.moreDefaultImagesRequest.generateRequest.called).to.equal(true);
		});

		it('does not generate a moreDefaultImagesRequest when there are search images', function() {
			widget._nextSearchResultPage = null;
			widget._nextDefaultResultPage = 'http://test.com';
			widget._searchImages = ['this is a search image!'];

			widget.loadMore();
			expect(widget.$.moreDefaultImagesRequest.generateRequest.called).to.equal(false);
		});

		it('does not generate a moreDefaultImagesRequest when there is no next default page', function() {
			widget._nextSearchResultPage = null;
			widget._searchImages = [];

			widget.loadMore();
			expect(widget.$.moreDefaultImagesRequest.generateRequest.called).to.equal(false);
		});

		it('does not generate a moreDefaultImagesRequest when showGrid is false', function() {
			widget._nextSearchResultPage = null;
			widget._nextDefaultResultPage = 'http://test.com';
			widget._searchImages = [];
			widget._showGrid = false;

			widget.loadMore();
			expect(widget.$.moreDefaultImagesRequest.generateRequest.called).to.equal(false);
		});

		it('shows the spinner when generating a moreDefaultImagesRequest', function() {
			widget._nextSearchResultPage = null;
			widget._nextDefaultResultPage = 'http://test.com';
			widget._searchImages = [];

			widget.loadMore();
			expect(widget._loadingSpinnerClass).to.equal('');
			expect(widget.$.lazyLoadSpinner.scrollIntoView.called).to.equal(true);
		});

		it('hides the spinner when showGrid is false', function() {
			widget._showGrid = false;
			widget._nextSearchResultPage = 'http://test.com';
			widget.loadMore();
			expect(widget._loadingSpinnerClass).to.equal('d2l-basic-image-selector-hidden');
		});

		it('hides the spinner when no response is generated', function() {
			widget.loadMore();
			expect(widget._loadingSpinnerClass).to.equal('d2l-basic-image-selector-hidden');
			expect(widget.$.moreSearchImagesRequest.generateRequest.called).to.equal(false);
			expect(widget.$.moreDefaultImagesRequest.generateRequest.called).to.equal(false);
		});
	});

	describe('_getSearchStringValue', function() {
		it('creates the proper searchString', function() {
			var search = 'test';
			var searchString = widget._getSearchStringValue(search, false);
			expect(searchString).to.equal(widget._searchPath + '?search=' + search);
		});

		it('adds on the appendMore querystring if appendMore is true', function() {
			var search = 'test';
			var searchString = widget._getSearchStringValue(search, true);
			expect(searchString).to.equal(widget._searchPath + '?search=' + search + '&appendMore=1');
		});
	});

	describe('_initialize', function() {
		beforeEach(function() {
			widget._sirenParser.parse = sinon.stub().returns({});
			widget.imageCatalogLocation = 'http://test.com';
			widget._getChangeCourseImageLink = sinon.stub();
			widget.$.imagesRequest.generateRequest = sinon.stub();
			widget.$$('d2l-search-widget').clear = sinon.stub();
			widget._getSearchStringValue = sinon.stub();
			widget.organization = {
				properties: {
					name: 'name'
				}
			};
		});

		it('clears the search widget', function() {
			widget._initialize();
			expect(widget.$$('d2l-search-widget').clear.called).to.equal(true);
		});

		it('shows the grid', function() {
			widget._initialize();
			expect(widget._showGrid).to.equal(true);
		});

		it("generates a request using the passed in organization's name", function() {
			widget._initialize();
			expect(widget._getSearchStringValue.calledWith(widget.organization.properties.name)).to.equal(true);
		});

		it('generates a request even if no oraganization was passed in', function() {
			widget._initialize();
			expect(widget._getSearchStringValue.called).to.equal(true);
		});
	});

	describe('_onImagesRequestResponse', function() {
		var response;

		beforeEach(function() {
			response = {
				detail: {
					status: 200,
					xhr: { response: {} }
				}
			};

			widget._sirenParser.parse = sinon.stub().returns({
				entities: [4, 5, 6]
			});
			widget._setNextPage = sinon.stub();
			widget.updateImages = sinon.stub();
			widget._doTelemetryNextPageRequest = sinon.stub();
		});

		describe('when status is not 200', function() {
			it('hides the loading spinner', function() {
				var badResponse = {
					detail: { status: 500 }
				};
				widget._onImagesRequestResponse(badResponse, false, false);
				expect(widget._loadingSpinnerClass).to.equal('d2l-basic-image-selector-hidden');
			});
		});

		it('hides the loading spinner', function() {
			widget._onImagesRequestResponse(response, false, false);
			expect(widget._loadingSpinnerClass).to.equal('d2l-basic-image-selector-hidden');
		});

		describe('and loadMore is true', function() {
			it('adds to the default images if isDefault is true', function() {
				widget._defaultImages = [1, 2, 3];
				widget._searchImages = [1, 2, 3];
				widget._onImagesRequestResponse(response, true, true);

				expect(widget._defaultImages).to.deep.equal([1, 2, 3, 4, 5, 6]);
				expect(widget._searchImages).to.deep.equal([1, 2, 3]);
			});

			it('adds to the search images if isDefault is false', function() {
				widget._defaultImages = [1, 2, 3];
				widget._searchImages = [1, 2, 3];
				widget._onImagesRequestResponse(response, true, false);

				expect(widget._searchImages).to.deep.equal([1, 2, 3, 4, 5, 6]);
				expect(widget._defaultImages).to.deep.equal([1, 2, 3]);
			});

			it('sends a telemetry event', function() {
				widget._onImagesRequestResponse(response, true, true);
				expect(widget._doTelemetryNextPageRequest.called).to.equal(true);
			});
		});

		describe('and loadMore is false', function() {
			it('sets the default images if isDefault is true', function() {
				widget._defaultImages = [1, 2, 3];
				widget._searchImages = [1, 2, 3];
				widget._onImagesRequestResponse(response, false, true);

				expect(widget._defaultImages).to.deep.equal([4, 5, 6]);
				expect(widget._searchImages).to.deep.equal([1, 2, 3]);
			});

			it('sets the search images if isDefault is false', function() {
				widget._defaultImages = [1, 2, 3];
				widget._searchImages = [1, 2, 3];
				widget._onImagesRequestResponse(response, false, false);

				expect(widget._searchImages).to.deep.equal([4, 5, 6]);
				expect(widget._defaultImages).to.deep.equal([1, 2, 3]);
			});
		});

		it('calls setNextPage with the parsedResponse and isDefault', function() {
			widget._onImagesRequestResponse(response, false, false);
			expect(widget._setNextPage.firstCall.args[0]).to.deep.equal({
				entities: [4, 5, 6]
			});
		});
	});

	describe('clear', function() {
		it('clears stuff', function() {
			widget._searchImages = [1, 2, 3];
			widget._showGrid = false;
			widget._nextSearchResultPage = 'asdf';
			widget._nextDefaultResultPage = 'asdf';
			widget._searchString = 'asdf';
			widget._images = [1];
			widget._searchImages = [1];
			widget._defaultImages = [1];

			widget._clear();

			expect(widget._searchImages).to.deep.equal([]);
			expect(widget._showGrid).to.equal(true);
			expect(widget._nextSearchResultPage).to.equal(null);
			expect(widget._nextDefaultResultPage).to.equal(null);
			expect(widget._images).to.deep.equal([]);
			expect(widget._searchImages).to.deep.equal([]);
			expect(widget._defaultImages).to.deep.equal([]);
			expect(widget._searchString).to.equal('');
		});
	});

	describe('_displayDefaultResults', function() {
		beforeEach(function() {
			widget._searchImages = [1, 2, 3];
			widget._showGrid = false;
			widget._nextSearchResultPage = 'asdf';

			widget._displayDefaultResults();
		});

		it('sets searchImages to an empty array', function() {
			expect(widget._searchImages).to.deep.equal([]);
		});

		it('sets showGrid to true', function() {
			expect(widget._showGrid).to.equal(true);
		});

		it('sets the nextSearchResultsPage to null', function() {
			expect(widget._nextSearchResultPage).to.equal(null);
		});
	});

	describe('_setNextPage', function() {
		var response,
			next;

		beforeEach(function() {
			next = {
				href: 'next'
			};

			response = {
				getLinkByRel: sinon.stub().returns(next)
			};
		});

		it('sets the nextDefaultResultPage if isDefault is true', function() {
			widget._setNextPage(response, true);
			expect(widget._nextDefaultResultPage).to.equal(next.href);
			expect(widget._nextSearchResultPage).to.equal(undefined);
		});

		it('sets the nextSearchResultsPage if isDefault is false', function() {
			widget._setNextPage(response, false);
			expect(widget._nextDefaultResultPage).to.equal(undefined);
			expect(widget._nextSearchResultPage).to.equal(next.href);
		});

		it('fires a clear-image-scroll-threshold event', function() {
			widget.fire = sinon.stub();
			widget._setNextPage(response, false);
			expect(widget.fire.calledWith('clear-image-scroll-threshold')).to.equal(true);
		});

		it("doesn't throw an error if the next link is null", function() {
			response = {
				getLinkByRel: sinon.stub().returns(null)
			};

			widget._setNextPage(response, false);
		});
	});

	describe('_displaySearchResults', function() {
		var userSearchText;

		beforeEach(function() {
			widget.$$('d2l-search-widget').searchResults = {
				entities: [1, 2, 3]
			};
			userSearchText = 'SEARCH';
		});

		it('sets _noResultsTextStart to the first half of the langTerm', function() {
			widget._displaySearchResults(userSearchText);
			expect(widget._noResultsTextStart).to.equal('No results found for ');
		});

		it('sets _noResultsTextMid to the search term', function() {
			widget._displaySearchResults(userSearchText);
			expect(widget._noResultsTextMid).to.equal(userSearchText);
		});

		it('sets _noResultsTextEnd to the second half of the langTerm', function() {
			widget._displaySearchResults(userSearchText);
			expect(widget._noResultsTextEnd).to.equal('.');
		});

		it('sets _searchImages to the result from the search widget', function() {
			widget._displaySearchResults(userSearchText);
			expect(widget._searchImages).to.deep.equal(widget.$$('d2l-search-widget').searchResults.entities);
		});

		it('sets _showGrid to true if there was search results', function() {
			widget._displaySearchResults(userSearchText);
			expect(widget._showGrid).to.equal(true);
		});

		it('sets _showGrid to false if there was no search results', function() {
			widget.$$('d2l-search-widget').searchResults = {
				entities: null
			};
			widget._displaySearchResults(userSearchText);
			expect(widget._showGrid).to.equal(false);
		});
	});

	describe('d2l-search-widget-results-changed', function() {
		var response,
			emptyResponse,
			href,
			searchHref;

		beforeEach(function() {
			href = 'asdfasdf?search=',
			searchHref = 'asdfasdf?search=TREE';

			emptyResponse = {
				detail: {
					getLinkByRel: sinon.stub().returns({
						href: href
					})
				}
			};

			response = {
				detail: {
					getLinkByRel: sinon.stub().returns({
						href: searchHref
					})
				}
			};

			widget._displayDefaultResults = sinon.stub();
			widget._displaySearchResults = sinon.stub();
			widget._setNextPage = sinon.stub();
			widget._doTelemetrySearchRequest = sinon.stub();
		});

		describe('empty search', function() {
			it('displays the default results', function() {
				widget._searchResultsChanged(emptyResponse);
				expect(widget._displayDefaultResults.called).to.equal(true);
			});
		});

		describe('not empty search', function() {
			it('displays the results', function() {
				widget._searchResultsChanged(response);
				expect(widget._displaySearchResults.calledWith('TREE')).to.equal(true);
				expect(widget._displayDefaultResults.called).to.equal(false);
			});

			it('sets the next page', function() {
				widget._searchResultsChanged(response);
				expect(widget._setNextPage.calledWith(response.detail)).to.equal(true);
				expect(widget._displayDefaultResults.called).to.equal(false);
			});

			it('sends a telemetry event', function() {
				widget._searchResultsChanged(response);
				expect(widget._doTelemetrySearchRequest.called).to.equal(true);
			});
		});
	});
});
