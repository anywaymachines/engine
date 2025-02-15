import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ReadonlyObservableValueMacros, ObservableValueMacros, ObservableValueBoolMacros];

declare module "engine/shared/event/ObservableValue" {
	interface ReadonlyObservableValue<T> {
		subscribe(func: (value: T) => void, executeImmediately?: boolean): SignalConnection;
		subscribePrev(func: (value: T, prev: T) => void, executeImmediately?: boolean): SignalConnection;
		subscribeWithCustomEquality(
			func: (value: T, prev: T) => void,
			equalityCheck: (value: T, prev: T) => boolean,
			executeImmediately?: boolean,
		): SignalConnection;

		/** @deprecated Use fCreateBased() instead */
		createBased<TNew>(func: (value: T) => TNew): ReadonlyObservableValue<TNew>;

		/** Creates a new ObservableValue that always has the opposite value. */
		not(this: ReadonlyObservableValue<boolean>): ReadonlyObservableValue<boolean>;
	}
}
export const ReadonlyObservableValueMacros: PropertyMacros<ReadonlyObservableValue<unknown>> = {
	subscribe: <T>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T) => void,
		executeImmediately: boolean = false,
	): SignalConnection => {
		const sub = selv.changed.Connect(func);

		if (executeImmediately) {
			func(selv.get());
		}

		return sub;
	},
	subscribePrev: <T>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T, prev: T) => void,
		executeImmediately: boolean = false,
	): SignalConnection => {
		let prev = selv.get();
		return selv.subscribe((v) => {
			func(v, prev);
			prev = v;
		}, executeImmediately);
	},
	subscribeWithCustomEquality: <T>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T, prev: T) => void,
		equalityCheck: (value: T, prev: T) => boolean,
		executeImmediately?: boolean,
	): SignalConnection => {
		const sub = selv.subscribePrev((value, prev) => {
			if (equalityCheck(value, prev)) return;
			func(value, prev);
		});

		if (executeImmediately) {
			const v = selv.get();
			func(v, v);
		}

		return sub;
	},

	createBased: <T, U>(selv: ReadonlyObservableValue<T>, func: (value: T) => U): ReadonlyObservableValue<U> => {
		const observable = new ObservableValue<U>(func(selv.get()));
		selv.subscribe((value) => observable.set(func(value)), true);

		return observable;
	},

	not: (selv) => selv.createBased((v) => !v),
};

declare module "engine/shared/event/ObservableValue" {
	interface ObservableValue<T> {
		asReadonly(): ReadonlyObservableValue<T>;
		createBothWayBased<U>(toOld: (value: U) => T, toNew: (value: T) => U): ObservableValue<U>;

		toggle(this: ObservableValue<boolean>): boolean;

		/** Connect two observables to have the same value. Immediately sets the other observable value to this one */
		connect(other: ObservableValue<T>): SignalConnection;
	}
}
export const ObservableValueMacros: PropertyMacros<ObservableValue<unknown>> = {
	asReadonly: <T>(selv: ObservableValue<T>): ReadonlyObservableValue<T> => {
		return selv;
	},

	createBothWayBased: <T, U>(
		selv: ObservableValue<T>,
		toOld: (value: U) => T,
		toNew: (value: T) => U,
	): ObservableValue<U> => {
		const observable = new ObservableValue<U>(toNew(selv.get()));
		observable.subscribe((value) => {
			selv.set(toOld(value));
			observable.set(toNew(selv.get()));
		});
		selv.subscribe((value) => observable.set(toNew(value)));

		return observable;
	},

	connect: <T>(selv: ObservableValue<T>, other: ObservableValue<T>): SignalConnection => {
		return Signal.multiConnection(
			other.subscribe((value) => selv.set(value)),
			selv.subscribe((value) => other.set(value), true),
		);
	},
};

export const ObservableValueBoolMacros: PropertyMacros<ObservableValue<boolean>> = {
	toggle: (selv: ObservableValue<boolean>): boolean => {
		const val = !selv.get();
		selv.set(val);

		return val;
	},
};
