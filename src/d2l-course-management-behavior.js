import '@polymer/polymer/polymer-legacy.js';
window.D2L = window.D2L || {};
window.D2L.MyCourses = window.D2L.MyCourses || {};

/* @polymerBehavior D2L.MyCourses.CourseManagementBehavior */
D2L.MyCourses.CourseManagementBehavior = {
	properties: {
		// Set of pinned enrollment Entities
		pinnedEnrollments: {
			type: Array,
			value: function() {
				return [];
			},
			notify: true
		},
		// Set of unpinned enrollment Entities
		unpinnedEnrollments: {
			type: Array,
			value: function() {
				return [];
			},
			notify: true
		}
	},
	_setEnrollmentPinData: function(entity, isPinned) {
		// HACK: Because the course tiles are being removed and re-created in the DOM, we have to effectively
		// manually update them, rather than updating them with the received enrollment from the API call.
		if (isPinned) {
			entity.class.splice(entity.class.indexOf('unpinned'));
			entity.class.push('pinned');
			entity.actions[0].name = 'unpin-course';
			entity.actions[0].fields[0].value = false;
			entity._actionsByName['unpin-course'] = entity.actions[0];
		} else {
			entity.class.splice(entity.class.indexOf('pinned'));
			entity.class.push('unpinned');
			entity.actions[0].name = 'pin-course';
			entity.actions[0].fields[0].value = true;
			entity._actionsByName['pin-course'] = entity.actions[0];
		}
	}
};
