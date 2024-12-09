import { InstanceValuesComponent } from "engine/shared/component/InstanceValuesComponent";
import { Transforms } from "engine/shared/component/Transforms";
import type { Component } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ValueOverlayKey } from "engine/shared/component/OverlayValueStorage";
import type { TransformProps } from "engine/shared/component/Transform";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ComponentMacros, InstanceComponentMacros];

//

declare module "engine/shared/component/Component" {
	interface Component {
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

		/** Parents the component to the given component with the config of destroying only. */
		parentDestroyOnly<T extends Component>(child: T): T;
	}
}
export const ComponentMacros: PropertyMacros<Component> = {
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
	with: <T extends Component>(selv: T, func: (selv: T) => void): T => {
		func(selv);
		return selv;
	},
	withParented: <T extends Component>(selv: T, child: Component): T => {
		selv.parent(child);
		return selv;
	},
	asTemplate: <T extends Instance>(selv: Component, object: T, destroyOriginal = true): (() => T) => {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();
		selv.onDestroy(() => template.Destroy());

		return () => template.Clone();
	},
	parentDestroyOnly: <T extends Component>(selv: Component, child: T): T => {
		return selv.parent(child, { enable: false, disable: false });
	},
};

//

declare module "engine/shared/component/InstanceComponent" {
	interface InstanceComponent<out T extends Instance> {
		/** Get an attribute value on the Instance */
		getAttribute<T extends AttributeValue>(name: string): T | undefined;

		/** Get or add the InstanceValuesComponent */
		valuesComponent(): InstanceValuesComponent<T>;

		/** Shorthand for `this.valuesComponent().get(key).overlay(overlayKey, value);` */
		overlayValue<K extends keyof T>(
			key: K,
			value: T[K] | ReadonlyObservableValue<T[K]> | undefined,
			overlayKey?: ValueOverlayKey | undefined,
		): this;

		/** Initialize a simple transform for the provided key with Transforms.quadOut02 by default */
		initializeSimpleTransform(key: keyof T, props?: TransformProps): this;
	}
}
export const InstanceComponentMacros: PropertyMacros<InstanceComponent<Instance>> = {
	/** Get an attribute value on the Instance */
	getAttribute: <T extends AttributeValue>(selv: InstanceComponent<Instance>, name: string) =>
		selv.instance.GetAttribute(name) as T | undefined,

	valuesComponent: (selv) => selv.getComponent(InstanceValuesComponent),

	overlayValue: <T extends Instance, K extends keyof T & string>(
		selv: InstanceComponent<T>,
		key: K,
		value: T[K] | ReadonlyObservableValue<T[K]> | undefined,
		overlayKey: ValueOverlayKey | undefined,
	) => {
		selv.valuesComponent() //
			.get(key)
			.overlay(overlayKey, value);

		return selv;
	},

	initializeSimpleTransform: (selv, key, props = Transforms.quadOut02) => {
		selv.valuesComponent()
			.get(key)
			.transforms.addTransform((value) => Transforms.create().transform(selv.instance, key, value, props));

		return selv;
	},
};
