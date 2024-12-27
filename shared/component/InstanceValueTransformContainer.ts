import { Transforms } from "engine/shared/component/Transforms";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { TransformBuilder } from "engine/shared/component/Transform";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class InstanceValueTransformContainer<T> implements ComponentTypes.DestroyableComponent {
	private transforms?: (<K extends T>(enabling: K) => TransformBuilder)[];
	private current?: T;

	constructor(private readonly value: ObservableValue<T>) {}

	set(value: T): void {
		this.current ??= this.value.get();

		if (value === this.current) return;
		this.current = value;

		if (!this.transforms) {
			this.value.set(value);
			return;
		}

		Transforms.create()
			.push(Transforms.parallel(...this.transforms.map((t) => t(value))))
			.then()
			.func(() => this.value.set(value))
			.run(this, true);
	}

	addTransform(func: (endValue: T, observable: ObservableValue<T>) => TransformBuilder): void {
		this.transforms ??= [];
		this.transforms.push((v) => func(v as T, this.value));
	}

	destroy(): void {
		this.transforms = [];
		this.value.destroy();
	}
}
