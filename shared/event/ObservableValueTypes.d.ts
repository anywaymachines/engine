interface ReadonlyObservableValue<T> {
	readonly changed: ReadonlySignal<(value: T, prev: T) => void>;

	get(): T;
}

interface ObservableValue<T> extends ReadonlyObservableValue<T> {
	set(value: T, forceSet?: boolean): void;
}
