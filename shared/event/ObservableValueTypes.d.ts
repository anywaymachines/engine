interface ReadonlySubscribeObservableValue<T> {
	readonly changed: ReadonlySignal<(value: T, prev: T) => void>;

	get(): T;
}
interface ReadonlyObservableValue<T> {
	readonly changed: ReadonlySignal<(value: T, prev: T) => void>;

	get(): T;

	subscribe(func: (value: T, prev: T) => void): SignalConnection;
	subscribe(func: (value: T, prev: T) => void, executeImmediately: boolean | undefined): SignalConnection;

	createBased<TNew>(func: (value: T) => TNew): ReadonlyObservableValue<TNew>;
}

interface IObservableValue<T> extends ReadonlyObservableValue<T> {
	set(value: T, forceSet?: boolean): void;
}
