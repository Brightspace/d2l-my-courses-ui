import '../../legacy/localize-behavior-legacy.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
Polymer({
	is: 'consumer-element',
	behaviors: [
		D2L.PolymerBehaviors.MyCourses.LocalizeBehaviorLegacy
	]
});
