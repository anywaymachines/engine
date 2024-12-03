interface ReadonlyObservableValueBase<T> {
	readonly changed: ReadonlyArgsSignal<[value: T, prev: T]>;

	get(): T;
}
interface ObservableValueBase<T> extends ReadonlyObservableValueBase<T> {
	set(value: T, forceSet?: boolean): void;
	destroy(): void;
}

interface ReadonlyObservableValue<T> extends ReadonlyObservableValueBase<T> {}
interface ObservableValue<T> extends ReadonlyObservableValue<T>, ObservableValueBase<T> {}
