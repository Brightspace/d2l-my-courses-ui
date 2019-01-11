import '../../src/d2l-utility-behavior.js';
import { Classes } from 'd2l-hypermedia-constants';
import { Actions } from 'd2l-hypermedia-constants';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
Polymer({
	is: 'consumer-element',
	behaviors: [
		D2L.MyCourses.UtilityBehavior
	]
});
