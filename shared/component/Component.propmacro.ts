import type { Control } from "engine/client/gui/Control";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ComponentMacros];

//

declare global {
	interface Component {
		setEnabled(enabled: boolean): void;
		with(func: (selv: this) => void): this;

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

	parentGui: <T extends Control>(selv: Component, gui: T): T => {
		selv.onEnable(() => gui.show());
		selv.onDisable(() => gui.hide());
		selv.onDestroy(() => gui.destroy());

		if (selv.isEnabled()) gui.show();
		return gui;
	},
};
