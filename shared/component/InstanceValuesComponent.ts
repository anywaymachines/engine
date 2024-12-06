import { InstanceValueTransformContainer } from "engine/shared/component/InstanceValueTransformContainer";
import { OverlayValueStorage } from "engine/shared/component/OverlayValueStorage";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

class Value<T> extends OverlayValueStorage<T> {
	readonly transforms: InstanceValueTransformContainer<T>;

	constructor(defaultValue: T, set: (value: T) => void) {
		super(defaultValue);

		this.transforms = new InstanceValueTransformContainer(defaultValue, set);
		this.value.subscribe((value) => this.transforms.value.set(value));
	}

	override destroy(): void {
		super.destroy();
		this.transforms.destroy();
	}
}

//

/** Stores Instance properties, provides methods to change them, with native support for transforms */
export class InstanceValuesComponent<out T extends Instance> implements ComponentTypes.DestroyableComponent {
	private readonly values = new Map<string, Value<unknown>>();
	private readonly instance: T;

	constructor(component: InstanceComponent<T>) {
		this.instance = component.instance;
	}

	get<const K extends keyof T & string>(key: K): Value<T[K]> {
		const existing = this.values.get(key);
		if (existing) return existing as unknown as Value<T[K]>;

		const part = new Value(this.instance[key], (value) => (this.instance[key] = value));
		this.values.set(key, part as Value<unknown>);

		return part;
	}

	destroy(): void {
		for (const [, value] of this.values) {
			value.destroy();
		}

		this.values.clear();
	}
}
