import '@polymer/polymer/polymer-legacy.js';
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

/*
* Behavior that detects whether an interaction occurs via touch or hover
* @polymerBehavior D2L.MyCourses.InteractionDetectionBehavior
*/
D2L.MyCourses.InteractionDetectionBehavior = {
	properties: {
		// True if hover (desktop) interaction is enabled
		_hoverInteractionEnabled: {
			type: Boolean,
			value: true
		},
		// True if touch (mobile) interaction is enabled
		_touchInteractionEnabled: {
			type: Boolean,
			value: false
		}
	},
	ready: function() {
		if (window.matchMedia) {
			var touchQuery = window.matchMedia('not all and (hover: hover)');
			touchQuery.addListener(this._touchQueryListener.bind(this));
			this._touchQueryListener(touchQuery);
		}
	},
	_touchQueryListener: function(query) {
		this._touchInteractionEnabled = query.matches && ('ontouchstart' in window);
		this._hoverInteractionEnabled = !this._touchInteractionEnabled;
	}
};
