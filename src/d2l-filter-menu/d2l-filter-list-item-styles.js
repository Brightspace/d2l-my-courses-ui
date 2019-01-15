import '@polymer/polymer/polymer-legacy.js';
import 'd2l-menu/d2l-menu-item-selectable-styles.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-filter-list-item-styles">
	<template strip-whitespace="">
		<style include="d2l-menu-item-selectable-styles">
			:host {
				padding: 0.5rem 1rem;
				@apply --d2l-body-compact-text;
			}

			d2l-icon {
				--d2l-icon-height: 1rem;
				--d2l-icon-width: 1rem;
				visibility: visible;
				margin-right: 0.5rem;
			}

			:host-context([dir="rtl"]) > d2l-icon {
				margin-left: 0.5rem;
				margin-right: 0;
			}

			.icon-checked,
			:host([selected]) .icon-unchecked {
				display: none;
			}

			:host([selected]) .icon-checked {
				display: inline-block;
			}
		</style>
	</template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
