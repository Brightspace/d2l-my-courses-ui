import 'd2l-localize-behavior/d2l-localize-behavior.js';
import './build/lang/ar.js';
import './build/lang/de.js';
import './build/lang/en.js';
import './build/lang/es.js';
import './build/lang/fi.js';
import './build/lang/fr.js';
import './build/lang/ja.js';
import './build/lang/ko.js';
import './build/lang/nb.js';
import './build/lang/nl.js';
import './build/lang/pt.js';
import './build/lang/sv.js';
import './build/lang/tr.js';
import './build/lang/zh-tw.js';
import './build/lang/zh.js';

window.D2L.PolymerBehaviors.MyCourses = window.D2L.PolymerBehaviors.MyCourses || {};

/*
* @polymerBehavior D2L.PolymerBehaviors.MyCourses.LocalizeBehavior
*/
D2L.PolymerBehaviors.MyCourses.LocalizeBehaviorImpl = {
	properties: {
		locale: {
			type: String,
			value: function() {
				return document.documentElement.lang
					|| document.documentElement.getAttribute('data-lang-default')
					|| 'en-us';
			}
		},
		resources: {
			value: function() {
				return {
					'en': this.en,
					'ar': this.ar,
					'de': this.de,
					'es': this.es,
					'fi': this.fi,
					'fr': this.fr,
					'ja': this.ja,
					'ko': this.ko,
					'nb': this.nb,
					'nl': this.nl,
					'pt': this.pt,
					'sv': this.sv,
					'tr': this.tr,
					'zh': this.zh,
					'zh-tw': this['zh-tw']
				};
			}
		}
	}
};

/*
* @polymerBehavior D2L.PolymerBehaviors.MyCourses.LocalizeBehavior
*/
D2L.PolymerBehaviors.MyCourses.LocalizeBehavior = [
	D2L.PolymerBehaviors.LocalizeBehavior,
	D2L.PolymerBehaviors.MyCourses.LocalizeBehaviorImpl,
	D2L.PolymerBehaviors.MyCourses.LangArBehavior,
	D2L.PolymerBehaviors.MyCourses.LangDeBehavior,
	D2L.PolymerBehaviors.MyCourses.LangEnBehavior,
	D2L.PolymerBehaviors.MyCourses.LangEsBehavior,
	D2L.PolymerBehaviors.MyCourses.LangFiBehavior,
	D2L.PolymerBehaviors.MyCourses.LangFrBehavior,
	D2L.PolymerBehaviors.MyCourses.LangJaBehavior,
	D2L.PolymerBehaviors.MyCourses.LangKoBehavior,
	D2L.PolymerBehaviors.MyCourses.LangNbBehavior,
	D2L.PolymerBehaviors.MyCourses.LangNlBehavior,
	D2L.PolymerBehaviors.MyCourses.LangPtBehavior,
	D2L.PolymerBehaviors.MyCourses.LangSvBehavior,
	D2L.PolymerBehaviors.MyCourses.LangTrBehavior,
	D2L.PolymerBehaviors.MyCourses.LangZhtwBehavior,
	D2L.PolymerBehaviors.MyCourses.LangZhBehavior
];
