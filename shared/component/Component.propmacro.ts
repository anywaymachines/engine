import type { Control } from "engine/client/gui/Control";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ComponentMacros];

//

declare global {
	interface Component {
		setEnabled(enabled: boolean): void;

		/** Executes a function on `this` and returns `this` */
		with(func: (selv: this) => void): this;

		/** Adds a child component to `this` and returns `this`  */
		withAdded(child: Component): this;

		/** Equivalent of {@link parent} but shows/hides the provided {@link Control} */
		parentGui<T extends Control>(gui: T): T;
	}
}
export const ComponentMacros: PropertyMacros<Component> = {
	setEnabled: (selv, enabled) => {
		if (enabled) {
			selv.enable();
		} else {
			selv.disable();
		}
	},
	with: <T extends Component>(selv: T, func: (selv: T) => void): T => {
		func(selv);
		return selv;
	},
	withAdded: <T extends Component>(selv: T, child: Component): T => {
		selv.parent(child);
		return selv;
	},

	parentGui: <T extends Control>(selv: Component, gui: T): T => {
		gui.setupShowOnEnable();
		return selv.parent(gui);
	},
};
