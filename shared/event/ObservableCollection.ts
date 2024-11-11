import { ArgsSignal } from "engine/shared/event/Signal";

abstract class ObservableCollectionBase<T extends defined> implements ReadonlyObservableCollection<T> {
	protected readonly _changed = new ArgsSignal<[collectionChangedType: CollectionChangedArgs<T>]>();
	readonly collectionChanged = this._changed.asReadonly();

	abstract size(): number;
	abstract getArr(): readonly T[];

	/** Clear the collection and add the provided items */
	setRange(items: readonly T[]) {
		this.clear();
		this.add(...items);
	}

	protected abstract _add(...items: readonly T[]): readonly T[];
	protected abstract _remove(...items: readonly T[]): readonly T[];
	protected abstract _clear(): void;

	/** Add the provided items */
	add(...items: readonly T[]) {
		items = this._add(...items);
		if (items.size() === 0) return;

		this._changed.Fire({ kind: "add", added: items });
	}
	/** Add the provided items */
	push(...items: readonly T[]) {
		this.add(...items);
	}

	/** Remove the provided items */
	remove(...items: readonly T[]) {
		items = this._remove(...items);
		if (items.size() === 0) return;

		this._changed.Fire({ kind: "remove", removed: items });
	}
	/** Clear the collection */
	clear() {
		if (this.size() === 0) return;

		this._clear();
		this._changed.Fire({ kind: "clear" });
	}

	asReadonly(): ReadonlyObservableCollection<T> {
		return this;
	}
}

export interface ObservableCollectionArr<T extends defined> extends ReadonlyObservableValue<readonly T[]> {}
export class ObservableCollectionArr<T extends defined>
	extends ObservableCollectionBase<T>
	implements ReadonlyObservableCollectionArr<T>, ReadonlyObservableValueBase<readonly T[]>
{
	readonly changed;
	private readonly items: T[] = [];

	constructor(items: readonly T[] = []) {
		super();
		this.items = [...items];

		const changed = new ArgsSignal<[value: readonly T[], prev: readonly T[]]>();
		this.changed = changed.asReadonly();
		this.collectionChanged.Connect(() => {
			const items = this.get();
			changed.Fire(items, items);
		});
	}

	get(): readonly T[] {
		return this.items;
	}
	getArr(): readonly T[] {
		return this.get();
	}

	size(): number {
		return this.items.size();
	}
	has(item: T) {
		return this.items.includes(item);
	}

	/** Pop the last added item */
	pop(): T | undefined {
		const item = this.items.pop();

		if (item !== undefined) {
			this._changed.Fire({ kind: "remove", removed: [item] });
		}

		return item;
	}

	protected _add(...items: readonly T[]): readonly T[] {
		for (const item of items) {
			this.items.push(item);
		}

		return items;
	}
	protected _remove(...items: readonly T[]): readonly T[] {
		for (const item of items) {
			this.items.remove(this.items.indexOf(item));
		}

		return items;
	}
	protected _clear(): void {
		this.items.clear();
	}

	asReadonly(): ReadonlyObservableCollectionArr<T> {
		return this;
	}
}

export interface ObservableCollectionSet<T extends defined> extends ReadonlyObservableValue<ReadonlySet<T>> {}
export class ObservableCollectionSet<T extends defined>
	extends ObservableCollectionBase<T>
	implements ReadonlyObservableCollectionSet<T>, ReadonlyObservableValueBase<ReadonlySet<T>>
{
	readonly changed;
	private readonly items: Set<T>;

	constructor(items: readonly T[] = []) {
		super();
		this.items = new Set<T>(items);

		const changed = new ArgsSignal<[value: ReadonlySet<T>, prev: ReadonlySet<T>]>();
		this.changed = changed.asReadonly();
		this.collectionChanged.Connect(() => {
			const items = this.get();
			changed.Fire(items, items);
		});
	}

	get(): ReadonlySet<T> {
		return this.items;
	}
	getArr(): readonly T[] {
		return [...this.get()];
	}

	size(): number {
		return this.items.size();
	}
	has(item: T) {
		return this.items.has(item);
	}

	protected _add(...items: readonly T[]): readonly T[] {
		const added: T[] = [];
		for (const item of items) {
			if (this.items.has(item)) {
				continue;
			}

			added.push(item);
			this.items.add(item);
		}

		return added;
	}
	protected _remove(...items: readonly T[]): readonly T[] {
		const deleted: T[] = [];
		for (const item of items) {
			if (!this.items.has(item)) {
				continue;
			}

			deleted.push(item);
			this.items.delete(item);
		}

		return deleted;
	}
	protected _clear(): void {
		this.items.clear();
	}

	asReadonly(): ReadonlyObservableCollectionSet<T> {
		return this;
	}
}
