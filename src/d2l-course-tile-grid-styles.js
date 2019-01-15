const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-course-tile-grid-styles">
	<template>
		<style>
		:host {
			display: block;
			-webkit-user-select: none;
			user-select: none;
			-webkit-touch-callout: none;
			-webkit-tap-highlight-color: rgba(0,0,0,0);
			-moz-tap-highlight-color: rgba(0,0,0,0);
			tap-highlight-color: rgba(0,0,0,0);
			touch-action: pan-x pan-y;

			/*
			* Yay math!
			*
			* The overall width of an n-column layout should be 100%, which is to say:
			*	100% = n(tile width) + 2n(margin) - 2(margin),
			* Since the leftmost and rightmost tiles have zero margin on their left and right, respectively.
			*
			* Move things around, let x = tile width and y = margin width (n is number of columns)
			*	 x = (1 + 2y - 2ny) / n
			*
			* We can therefore find x (tile width) for any given y (margin).
			* The following all use a 1% margin and the formula above.
			*/
			--two-column-width: 49.5%;
			--three-column-width: 32.667%;
			--four-column-width: 24.25%;
		}

		:host([hide-past-courses]) d2l-course-tile[past-course]:not([pinned]),
		:host([limit-to-12]:not([hide-past-courses])) d2l-course-tile:not([pinned]):nth-child(n+13),
		:host([limit-to-12]) d2l-course-tile:not([pinned]):not([past-course]):nth-child(n+13) {
			display: none;
		}

		.grid-container {
			position: relative;
			width: calc(100% + 20px);
			display: flex;
			flex-wrap: wrap;
			flex-direction: row;
			align-items: flex-start;
			align-content: flex-start;
			/* To offset 10px left padding on tile containers, where tile image left edge must align with headers */
			margin-left: -10px;
		}
		.course-tile-container.animate > d2l-course-tile {
			margin-right: 0;
			margin-left: 0;
		}

		.grid-child {
			width: 100%;
		}

		.columns-2 > .grid-child {
			width: var(--two-column-width);
		}

		.columns-3 > .grid-child {
			width: var(--three-column-width);
		}

		.columns-4 > .grid-child {
			width: var(--four-column-width);
		}

		.columns-2 > .grid-child,
		.columns-3 > .grid-child,
		.columns-4 > .grid-child {
			margin-left: 0.5%;
			margin-right: 0.5%;
		}

		.columns-2 > .grid-child:nth-child(2n),
		.columns-3 > .grid-child:nth-child(3n),
		.columns-4 > .grid-child:nth-child(4n) {
			margin-right: 0;
		}

		.columns-2 > .grid-child:nth-child(2n+1),
		.columns-3 > .grid-child:nth-child(3n+1),
		.columns-4 > .grid-child:nth-child(4n+1) {
			margin-left: 0;
		}
		</style>
	</template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
