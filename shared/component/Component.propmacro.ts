import type { _Component, Component } from "engine/shared/component/Component";
import type { _InstanceComponent } from "engine/shared/component/InstanceComponent";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ComponentMacros, InstanceComponentMacros];

//

declare global {
	interface ComponentPropMacros extends _Component {
		/** Set the state of the component */
		setEnabled(enabled: boolean): void;

		/** Switch the state of the component */
		switchEnabled(): void;

		/** Subscribes to the enabled state change event.
		 * @param executeImmediately If true, the function will be called immediately with the current state. False by default
		 */
		onEnabledStateChange(func: (enabled: boolean) => void, executeImmediately?: boolean): void;

		/** Executes a function on `this` and returns `this` */
		with(func: (selv: this) => void): this;

		/** Parents a child component to `this` and returns `this`  */
		withParented(child: Component): this;

		/** Return a function that returns a copy of the provided Instance; Destroys the original if specified */
		asTemplate<T extends Instance>(object: T, destroyOriginal?: boolean): () => T;
	}
}
export const ComponentMacros: PropertyMacros<ComponentPropMacros> = {
	setEnabled: (selv, enabled) => {
		if (enabled) selv.enable();
		else selv.disable();
	},
	switchEnabled: (selv) => {
		selv.setEnabled(!selv.isEnabled());
	},

	onEnabledStateChange: (selv, func, executeImmediately = false) => {
		selv.enabledState.subscribe(func, executeImmediately);
	},
	with: <T extends ComponentPropMacros>(selv: T, func: (selv: T) => void): T => {
		func(selv);
		return selv;
	},
	withParented: <T extends ComponentPropMacros>(selv: T, child: Component): T => {
		selv.parent(child);
		return selv;
	},
	asTemplate: <T extends Instance>(selv: ComponentPropMacros, object: T, destroyOriginal = true): (() => T) => {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();
		selv.onDestroy(() => template.Destroy());

		return () => template.Clone();
	},
};

//

declare global {
	interface InstanceComponentPropMacros<T extends Instance> extends _InstanceComponent<T> {
		/** Get an attribute value on the Instance */
		getAttribute<T extends AttributeValue>(name: string): T | undefined;
	}
}
export const InstanceComponentMacros: PropertyMacros<InstanceComponentPropMacros<Instance>> = {
	/** Get an attribute value on the Instance */
	getAttribute: <T extends AttributeValue>(selv: InstanceComponentPropMacros<Instance>, name: string) =>
		selv.instance.GetAttribute(name) as T | undefined,
};
