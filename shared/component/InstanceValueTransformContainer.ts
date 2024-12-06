import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { ComponentTypes } from "engine/shared/component/Component";

export class InstanceValueTransformContainer<out T> implements ComponentTypes.DestroyableComponent {
	// unknown to fix contrvariativity
	private transforms?: ((enabling: unknown) => ITransformBuilder)[];
	readonly value: ObservableValue<T>;

	constructor(defaultValue: T, set: (value: T) => void) {
		this.value = new ObservableValue<T>(defaultValue);
		this.value.subscribe((value) => {
			if (!this.transforms) {
				set(value);
				return;
			}

			Transforms.create()
				.push(Transforms.parallel(...this.transforms.map((t) => t(value))))
				.then()
				.func(() => set(value))
				.run(this, true);
		});
	}

	addTransform(func: (value: T) => ITransformBuilder): void {
		this.transforms ??= [];
		this.transforms.push((v) => func(v as T));
	}

	destroy(): void {
		this.transforms = [];
	}
}
