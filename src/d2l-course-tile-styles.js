import 'd2l-colors/d2l-colors.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-course-tile-styles">
	<template>
		<style>
			:host {
				display: block;
				-webkit-backface-visibility: hidden;
				-moz-backface-visibility: hidden;
				backface-visibility: hidden;
				margin-bottom: 0px;
				--scale-fade-max-scale: 1.5;
				--scale-fade-min-scale: 1.05;
			}

			.d2l-course-tile-hidden {
				display: none;
			}

			.tile-container {
				position: relative;
				background-color: transparent;
				transition: 0.4s ease-in-out;
				transform: scale(1.0);
				padding: 10px;
				-webkit-backface-visibility: hidden;
				-moz-backface-visibility: hidden;
				backface-visibility: hidden;
				display: inherit !important;
				visibility: inherit;
				margin-bottom: 0.75rem;
			}
			.tile-container.hover {
				transition: 0.3s ease-in-out;
				z-index: 100;
			}

			a, a:hover, a:visited {
				text-decoration: none;
				color: inherit;
			}
			.course-image-container {
				position: relative;
				padding-top: 43%;
				transition: filter 0.25s, -webkit-filter 0.25s;
			}
			.course-image-container.hover {
				-webkit-filter: saturate(1.15);
				filter: saturate(1.15);
			}
			.course-image {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				border-top-left-radius: 10px;
				border-top-right-radius: 10px;
				background: var(--d2l-color-pressicus);
				overflow: hidden;
				z-index: 0;
			}
			.course-image d2l-course-image {
				width: 100%;
				height: 100%;
				object-fit: cover;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				margin: auto;
				transition: filter 0.25s, -webkit-filter 0.25s, transform 0.5s ease-in-out;
			}
			.tile-container:not(.d2l-no-access) .course-image-container.hover > .course-image d2l-course-image {
				/* Ensure only one filter per layer to avoid aliasing bug in Webkit during transforms */
				-webkit-filter: contrast(1.15);
				filter: contrast(1.15);
				transform: scale(1.1);
			}
			@supports (-ms-ime-align:auto) {
				.course-image-container.hover,
				.course-image-container.hover > .course-image d2l-course-image {
					/* See https://github.com/Brightspace/d2l-my-courses-ui/issues/124 */
					filter: none;
				}
			}
			.course-code-text,
			.separator-icon,
			.course-semester-text {
				display: none;
			}
			:host([show-course-code]) .course-code-text,
			:host([show-course-code]) .separator-icon,
			:host([show-semester]) .course-semester-text {
				display: inline-block;
			}

			.course-code-text, .course-semester-text  {
				-ms-word-break: break-all;
				word-break: break-all;
				word-break: break-word; /* Best case, only works in Chrome though */
				@apply --d2l-body-small-text;
			}

			.uppercase {
				text-transform: uppercase;
			}

			.separator-icon {
				color: var(--d2l-color-tungsten)
			}
			.course-text {
				margin-top: 0.6rem;
				float: left;
				flex: 1;
				overflow: hidden;
				word-wrap: break-word; /* IE/Edge */
				overflow-wrap: break-word; /* replaces 'word-wrap' in Firefox, Chrome, Safari */
			}
			.course-info {
				display: flex;
			}
			.update-text-box {
				border: 2px solid var(--d2l-color-carnelian);
				color: var(--d2l-color-carnelian);
				border-radius: 0.25rem;
				box-sizing: border-box;
				font-size: 1rem;
				font-weight: 700;
				width: 2rem;
				height: 2rem;
				line-height: 2rem;
				display: inline-flex;
				margin-top: 0.25rem;
				align-items: center;
				  justify-content: center;
			}
			.tile-container:not(.d2l-no-access) > a:focus .course-text,
			.tile-container:not(.d2l-no-access) > a:hover .course-text{
				text-decoration: underline;
			}
			.tile-container.d2l-no-access .course-text {
				pointer-events: none;
			}

			.menu-bar {
				position: absolute;
				top: 10px;
				right: 10px;
				display: flex;
			}

			:host-context([dir="rtl"]) .menu-bar {
				left: 10px;
				right: auto;
			}

			:host(:not([pinned])) .pin-indicator {
				visibility: hidden;
				width: 0.1px; /* needed so d2l-icon doesnt overflow on safari */
				margin-right: 0;
				padding-left: 0;
				padding-right: 0;
				opacity: 0;
			}

			:host-context([dir="rtl"]):not([pinned]) .pin-indicator {
				margin-left: 0;
			}

			.pin-indicator {
				margin-top: 10px;
				line-height: 20px;
				opacity: 1;
			}
			.hover-menu {
				opacity: 0;
				margin-top: 0px;
				transition: opacity 0.25s, margin-top 0.25s;
				line-height: 20px;
			}
			.hover-menu.hover {
				opacity: 1;
				margin-top: 10px;
			}
			d2l-icon {
				color: white;
				--d2l-icon-width: 18px;
				--d2l-icon-height: 18px;
			}
			.menu-item {
				color: white;
				background: rgba(0,0,0,0.5);
				border: none;
				border-radius: 5px;
				float: left;
				transition: color 0.5s, background 0.5s, opacity 0.25s, width 0.15s, margin-right 0.25s, padding-left 0.25s, padding-right 0.25s;
				cursor: pointer;
				width: 35px;
				height: 35px;
				margin-right: 10px;
			}
			:host-context([dir="rtl"]) .menu-item {
				margin-left: 10px;
				margin-right: auto;
			}
			.menu-item.static {
				margin-top: 10px;
			}
			.menu-item button.span {
				display: none;
			}
			.menu-item:hover, .menu-item:focus {
				color: rgba(255,255,255,1);
				background: var(--d2l-color-celestine);
			}
			.no-tap-interaction {
				-webkit-touch-callout: none;
				-webkit-tap-highlight-color: rgba(0,0,0,0);
				-moz-tap-highlight-color: rgba(0,0,0,0);
				tap-highlight-color: rgba(0,0,0,0);
				touch-action: pan-x pan-y;
			}

			@media not all and (hover: hover) {
				a, .hover-menu, .menu-item {
					-webkit-user-select: none;
				}

				:focus .course-text {
					text-decoration: none;
				}

				.hover-menu {
					display: none;
				}
			 }

			@keyframes scale-and-fade-in {
				from {
					transform: scale(var(--scale-fade-max-scale)) translateZ(0);
					box-shadow: 10px 6px 20px rgba(0, 0, 0, 0.3);
					opacity: 0.0;
				}
				to {
					transform: scale(1.0) translateZ(0);
					box-shadow: 3px 2px 10px rgba(0, 0, 0, 0);
					opacity: 1;
				}
			}
			@keyframes scale-and-fade-out {
				from {
					transform: scale(var(--scale-fade-min-scale)) translateZ(0);
					box-shadow: 3px 2px 10px rgba(0, 0, 0, 0.3);
					opacity: 1;
				}
				to {
					transform: scale(var(--scale-fade-max-scale)) translateZ(0);
					box-shadow: 10px 6px 20px rgba(0, 0, 0, 0.3);
					opacity: 0;
				}
			}

			:host(.animate-insertion) {
				z-index: 100;
			}

			/* Use an animation for this so we can catch the animation completion by name. Hacky and there's probably a better way..*/
			@keyframes tile-pre-insertion {
				from {
					opacity: 0;
				}
				to {
					opacity: 0;
				}
			}

			d2l-loading-spinner {
				display: none;
				z-index: 4;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				margin: auto;
			}

			.change-image-loading d2l-loading-spinner {
				display: flex;
			}

			.change-image-success d2l-loading-spinner,
			.change-image-failure d2l-loading-spinner {
				display: flex;
				opacity: 0;
			}

			.icon-container {
				display: none;
			}

			.change-image-loading .icon-container,
			.change-image-success .icon-container,
			.change-image-failure .icon-container {
				height: 64px;
				width: 64px;
				display: flex;
				justify-content: center;
				align-items: center;
				border-style: none;
				border-radius: 100px;
				background-color: white;
				overflow: hidden;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				margin: auto;
			}

			@keyframes inner {
				0% { transform: scale(1); }
				15% { transform: scale(2.30); }
				20% { transform: scale(2.0); }
				100% { transform: scale(2.0); }
			}

			@keyframes container {
				0% { height: 64px; width: 64px; }
				70% { height: 64px; width: 64px; opacity: 1; }
				90% { height: 80px; width: 80px; opacity: 0.4 }
				100% { height: 20px; width: 20px; opacity: 0; }
			}

			.checkmark {
				display: none;
				color: var(--d2l-color-olivine);
			}

			.fail-icon {
				display: none;
				color: #ffce51;
			}

			.change-image-success,
			.change-image-failure,
			.change-image-loading {
				pointer-events: none;
			}

			.change-image-success .checkmark,
			.change-image-failure .fail-icon {
				display: flex;
				animation-name: inner;
				animation-duration: 1s;
				animation-fill-mode: forwards;
			}

			.change-image-success .icon-container,
			.change-image-failure .icon-container {
				animation-name: container;
				animation-duration: 1s;
				animation-fill-mode: forwards;
			}

			.image-overlay,
			.notification-overlay {
				display: none;
				justify-content: center;
				align-items: center;
			}

			.notification-overlay {
				pointer-events: none;
			}

			.notification-overlay-active .notification-overlay {
				transition: filter 1s 2s, opacity 1s 2s;
				filter: opacity(1);
				width: 100%;
				height: 100%;
				display: block;
				z-index: 2;
				background-color: rgba(0, 0, 0, 0.7);
				position: relative;
			}

			.change-image-loading .image-overlay,
			.change-image-success .image-overlay,
			.change-image-failure .image-overlay {
				width: 100%;
				height: 100%;
				display: block;
				z-index: 2;
				background-color: rgba(0, 0, 0, 0.4);
				position: relative;
			}

			.change-image-loading .notification-overlay {
				transition: none;
			}

			/* HACK: IE doesn't support filter (and chrome has a bug with opacity transitions for this element) */
			@media all and (-ms-high-contrast:none) {
				.change-image-loading .notification-overlay,
				.change-image-success .notification-overlay,
				.change-image-failure .notification-overlay {
					opacity: 0;
				}
			}

			.change-image-loading .notification-overlay,
			.change-image-success .notification-overlay,
			.change-image-failure .notification-overlay {
				filter: opacity(0);
			}

			.overlay-date-container {
				box-sizing: border-box;
				display: flex;
				flex-direction: column;
				justify-content: center;
				position: absolute;
				width: 100%;
				height: 100%;
				color: white;
				padding: 10px;
				text-align: center;
			}

			.overlay-text {
				font-size: 1rem;
				font-weight: bold;
			}

			.overlay-date {
				font-size: 0.7rem;
			}

			.alert-color-circle {
				display: none;
				height: 25px;
				width: 25px;
				border-radius: 20px;
				border: 3px solid white;
				z-index: 1;
				position: absolute;
				top: -2px;
				right: -2px;
			}

			[dir="rtl"] .alert-color-circle {
				right: auto;
				left: -2px;
			}

			.alert-color-circle.warning-circle {
				background-color: #ffce51;
				display: inline;
			}
		</style>
	</template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
