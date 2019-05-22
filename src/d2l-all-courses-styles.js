import 'd2l-typography/d2l-typography-shared-styles.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-all-courses-styles">
	<template strip-whitespace="">
		<style>
			:host {
				display: block;
			}
			h2 {
				@apply --d2l-heading-3;
				margin: 20px 0 10px 0 !important;
			}
			d2l-alert {
				margin-bottom: 20px;
			}
			d2l-icon {
				--d2l-icon-height: 15px;
				--d2l-icon-width: 15px;
				margin-top: -0.35rem;
			}
			d2l-loading-spinner {
				margin-bottom: 30px;
				padding-bottom: 30px;
				margin: auto;
				width: 100%;
			}
			.bottom-pad {
				padding-bottom: 20px;
			}
			#search-and-filter {
				margin-bottom: 50px;
			}
			.search-and-filter-row {
				display: flex;
				justify-content: space-between;
			}
			.advanced-search-link {
				font-size: 0.8rem;
				margin-top: 3px;
				flex: 1;
			}
			.advanced-search-link[hidden] {
				display: none;
			}
			d2l-search-widget-custom {
				flex: 1;
			}
			#filterAndSort {
				flex: 1.4;
				display: flex;
				justify-content: flex-end;
				align-items: center;
			}
			@media screen and (max-width: 767px) {
				#filterAndSort {
					display: none;
				}
				.advanced-search-link {
					text-align: right;
					margin-top: 5px;
				}
			}
			.dropdown-opener-text {
				font-size: 0.95rem;
				font-family: Lato;
				cursor: pointer;
				padding: 0;
				margin-left: 1rem;
			}
			.dropdown-button {
				background: none;
				border: none;
				cursor: pointer;
				padding: 0;
				color: var(--d2l-color-ferrite);
			}
			.dropdown-button > d2l-icon {
				margin-left: 4px;
			}
			.dropdown-content-header {
				box-sizing: border-box;
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-bottom: 1px solid var(--d2l-color-titanius);
				width: 100%;
				padding: 20px;
			}
			.dropdown-content-gradient {
				background: linear-gradient(to top, white, var(--d2l-color-regolith));
			}
			button[aria-pressed="true"] {
				color: var(--d2l-color-celestine);
			}
			button:focus > d2l-icon,
			button:hover > d2l-icon,
			button:focus > span,
			button:hover > span,
			.focus {
				text-decoration: underline;
				color: var(--d2l-color-celestine);
			}
		</style>
	</template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
