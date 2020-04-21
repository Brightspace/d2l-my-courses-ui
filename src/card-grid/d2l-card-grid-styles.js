const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-card-grid-styles">
	<template strip-whitespace="">
		<style>
			:host {
				/* Recalculated in _onResize, so initial value is meaningless */
				--course-image-card-height: 0;
			}
			.course-card-grid {
				display: -ms-grid;
				display: grid;
				grid-column-gap: 15px;
			}
			.course-card-grid.columns-1 {
				grid-template-columns: 100%;
				-ms-grid-columns: 100%;
			}
			.course-card-grid.columns-2 {
				grid-template-columns: repeat(2, 1fr);
				-ms-grid-columns: 1fr 15px 1fr;
			}
			.course-card-grid.columns-3 {
				grid-template-columns: repeat(3, 1fr);
				-ms-grid-columns: 1fr 15px 1fr 15px 1fr;
			}
			.course-card-grid.columns-4 {
				grid-template-columns: repeat(4, 1fr);
				-ms-grid-columns: 1fr 15px 1fr 15px 1fr 15px 1fr;
			}

			.course-card-grid div,
			.course-card-grid d2l-enrollment-card {
				min-width: 0;
			}

			.course-card-grid d2l-enrollment-card {
				box-sizing: border-box;
				height: 100%;
				padding-bottom: 0.75rem;
				--course-image-height: var(--course-image-card-height);
			}
		</style>
	</template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
