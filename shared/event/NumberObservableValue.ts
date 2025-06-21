import { ObservableValue } from "engine/shared/event/ObservableValue";
import { MathUtils } from "engine/shared/fixes/MathUtils";

/** ObservableValue that stores a number that can be clamped */
export class NumberObservableValue<T extends number | undefined = number> extends ObservableValue<T> {
	readonly min;
	readonly max;
	readonly step;

	constructor(value: T, min: number, max: number, step?: number) {
		super(value, (value) => {
			if (value === undefined) return value;
			if (value !== value) return this.min as T;

			return MathUtils.clamp(value, this.min, this.max, this.step) as T;
		});

		this.min = min;
		this.max = max;
		this.step = step;
	}

	getRange() {
		return this.max - this.min;
	}
}
