import 'd2l-localize-behavior/d2l-localize-behavior.js';
import './build/lang/ar.js';
import './build/lang/da-dk.js';
import './build/lang/de.js';
import './build/lang/en.js';
import './build/lang/es.js';
import './build/lang/fi.js';
import './build/lang/fr.js';
import './build/lang/fr-fr.js';
import './build/lang/ja.js';
import './build/lang/ko.js';
import './build/lang/nb.js';
import './build/lang/nl.js';
import './build/lang/pt.js';
import './build/lang/sv.js';
import './build/lang/tr.js';
import './build/lang/zh-tw.js';
import './build/lang/zh.js';
window.D2L = window.D2L || {};
window.D2L.PolymerBehaviors = window.D2L.PolymerBehaviors || {};
window.D2L.PolymerBehaviors.MyCourses = window.D2L.PolymerBehaviors.MyCourses || {};
/*
* @polymerBehavior D2L.PolymerBehaviors.MyCourses.LocalizeBehaviorLegacy
*/
D2L.PolymerBehaviors.MyCourses.LocalizeBehaviorImplLegacy = {
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
					'da-dk': this['da-dk'],
					'de': this.de,
					'es': this.es,
					'fi': this.fi,
					'fr': this.fr,
					'fr-fr': this['fr-fr'],
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
* @polymerBehavior D2L.PolymerBehaviors.MyCourses.LocalizeBehaviorLegacy
*/
D2L.PolymerBehaviors.MyCourses.LocalizeBehaviorLegacy = [
	D2L.PolymerBehaviors.LocalizeBehavior,
	D2L.PolymerBehaviors.MyCourses.LocalizeBehaviorImplLegacy,
	D2L.PolymerBehaviors.MyCourses.LangArBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangDadkBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangDeBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangEnBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangEsBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangFiBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangFrBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangFrfrBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangJaBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangKoBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangNbBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangNlBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangPtBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangSvBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangTrBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangZhtwBehaviorLegacy,
	D2L.PolymerBehaviors.MyCourses.LangZhBehaviorLegacy
];
