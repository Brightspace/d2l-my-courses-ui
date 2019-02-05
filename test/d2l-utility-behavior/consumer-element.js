import '../../src/d2l-utility-behavior.js';
import 'd2l-hypermedia-constants/d2l-hm-constants-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
Polymer({
	is: 'consumer-element',
	behaviors: [
		window.D2L.Hypermedia.HMConstantsBehavior,
		D2L.MyCourses.UtilityBehavior
	]
});
