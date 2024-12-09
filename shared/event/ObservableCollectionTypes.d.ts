type CollectionChangedArgs<T> =
	| { readonly kind: "add"; readonly added: readonly T[] }
	| { readonly kind: "remove"; readonly removed: readonly T[] }
	| { readonly kind: "clear" };

interface ReadonlyObservableCollection<T extends defined> {
	readonly collectionChanged: ReadonlyArgsSignal<[collectionChangedType: CollectionChangedArgs<T>]>;

	size(): number;
	getArr(): readonly T[];
}
interface ReadonlyObservableCollectionArr<T extends defined>
	extends ReadonlyObservableCollection<T>,
		ReadonlyObservableValue<readonly T[]> {
	get(): readonly T[];
}
interface ReadonlyObservableCollectionSet<T extends defined>
	extends ReadonlyObservableCollection<T>,
		ReadonlyObservableValue<ReadonlySet<T>> {
	get(): ReadonlySet<T>;
}
