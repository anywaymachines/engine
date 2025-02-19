interface ReadonlyObservableMap<K extends defined, V extends defined> {
	readonly changed: ReadonlySignal<(key: K, value: V | undefined) => void>;

	get(key: K): V | undefined;
	has(key: K): boolean;

	size(): number;
	getAll(): ReadonlyMap<K, V>;
}
