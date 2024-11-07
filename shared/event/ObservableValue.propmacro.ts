// function to force hoisting of the macros, because it does not but still tries to use them

import { ObservableValue } from "engine/shared/event/ObservableValue";

// do NOT remove and should ALWAYS be before any other code
const _ = () => [ReadonlyObservableValueMacros, ObservableValueMacros];

declare global {
	interface ReadonlyObservableValue<T> {
		subscribe(func: (value: T, prev: T) => void): SignalConnection;
		subscribe(func: (value: T, prev: T) => void, executeImmediately: boolean | undefined): SignalConnection;

		createBased<TNew>(func: (value: T) => TNew): ReadonlyObservableValue<TNew>;
	}
}
export const ReadonlyObservableValueMacros: PropertyMacros<ReadonlyObservableValue<unknown>> = {
	createBased: <T, TNew>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T) => TNew,
	): ReadonlyObservableValue<TNew> => {
		const observable = new ObservableValue<TNew>(func(selv.get()));
		selv.subscribe((value) => observable.set(func(value)));

		return observable;
	},

	subscribe: <T>(
		selv: ReadonlyObservableValue<T>,
		func: (value: T, prev: T) => void,
		executeImmediately: boolean = false,
	): SignalConnection => {
		const sub = selv.changed.Connect(func);

		if (executeImmediately) {
			func(selv.get(), selv.get());
		}

		return sub;
	},
};

declare global {
	interface ObservableValue<T> {
		asReadonly(): ReadonlyObservableValue<T>;

		/** Binds to the other ObservableValue, making their values to share their value and events. */
		bindTo(observable: ObservableValue<T>): void;

		/** Automatically sets the provided ObservableValue value to the current one. */
		autoSet(observable: ObservableValue<T>, funcProvider?: (value: T) => T): void;

		withDefault(defval: T & defined): ObservableValue<T & defined>;
		waitUntil<U extends T>(func: (value: T) => value is U): U;

		createBothWayBased<TNew>(toOld: (value: TNew) => T, toNew: (value: T) => TNew): ObservableValue<TNew>;
		createBackwardBased<TNew>(defaultValue: TNew, func: (value: TNew) => T): ObservableValue<TNew>;

		withMiddleware(middleware: (value: T) => T): ObservableValue<T>;
	}
}
export const ObservableValueMacros: PropertyMacros<ObservableValue<unknown>> = {
	asReadonly: <T>(selv: ObservableValue<T>): ReadonlyObservableValue<T> => {
		return selv;
	},

	bindTo: <T>(selv: ObservableValue<T>, observable: ObservableValue<T>): void => {
		selv.subscribe((value) => observable.set(value));
		observable.subscribe((value) => selv.set(value), true);
	},

	autoSet: <T>(selv: ObservableValue<T>, observable: ObservableValue<T>, funcProvider?: (value: T) => T): void => {
		selv.subscribe((value) => observable.set(funcProvider === undefined ? value : funcProvider(value)), true);
	},

	withDefault: <T>(selv: ObservableValue<T>, defval: T & defined): ObservableValue<T & defined> => {
		const observable = new ObservableValue<T & defined>(selv.get() ?? defval);
		selv.subscribe((val) => observable.set(val ?? defval));
		observable.subscribe((val) => selv.set(val));

		return observable;
	},

	waitUntil: <T, U extends T>(selv: ObservableValue<T>, func: (value: T) => value is U): U => {
		let ret: U;
		let returned = false;
		const connection = selv.subscribe((value) => {
			if (!func(value)) return;

			ret = value;
			returned = true;
			connection.Disconnect();
		});

		while (!returned) {
			task.wait();
		}

		return ret!;
	},

	createBothWayBased: <T, TNew>(
		selv: ObservableValue<T>,
		toOld: (value: TNew) => T,
		toNew: (value: T) => TNew,
	): ObservableValue<TNew> => {
		const observable = new ObservableValue<TNew>(toNew(selv.get()));
		observable.subscribe((value) => {
			selv.set(toOld(value));
			observable.set(toNew(selv.get()));
		});
		selv.subscribe((value) => observable.set(toNew(value)));

		return observable;
	},
	createBackwardBased: <T, TNew>(
		selv: ObservableValue<T>,
		defaultValue: TNew,
		func: (value: TNew) => T,
	): ObservableValue<TNew> => {
		const observable = new ObservableValue<TNew>(defaultValue);
		observable.subscribe((value) => selv.set(func(value)));

		return observable;
	},

	withMiddleware: <T>(selv: ObservableValue<T>, middleware: (value: T) => T): ObservableValue<T> => {
		const observable = new ObservableValue<T>(middleware(selv.get()), middleware);
		observable.subscribe((value) => selv.set(value));
		selv.subscribe((value) => observable.set(value));

		return observable;
	},
};
