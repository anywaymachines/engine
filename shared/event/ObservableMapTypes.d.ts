interface ReadonlyObservableMap<K extends defined, V extends defined> {
	readonly changed: ReadonlySignal<(key: K, value: V | undefined) => void>;

	size(): number;
	getAll(): ReadonlyMap<K, V>;
}
