import { InstanceValueTransformContainer } from "engine/shared/component/InstanceValueTransformContainer";
import { OverlayValueStorage } from "engine/shared/component/OverlayValueStorage";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ObservableSwitchKey } from "engine/shared/event/ObservableSwitch";

class Value<T> implements ComponentTypes.DestroyableComponent {
	private readonly valueStorage;
	readonly transforms: InstanceValueTransformContainer<T>;
	readonly value;

	constructor(defaultValue: T, set: (value: T) => void) {
		this.valueStorage = new OverlayValueStorage<T>(defaultValue);
		this.value = this.valueStorage.value;

		this.transforms = new InstanceValueTransformContainer(defaultValue, set);
		this.value.subscribe((value) => this.transforms.value.set(value));
	}

	setDefaultComputingValue(value: T): void {
		this.valueStorage.setDefaultComputingValue(value);
	}

	overlay(key: ObservableSwitchKey | undefined, value: T | ReadonlyObservableValue<T> | undefined): void {
		this.valueStorage.overlay(key, value);
	}
	or(key: ObservableSwitchKey | undefined, value: T | ReadonlyObservableValue<T> | undefined): void {
		this.valueStorage.or(key, value);
	}
	and(key: ObservableSwitchKey | undefined, value: T | ReadonlyObservableValue<T> | undefined): void {
		this.valueStorage.and(key, value);
	}

	destroy(): void {
		this.valueStorage.destroy();
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
