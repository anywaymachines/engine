import { InstanceValuesComponent } from "engine/shared/component/InstanceValuesComponent";
import { Transforms } from "engine/shared/component/Transforms";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { OverlaySubValue, ValueOverlayKey } from "engine/shared/component/OverlayValueStorage";
import type { TransformProps } from "engine/shared/component/Transform";

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
			value: OverlaySubValue<T[K]>,
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
		value: OverlaySubValue<T[K]>,
		overlayKey: ValueOverlayKey | undefined,
	) => {
		selv.valuesComponent() //
			.get(key)
			.overlay(overlayKey, value);

		return selv;
	},

	initializeSimpleTransform: (selv, key, props = Transforms.quadOut02) => {
		selv.valuesComponent().get(key).addBasicTransform(props);
		return selv;
	},
};
