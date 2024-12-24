import { InstanceValuesComponent } from "engine/shared/component/InstanceValuesComponent";
import { Transforms } from "engine/shared/component/Transforms";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ValueOverlayKey } from "engine/shared/component/OverlayValueStorage";
import type { TransformProps } from "engine/shared/component/Transform";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [InstanceValuesComponentMacros];

//

declare module "engine/shared/component/InstanceComponent" {
	interface InstanceComponent<out T extends Instance> {
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
export const InstanceValuesComponentMacros: PropertyMacros<InstanceComponent<Instance>> = {
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
