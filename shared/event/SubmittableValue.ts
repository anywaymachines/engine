import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { ReadonlyArgsSignal } from "engine/shared/event/Signal";

interface SubmittableValueBase<T> {
	readonly submitted: ReadonlyArgsSignal<[value: T, prev: T]>;

	get(): T;
}
export interface ReadonlySubmittableValue<T> extends SubmittableValueBase<T> {
	readonly value: ReadonlyObservableValue<T>;
}
export interface SignalReadonlySubmittableValue<T> extends SubmittableValueBase<T> {
	readonly value: ObservableValue<T>;

	set(value: T): void;
}

export class SubmittableValue<T> implements ReadonlySubmittableValue<T>, SignalReadonlySubmittableValue<T> {
	static from<T>(value: T) {
		return new SubmittableValue(new ObservableValue(value));
	}

	readonly value;
	readonly _submitted = new ArgsSignal<[value: T, prev: T]>();
	readonly submitted = this._submitted.asReadonly();

	constructor(observable: ObservableValue<T>) {
		this.value = observable;
	}

	get(): T {
		return this.value.get();
	}

	set(value: T): void {
		this.value.set(value);
	}
	submit(value: T): void {
		const prev = this.get();
		this.set(value);
		this._submitted.Fire(value, prev);
	}

	asFullReadonly(): ReadonlySubmittableValue<T> {
		return this;
	}
	asHalfReadonly(): SignalReadonlySubmittableValue<T> {
		return this;
	}
}
