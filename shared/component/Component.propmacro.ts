import type { Control } from "engine/client/gui/Control";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ComponentMacros, InstanceComponentMacros, GuiInstanceComponentMacros];

//

declare global {
	interface Component {
		setEnabled(enabled: boolean, key?: string | object): void;
		switchEnabled(key?: string | object): void;

		/** Executes a function on `this` and returns `this` */
		with(func: (selv: this) => void): this;

		/** Parents a child component to `this` and returns `this`  */
		withParented(child: Component): this;

		/** Equivalent of {@link parent} but shows/hides the provided {@link Control} */
		parentGui<T extends Control>(gui: T): T;

		/** Parent the component but without enabling or disabling */
		parentDestroyOnly<T extends Component>(component: T): T;
	}
}
export const ComponentMacros: PropertyMacros<Component> = {
	setEnabled: (selv, enabled, key) => {
		if (enabled) {
			selv.enable(key);
		} else {
			selv.disable(key);
		}
	},
	switchEnabled: (selv, key) => {
		selv.setEnabled(!selv.isEnabled(key), key);
	},
	with: <T extends Component>(selv: T, func: (selv: T) => void): T => {
		func(selv);
		return selv;
	},
	withParented: <T extends Component>(selv: T, child: Component): T => {
		selv.parent(child);
		return selv;
	},

	parentGui: <T extends Control>(selv: Component, gui: T): T => {
		gui.setupShowOnEnable();
		return selv.parent(gui);
	},

	parentDestroyOnly: <T extends Component>(selv: Component, component: T): T => {
		return selv.parent(component, { disable: false, enable: false, immediateEnable: false });
	},
};

declare global {
	interface InstanceComponent<T extends Instance> {
		/** Parents a child component to `this` and returns `this`  */
		withParented(func: Component | ((instance: T) => Component)): this;
	}
}
export const InstanceComponentMacros: PropertyMacros<InstanceComponent<Instance>> = {
	withParented: (selv, func) => {
		if (typeIs(func, "function")) {
			func = func(selv.instance);
		}

		selv.parent(func);
		return selv;
	},
};

export const GuiInstanceComponentMacros: PropertyMacros<InstanceComponent<GuiObject>> = {
	//
};
