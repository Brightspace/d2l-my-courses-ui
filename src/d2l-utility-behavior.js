import '@polymer/polymer/polymer-legacy.js';
import SirenParse from 'siren-parser';
import 'd2l-fetch/d2l-fetch.js';
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

/*
* General utility functions that can be used in many places.
* @polymerBehavior D2L.MyCourses.UtilityBehavior
*/
D2L.MyCourses.UtilityBehavior = {
	// Creates a URL with a query from an Action and an object of required parameters
	createActionUrl: function(action, parameters) {
		parameters = parameters || {};
		action.fields = action.fields || [];
		var query = {};

		action.fields.forEach(function(field) {
			if (parameters.hasOwnProperty(field.name)) {
				query[field.name] = parameters[field.name];
			} else {
				query[field.name] = field.value;
			}
		});

		var queryString = Object.keys(query).map(function(key) {
			return key + '=' + query[key];
		}).join('&');

		if (!queryString) {
			return action.href;
		}

		if (action.href.indexOf('?') > -1) {
			// href already has some query params, append ours
			return action.href + '&' + queryString;
		}

		return action.href + '?' + queryString;
	},
	// Creates a unique identifier for a Siren Entity (really just the self Link href)
	getEntityIdentifier: function(entity) {
		// An entity's self href should be unique, so use it as an identifier
		var selfLink = entity.getLinkByRel('self');
		return selfLink.href;
	},
	parseEntity: function(entity) {
		return SirenParse(entity);
	},
	fetchSirenEntity: function(url, clearCache) {
		if (!url) {
			return;
		}

		var headers = {
			Accept: 'application/vnd.siren+json'
		};

		if (clearCache) {
			headers['cache-control'] = 'no-cache';
		}

		return window.d2lfetch
			.fetch(new Request(url, {
				headers: headers
			}))
			.then(this.responseToSirenEntity.bind(this));
	},
	performanceMark: function(name) {
		if (window.performance && window.performance.mark) {
			window.performance.mark(name);
		}
	},
	performanceMeasure: function(name, startMark, endMark, fireEvent) {
		if (window.performance && window.performance.measure) {
			window.performance.measure(name, startMark, endMark);
			var measure = window.performance.getEntriesByName(name, 'measure');
			if (measure.length === 1 && fireEvent) {
				document.dispatchEvent(new CustomEvent('d2l-performance-measure', {
					bubbles: true,
					detail: {
						name: name,
						value: measure[0]
					}
				}));
			}
		}
	},
	submitForm: function(url, formParameters) {
		var formData = new FormData();
		for (var formKey in formParameters) {
			if (formParameters.hasOwnProperty(formKey)) {
				formData.append(formKey, formParameters[formKey]);
			}
		}

		return window.d2lfetch
			.fetch(new Request(url, {
				method: 'PUT',
				body: formData
			}));
	},
	responseToSirenEntity: function(response) {
		if (response.ok) {
			return response
				.json()
				.then(function(json) {
					return SirenParse(json);
				});
		}
		return Promise.reject(response.status + ' ' + response.statusText);
	}
};
