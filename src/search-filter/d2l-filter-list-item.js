/*
`d2l-filter-list-item`
Polymer-based web component for the filter list item.

*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import { Rels } from 'd2l-hypermedia-constants';
import 'd2l-icons/d2l-icons.js';
import 'd2l-menu/d2l-menu-item-selectable-behavior.js';
import '../d2l-utility-behavior.js';
import './d2l-filter-list-item-styles.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-filter-list-item">
	<template strip-whitespace="">
		<style include="d2l-filter-list-item-styles"></style>

		<d2l-icon class="icon-checked" icon="d2l-tier2:check-box" aria-hidden="true"></d2l-icon>
		<d2l-icon class="icon-unchecked" icon="d2l-tier2:check-box-unchecked" aria-hidden="true"></d2l-icon>

		[[text]]
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-filter-list-item',
	properties: {
		enrollmentEntity: {
			type: Object,
			observer: '_onEnrollmentEntityChanged'
		},
		_organizationUrl: {
			type: String,
			observer: '_onOrganizationUrlChanged'
		}
	},
	behaviors: [
		D2L.PolymerBehaviors.MenuItemSelectableBehavior,
		D2L.MyCourses.UtilityBehavior
	],
	listeners: {
		'd2l-menu-item-select': '_onSelect'
	},
	_onEnrollmentEntityChanged: function(entity) {
		if (entity.href) {
			this.set('_organizationUrl', entity.href);
		}

		entity = this.parseEntity(entity);

		if (entity.getLinkByRel(Rels.organization)) {
			this.set('_organizationUrl', entity.getLinkByRel(Rels.organization).href);
		}
	},
	_onOrganizationUrlChanged: function(organizationUrl) {
		return this.fetchSirenEntity(organizationUrl)
			.then(this._onOrganizationResponse.bind(this));
	},
	_onOrganizationResponse: function(entity) {
		this.set('text', entity.properties.name);
		this.set('value', entity.getLinkByRel('self').href);
	},
	_onSelect: function(e) {
		this.set('selected', !this.selected);
		this.__onSelect(e);
	}
});
