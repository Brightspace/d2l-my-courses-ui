import '@polymer/polymer/polymer-legacy.js';
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

/*
* Behavior for my courses alert messages
*
* This contains utility functions for adding and removing alerts
*
* @polymerBehavior D2L.MyCourses.AlertBehavior
*/
D2L.MyCourses.AlertBehavior = {
	properties: {
		// Array containing alert objects for display
		_alertsView: {
			type: Array
		},
		_alerts: {
			type: Object,
			value: function() { return {}; }
		}
	},
	_populateAlertsView: function(alert) {
		this._alertsView = Object.keys(alert).map(function(key) {
			if (!alert[key]) {
				return null;
			}
			return {
				alertType: alert[key].alertType,
				alertName: key,
				alertMessage: alert[key].alertMessage
			};
		}.bind(this)).filter(function(element) {
			return element;
		});
	},
	_addAlert: function(type, name, message) {
		if (this._alerts) {
			this._alerts[name] = {
				alertType: type,
				alertMessage: message
			};
			this._populateAlertsView(this._alerts);
		}
	},
	_hasAlert: function(name) {
		return !!this._alerts && !!this._alerts[name];
	},
	_removeAlert: function(name) {
		if (this._alerts) {
			this._alerts[name] = null;
			this._populateAlertsView(this._alerts);
		}
	},
	_clearAlerts: function() {
		this._alertsView = [];
		this._alerts = {};
	}
};
