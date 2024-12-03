import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";

export class InstanceValueTransformContainer<T> {
	private transforms?: ((enabling: T) => ITransformBuilder)[];
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

	addTransform(func: (value: T, builder: ITransformBuilder) => unknown): void {
		this.transforms ??= [];
		this.transforms.push((value) => {
			const builder = Transforms.create();
			func(value, builder);

			return builder;
		});
	}
}
