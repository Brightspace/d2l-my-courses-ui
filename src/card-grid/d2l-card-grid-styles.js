const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-css-grid-view-styles">
	<template strip-whitespace="">
		<style>
			:host {
				/* Recalculated in _onResize, so initial value is meaningless */
				--course-image-tile-height: 0;
			}
			.course-tile-grid {
				display: -ms-grid;
				display: grid;
				grid-column-gap: 15px;
			}
			.course-tile-grid.columns-1 {
				grid-template-columns: 100%;
				-ms-grid-columns: 100%;
			}
			.course-tile-grid.columns-2 {
				grid-template-columns: repeat(2, 1fr);
				-ms-grid-columns: 1fr 15px 1fr;
			}
			.course-tile-grid.columns-3 {
				grid-template-columns: repeat(3, 1fr);
				-ms-grid-columns: 1fr 15px 1fr 15px 1fr;
			}
			.course-tile-grid.columns-4 {
				grid-template-columns: repeat(4, 1fr);
				-ms-grid-columns: 1fr 15px 1fr 15px 1fr 15px 1fr;
			}

			.course-tile-grid > div,
			.course-tile-grid > d2l-enrollment-card {
				min-width: 0;
			}

			.course-tile-grid d2l-enrollment-card {
				box-sizing: border-box;
				height: 100%;
				padding-bottom: 0.75rem;
				--course-image-height: var(--course-image-tile-height);
			}
		</style>
	</template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
