import '../../src/d2l-utility-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
Polymer({
	is: 'consumer-element',
	behaviors: [
		D2L.MyCourses.UtilityBehavior
	]
});
