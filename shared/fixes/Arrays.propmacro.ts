// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [
	[WritableMapMacros, NumberArrayMacros],
	[ArrayMacros1, SetMacros1, MapMacros1],
	[ArrayMacros2, SetMacros2, MapMacros2],
	[ArrayMacrosFilter, SetMacrosFilter, MapMacrosFilter],
	[ArrayMacrosMap, SetMacrosMap, MapMacrosMap],
	[ArrayMacrosFlatmap, SetMacrosFlatmap, MapMacrosFlatmap],
	[ArrayMacrosChunk, SetMacrosChunk, MapMacrosChunk],
	[ArrayMacros7, SetMacros7, MapMacros7],
	[ArrayMacrosFind, SetMacrosFind, MapMacrosFind],
	[ArrayMacros9, SetMacros9, MapMacros9],
	[ArrayMacrosGroupBy, SetMacrosGroupBy, MapMacrosGroupBy],
	[ArrayMacrosExcept, SetMacrosExcept, MapMacrosExcept],
	[ArrayMacrosConvert, SetMacrosConvert, MapMacrosConvert],
	[ArrayMacrosSequenceEquals, SetMacrosSequenceEquals, MapMacrosSequenceEquals],
];

declare global {
	interface ReadonlyArray<T> {
		count(func?: (value: T, index: number) => boolean): number;
		all(func: (value: T, index: number) => boolean): boolean;
		any(): boolean;
		any(func: (value: T, index: number) => boolean): boolean;
		contains(value: T): boolean;
	}
	interface ReadonlySet<T> {
		count(func?: (value: T) => boolean): number;
		all(func: (value: T) => boolean): boolean;
		any(): boolean;
		any(func: (value: T) => boolean): boolean;
		contains(value: T): boolean;
	}
	interface ReadonlyMap<K, V> {
		count(func?: (key: K, value: V) => boolean): number;
		all(func: (key: K, value: V) => boolean): boolean;
		any(): boolean;
		any(func: (key: K, value: V) => boolean): boolean;
		containsKey(key: K): boolean;
		containsValue(value: V): boolean;
	}
}
export const ArrayMacros1: PropertyMacros<ReadonlyArray<defined>> = {
	count: <T>(selv: ReadonlyArray<T>, func?: (value: T, index: number) => boolean): number => {
		if (!func) return selv.size();

		let count = 0;
		for (const [index, value] of ipairs(selv)) {
			if (func(value, index)) {
				count++;
			}
		}

		return count;
	},
	all: <T>(selv: ReadonlyArray<T>, func: (value: T, index: number) => boolean): boolean => {
		for (const [index, value] of ipairs(selv)) {
			if (!func(value, index)) {
				return false;
			}
		}

		return true;
	},
	any: <T>(selv: ReadonlyArray<T>, func?: (value: T, index: number) => boolean): boolean => {
		if (!func) return selv.size() !== 0;

		for (const [index, value] of ipairs(selv)) {
			if (func(value, index)) {
				return true;
			}
		}

		return false;
	},
	contains: <T>(selv: ReadonlyArray<T>, item: T): boolean => {
		for (const value of selv) {
			if (value === item) {
				return true;
			}
		}

		return false;
	},
};
export const SetMacros1: PropertyMacros<ReadonlySet<defined>> = {
	count: <T>(selv: ReadonlySet<T>, func?: (value: T) => boolean): number => {
		if (!func) return selv.size();

		let count = 0;
		for (const value of selv) {
			if (func(value)) {
				count++;
			}
		}

		return count;
	},
	all: <T>(selv: ReadonlySet<T>, func: (value: T) => boolean): boolean => {
		for (const value of selv) {
			if (!func(value)) {
				return false;
			}
		}

		return true;
	},
	any: <T>(selv: ReadonlySet<T>, func?: (value: T) => boolean): boolean => {
		if (!func) return selv.size() !== 0;

		for (const value of selv) {
			if (func(value)) {
				return true;
			}
		}

		return false;
	},
	contains: <T>(selv: ReadonlySet<T>, item: T): boolean => {
		for (const value of selv) {
			if (value === item) {
				return true;
			}
		}

		return false;
	},
};
export const MapMacros1: PropertyMacros<ReadonlyMap<defined, unknown>> = {
	count: <K, V>(selv: ReadonlyMap<K, V>, func?: (key: K, value: V) => boolean): number => {
		if (!func) return selv.size();

		let count = 0;
		for (const [key, value] of selv) {
			if (func(key, value)) {
				count++;
			}
		}

		return count;
	},
	all: <K, V>(selv: ReadonlyMap<K, V>, func: (key: K, value: V) => boolean): boolean => {
		for (const [key, value] of selv) {
			if (!func(key, value)) {
				return false;
			}
		}

		return true;
	},
	any: <K, V>(selv: ReadonlyMap<K, V>, func?: (key: K, value: V) => boolean): boolean => {
		if (!func) return selv.size() !== 0;

		for (const [key, value] of selv) {
			if (func(key, value)) {
				return true;
			}
		}

		return false;
	},
	containsKey: <K, V>(selv: ReadonlyMap<K, V>, item: K): boolean => {
		return selv.has(item);
	},
	containsValue: <K, V>(selv: ReadonlyMap<K, V>, item: V): boolean => {
		for (const [key, value] of selv) {
			if (value === item) {
				return true;
			}
		}

		return false;
	},
};

declare global {
	interface ReadonlyArray<T> {
		first(): T | undefined;
	}
	interface ReadonlySet<T> {
		first(): T | undefined;
	}
	interface ReadonlyMap<K, V> {
		firstKey(): K | undefined;
		firstValue(): V | undefined;
	}
}
export const ArrayMacros2: PropertyMacros<ReadonlyArray<defined>> = {
	first: <T>(selv: ReadonlyArray<T>): T | undefined => selv[0],
};
export const SetMacros2: PropertyMacros<ReadonlySet<defined>> = {
	first: <T>(selv: ReadonlySet<T>): T | undefined => {
		for (const value of selv) {
			return value;
		}

		return undefined;
	},
};
export const MapMacros2: PropertyMacros<ReadonlyMap<defined, unknown>> = {
	firstKey: <K, V>(selv: ReadonlyMap<K, V>): K | undefined => {
		for (const [key, value] of selv) {
			return key;
		}

		return undefined;
	},
	firstValue: <K, V>(selv: ReadonlyMap<K, V>): V | undefined => {
		for (const [key, value] of selv) {
			return value;
		}

		return undefined;
	},
};

declare global {
	interface ReadonlyArray<T> {
		filter<S extends T>(
			this: ReadonlyArray<defined>,
			callback: (value: T, index: number, array: ReadonlyArray<T>) => value is S,
		): S[];
		filter(
			this: ReadonlyArray<defined>,
			callback: (value: T, index: number, array: ReadonlyArray<T>) => boolean | undefined,
		): T[];

		filterToSet<S extends T>(
			this: ReadonlyArray<defined>,
			callback: (value: T, index: number, array: ReadonlyArray<T>) => value is S,
		): Set<S>;
		filterToSet(
			this: ReadonlyArray<defined>,
			callback: (value: T, index: number, array: ReadonlyArray<T>) => boolean | undefined,
		): Set<T>;

		filterToMap<S extends T>(
			this: ReadonlyArray<defined>,
			callback: (value: T, index: number, array: ReadonlyArray<T>) => value is S,
		): Map<number, S>;
		filterToMap(
			this: ReadonlyArray<defined>,
			callback: (value: T, index: number, array: ReadonlyArray<T>) => boolean | undefined,
		): Map<number, T>;
	}
	interface ReadonlySet<T> {
		filter<S extends T>(this: ReadonlySet<defined>, callback: (value: T, set: ReadonlySet<T>) => value is S): S[];
		filter(this: ReadonlySet<defined>, callback: (value: T, set: ReadonlySet<T>) => boolean | undefined): T[];

		filterToSet<S extends T>(
			this: ReadonlySet<defined>,
			callback: (value: T, set: ReadonlySet<T>) => value is S,
		): Set<S>;
		filterToSet(
			this: ReadonlySet<defined>,
			callback: (value: T, set: ReadonlySet<T>) => boolean | undefined,
		): Set<T>;
	}
	interface ReadonlyMap<K, V> {
		filter<S extends V>(
			this: ReadonlyMap<defined, defined>,
			callback: (key: K, value: V, set: ReadonlyMap<K, V>) => value is S,
		): Map<K, S>;
		filter(
			this: ReadonlyMap<defined, defined>,
			callback: (key: K, value: V, set: ReadonlyMap<K, V>) => boolean | undefined,
		): Map<K, V>;
	}
}
export const ArrayMacrosFilter: PropertyMacros<ReadonlyArray<defined>> = {
	filter: <T extends defined>(
		selv: ReadonlyArray<T>,
		callback: (value: T, index: number, array: ReadonlyArray<T>) => boolean | undefined,
	): T[] => {
		const ret: T[] = [];
		for (const [index, value] of ipairs(selv)) {
			if (callback(value, index, selv)) {
				ret.push(value);
			}
		}

		return ret;
	},
	filterToSet: <T extends defined>(
		selv: ReadonlyArray<T>,
		callback: (value: T, index: number, array: ReadonlyArray<T>) => boolean | undefined,
	): Set<T> => {
		const ret = new Set<T>();
		for (const [index, value] of ipairs(selv)) {
			if (callback(value, index, selv)) {
				ret.add(value);
			}
		}

		return ret;
	},
	filterToMap: <T extends defined>(
		selv: ReadonlyArray<T>,
		callback: (value: T, index: number, array: ReadonlyArray<T>) => boolean | undefined,
	): Map<number, T> => {
		const ret = new Map<number, T>();
		for (const [index, value] of ipairs(selv)) {
			if (callback(value, index, selv)) {
				ret.set(index, value);
			}
		}

		return ret;
	},
};
export const SetMacrosFilter: PropertyMacros<ReadonlySet<defined>> = {
	filter: <T extends defined>(
		selv: ReadonlySet<T>,
		callback: (value: T, set: ReadonlySet<T>) => boolean | undefined,
	): T[] => {
		const ret: T[] = [];
		for (const value of selv) {
			if (callback(value, selv)) {
				ret.push(value);
			}
		}

		return ret;
	},
	filterToSet: <T extends defined>(
		selv: ReadonlySet<T>,
		callback: (value: T, set: ReadonlySet<T>) => boolean | undefined,
	): Set<T> => {
		const ret = new Set<T>();
		for (const value of selv) {
			if (callback(value, selv)) {
				ret.add(value);
			}
		}

		return ret;
	},
};
export const MapMacrosFilter: PropertyMacros<ReadonlyMap<defined, defined>> = {
	filter: <K, V>(
		selv: ReadonlyMap<K, V>,
		callback: (key: K, item: V, array: ReadonlyMap<K, V>) => boolean | undefined,
	): Map<K, V> => {
		const ret = new Map<K, V>();
		for (const [key, value] of selv) {
			if (callback(key, value, selv)) {
				ret.set(key, value);
			}
		}

		return ret;
	},
};

declare global {
	interface ReadonlyArray<T> {
		map<U extends defined>(
			this: ReadonlyArray<defined>,
			callback: (value: T, index: number, array: ReadonlyArray<T>) => U,
		): U[];
		mapToSet<U extends defined>(
			this: ReadonlyArray<defined>,
			callback: (value: T, index: number, array: ReadonlyArray<T>) => U,
		): Set<U>;
		mapToMap<KU extends defined, VU extends defined>(
			this: ReadonlyArray<defined>,
			callback: (value: T, index: number, array: ReadonlyArray<T>) => LuaTuple<[key: KU, value: VU | undefined]>,
		): Map<KU, VU>;
	}
	interface ReadonlySet<T> {
		map<U extends defined>(this: ReadonlySet<defined>, callback: (value: T, set: ReadonlySet<T>) => U): U[];
		mapToSet<U extends defined>(this: ReadonlySet<defined>, callback: (value: T, set: ReadonlySet<T>) => U): Set<U>;
		mapToMap<KU extends defined, VU extends defined>(
			this: ReadonlySet<defined>,
			callback: (value: T, set: ReadonlySet<T>) => LuaTuple<[key: KU, value: VU | undefined]>,
		): Map<KU, VU>;
	}
	interface ReadonlyMap<K, V> {
		map<U extends defined>(this: ReadonlyMap<K, V>, func: (key: K, value: V, map: ReadonlyMap<K, V>) => U): U[];
		mapToSet<U extends defined>(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V, map: ReadonlyMap<K, V>) => U,
		): Set<U>;
		mapToMap<KU extends defined, VU extends defined>(
			this: ReadonlyMap<K, V>,
			callback: (key: K, value: V, map: ReadonlyMap<K, V>) => LuaTuple<[key: KU, value: VU | undefined]>,
		): Map<KU, VU>;
	}
}
export const ArrayMacrosMap: PropertyMacros<ReadonlyArray<defined>> = {
	map: <T extends defined, U extends defined>(
		selv: ReadonlyArray<T>,
		callback: (value: T, index: number, array: ReadonlyArray<T>) => U,
	): U[] => {
		const ret: U[] = [];
		for (const [index, value] of ipairs(selv)) {
			ret.push(callback(value, index, selv));
		}

		return ret;
	},
	mapToSet: <T extends defined, U extends defined>(
		selv: ReadonlyArray<T>,
		callback: (value: T, index: number, array: ReadonlyArray<T>) => U,
	): Set<U> => {
		const ret = new Set<U>();
		for (const [index, value] of ipairs(selv)) {
			ret.add(callback(value, index, selv));
		}

		return ret;
	},
	mapToMap: <T extends defined, KU extends defined, VU extends defined>(
		selv: ReadonlyArray<T>,
		callback: (value: T, index: number, array: ReadonlyArray<T>) => LuaTuple<[key: KU, value: VU | undefined]>,
	): Map<KU, VU> => {
		const ret = new Map<KU, VU>();
		for (const [index, value] of ipairs(selv)) {
			const [k, v] = callback(value, index, selv);
			if (v === undefined) continue;

			ret.set(k, v);
		}

		return ret;
	},
};
export const SetMacrosMap: PropertyMacros<ReadonlySet<defined>> = {
	map: <T extends defined, U extends defined>(
		selv: ReadonlySet<T>,
		callback: (value: T, set: ReadonlySet<T>) => U,
	): U[] => {
		const ret: U[] = [];
		for (const value of selv) {
			ret.push(callback(value, selv));
		}

		return ret;
	},
	mapToSet: <T extends defined, U extends defined>(
		selv: ReadonlySet<T>,
		callback: (value: T, set: ReadonlySet<T>) => U,
	): Set<U> => {
		const ret = new Set<U>();
		for (const value of selv) {
			ret.add(callback(value, selv));
		}

		return ret;
	},
	mapToMap: <T extends defined, KU extends defined, VU extends defined>(
		selv: ReadonlySet<T>,
		callback: (value: T, array: ReadonlySet<T>) => LuaTuple<[KU, VU | undefined]>,
	): Map<KU, VU> => {
		const ret = new Map<KU, VU>();
		for (const value of selv) {
			const [k, v] = callback(value, selv);
			if (v === undefined) continue;

			ret.set(k, v);
		}

		return ret;
	},
};
export const MapMacrosMap: PropertyMacros<ReadonlyMap<defined, defined>> = {
	map: <K extends defined, V extends defined, U extends defined>(
		selv: ReadonlyMap<K, V>,
		callback: (key: K, value: V, set: ReadonlyMap<K, V>) => U,
	): U[] => {
		const ret: U[] = [];
		for (const [key, value] of selv) {
			ret.push(callback(key, value, selv));
		}

		return ret;
	},
	mapToSet: <K extends defined, V extends defined, U extends defined>(
		selv: ReadonlyMap<K, V>,
		callback: (key: K, value: V, set: ReadonlyMap<K, V>) => U,
	): Set<U> => {
		const ret = new Set<U>();
		for (const [key, value] of selv) {
			ret.add(callback(key, value, selv));
		}

		return ret;
	},
	mapToMap: <K extends defined, V extends defined, KU extends defined, VU extends defined>(
		selv: ReadonlyMap<K, V>,
		callback: (key: K, value: V, array: ReadonlyMap<K, V>) => LuaTuple<[key: KU, value: VU | undefined]>,
	): Map<KU, VU> => {
		const ret = new Map<KU, VU>();
		for (const [key, value] of selv) {
			const [k, v] = callback(key, value, selv);
			if (v === undefined) continue;

			ret.set(k, v);
		}

		return ret;
	},
};

declare global {
	interface ReadonlyArray<T> {
		flatmap<U extends defined>(
			this: ReadonlyArray<T>,
			func: (value: T, index: number, arr: ReadonlyArray<T>) => readonly U[],
		): U[];
		flatmapToSet<U extends defined>(
			this: ReadonlyArray<T>,
			func: (value: T, index: number, arr: ReadonlyArray<T>) => readonly U[],
		): Set<U>;
		flatmapToMap<KU extends defined, VU extends defined>(
			this: ReadonlyArray<T>,
			func: (value: T, index: number, arr: ReadonlyArray<T>) => readonly (readonly [key: KU, value: VU])[],
		): Map<KU, VU>;
	}
	interface ReadonlySet<T> {
		flatmap<U extends defined>(this: ReadonlySet<T>, func: (value: T, set: ReadonlySet<T>) => readonly U[]): U[];
		flatmapToSet<U extends defined>(
			this: ReadonlySet<T>,
			func: (value: T, set: ReadonlySet<T>) => readonly U[],
		): Set<U>;
		flatmapToMap<KU extends defined, VU extends defined>(
			this: ReadonlySet<T>,
			func: (value: T, set: ReadonlySet<T>) => readonly (readonly [key: KU, value: VU])[],
		): Map<KU, VU>;
	}
	interface ReadonlyMap<K, V> {
		flatmap<U extends defined>(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V, map: ReadonlyMap<K, V>) => readonly U[],
		): U[];
		flatmapToSet<U extends defined>(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V, map: ReadonlyMap<K, V>) => readonly U[],
		): Set<U>;
		flatmapToMap<KU extends defined, VU extends defined>(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V, map: ReadonlyMap<K, V>) => readonly (readonly [key: KU, value: VU])[],
		): Map<KU, VU>;
	}
}
export const ArrayMacrosFlatmap: PropertyMacros<ReadonlyArray<defined>> = {
	flatmap: <T extends defined, U extends defined>(
		selv: ReadonlyArray<T>,
		callback: (item: defined, index: number, arr: ReadonlyArray<T>) => readonly U[],
	): U[] => {
		const ret: U[] = [];
		for (const [index, value] of ipairs(selv)) {
			for (const item of callback(value, index, selv)) {
				ret.push(item);
			}
		}

		return ret;
	},
	flatmapToSet: <T extends defined, U extends defined>(
		selv: ReadonlyArray<T>,
		callback: (item: defined, index: number, arr: ReadonlyArray<T>) => readonly U[],
	): Set<U> => {
		const ret = new Set<U>();
		for (const [index, value] of ipairs(selv)) {
			for (const item of callback(value, index, selv)) {
				ret.add(item);
			}
		}

		return ret;
	},
	flatmapToMap: <T extends defined, KU extends defined, VU extends defined>(
		selv: ReadonlyArray<T>,
		callback: (item: defined, index: number, arr: ReadonlyArray<T>) => readonly (readonly [key: KU, value: VU])[],
	): Map<KU, VU> => {
		const ret = new Map<KU, VU>();
		for (const [index, value] of ipairs(selv)) {
			for (const [k, v] of callback(value, index, selv)) {
				ret.set(k, v);
			}
		}

		return ret;
	},
};
export const SetMacrosFlatmap: PropertyMacros<ReadonlySet<defined>> = {
	flatmap: <T extends defined, U extends defined>(
		selv: ReadonlySet<T>,
		callback: (item: defined, set: ReadonlySet<T>) => readonly U[],
	): U[] => {
		const ret: U[] = [];
		for (const value of selv) {
			for (const item of callback(value, selv)) {
				ret.push(item);
			}
		}

		return ret;
	},
	flatmapToSet: <T extends defined, U extends defined>(
		selv: ReadonlySet<T>,
		callback: (item: defined, set: ReadonlySet<T>) => readonly U[],
	): Set<U> => {
		const ret = new Set<U>();
		for (const value of selv) {
			for (const item of callback(value, selv)) {
				ret.add(item);
			}
		}

		return ret;
	},
	flatmapToMap: <T extends defined, KU extends defined, VU extends defined>(
		selv: ReadonlySet<T>,
		callback: (item: defined, set: ReadonlySet<T>) => readonly (readonly [key: KU, value: VU])[],
	): Map<KU, VU> => {
		const ret = new Map<KU, VU>();
		for (const value of selv) {
			for (const [k, v] of callback(value, selv)) {
				ret.set(k, v);
			}
		}

		return ret;
	},
};
export const MapMacrosFlatmap: PropertyMacros<ReadonlyMap<defined, defined>> = {
	flatmap: <K extends defined, V extends defined, U extends defined>(
		selv: ReadonlyMap<K, V>,
		callback: (key: K, value: V, map: ReadonlyMap<K, V>) => readonly U[],
	): U[] => {
		const ret: U[] = [];
		for (const [key, value] of selv) {
			for (const item of callback(key, value, selv)) {
				ret.push(item);
			}
		}

		return ret;
	},
	flatmapToSet: <K extends defined, V extends defined, U extends defined>(
		selv: ReadonlyMap<K, V>,
		callback: (key: K, value: V, map: ReadonlyMap<K, V>) => readonly U[],
	): Set<U> => {
		const ret = new Set<U>();
		for (const [key, value] of selv) {
			for (const item of callback(key, value, selv)) {
				ret.add(item);
			}
		}

		return ret;
	},
	flatmapToMap: <K extends defined, V extends defined, KU extends defined, VU extends defined>(
		selv: ReadonlyMap<K, V>,
		callback: (key: K, value: V, map: ReadonlyMap<K, V>) => readonly (readonly [key: KU, value: VU])[],
	): Map<KU, VU> => {
		const ret = new Map<KU, VU>();
		for (const [key, value] of selv) {
			for (const [k, v] of callback(key, value, selv)) {
				ret.set(k, v);
			}
		}

		return ret;
	},
};

declare global {
	interface ReadonlyArray<T> {
		chunk(size: number): T[][];
	}
	interface ReadonlySet<T> {
		chunk(size: number): T[][];
	}
	interface ReadonlyMap<K, V> {
		chunk(size: number): [key: K, value: V][][];
	}
}
export const ArrayMacrosChunk: PropertyMacros<ReadonlyArray<defined>> = {
	chunk: <T extends defined>(selv: ReadonlyArray<T>, size: number): T[][] => {
		const ret: T[][] = [];
		for (const [index, value] of ipairs(selv)) {
			if (index % size === 0 && index !== 0) {
				ret.push([]);
			}

			ret[ret.size() - 1].push(value);
		}

		return ret;
	},
};
export const SetMacrosChunk: PropertyMacros<ReadonlySet<defined>> = {
	chunk: <T extends defined>(selv: ReadonlySet<T>, size: number): T[][] => {
		const ret: T[][] = [];
		let i = 0;
		for (const value of selv) {
			if (i % size === 0 && i !== 0) {
				ret.push([]);
			}

			ret[ret.size() - 1].push(value);
			i++;
		}

		return ret;
	},
};
export const MapMacrosChunk: PropertyMacros<ReadonlyMap<defined, defined>> = {
	chunk: <K extends defined, V extends defined>(selv: ReadonlyMap<K, V>, size: number): [key: K, value: V][][] => {
		const ret: [key: K, value: V][][] = [];
		let i = 0;
		for (const value of selv) {
			if (i % size === 0 && i !== 0) {
				ret.push([]);
			}

			ret[ret.size() - 1].push(value);
			i++;
		}

		return ret;
	},
};

declare global {
	interface ReadonlyArray<T> {
		keys(this: ReadonlyArray<defined>): number[];
		keysSet(this: ReadonlyArray<defined>): Set<number>;
	}
	interface ReadonlySet<T> {
		values(this: ReadonlySet<defined>): T[];
		valuesSet(this: ReadonlySet<defined>): Set<T>;
	}
	interface ReadonlyMap<K, V> {
		keys(this: ReadonlyMap<defined, defined>): K[];
		values(this: ReadonlyMap<defined, defined>): V[];
		keysSet(this: ReadonlyMap<defined, defined>): Set<K>;
		valuesSet(this: ReadonlyMap<defined, defined>): Set<V>;
	}
}
export const ArrayMacros7: PropertyMacros<ReadonlyArray<defined>> = {
	keys: <T extends defined>(selv: ReadonlyArray<T>): number[] => {
		const ret: number[] = [];
		for (const [index] of ipairs(selv)) {
			ret.push(index);
		}

		return ret;
	},
	keysSet: <T extends defined>(selv: ReadonlyArray<T>): Set<number> => {
		const ret = new Set<number>();
		for (const [index] of ipairs(selv)) {
			ret.add(index);
		}

		return ret;
	},
};
export const SetMacros7: PropertyMacros<ReadonlySet<defined>> = {
	values: <T extends defined>(selv: ReadonlySet<T>): T[] => {
		const ret: T[] = [];
		for (const value of selv) {
			ret.push(value);
		}

		return ret;
	},
	valuesSet: <T extends defined>(selv: ReadonlySet<T>): Set<T> => {
		const ret = new Set<T>();
		for (const value of selv) {
			ret.add(value);
		}

		return ret;
	},
};
export const MapMacros7: PropertyMacros<ReadonlyMap<defined, defined>> = {
	keys: <K extends defined, V extends defined>(selv: ReadonlyMap<K, V>): K[] => {
		const ret: K[] = [];
		for (const [key, value] of selv) {
			ret.push(key);
		}

		return ret;
	},
	keysSet: <K extends defined, V extends defined>(selv: ReadonlyMap<K, V>): Set<K> => {
		const ret = new Set<K>();
		for (const [key, value] of selv) {
			ret.add(key);
		}

		return ret;
	},
	values: <K extends defined, V extends defined>(selv: ReadonlyMap<K, V>): V[] => {
		const ret: V[] = [];
		for (const [key, value] of selv) {
			ret.push(value);
		}

		return ret;
	},
	valuesSet: <K extends defined, V extends defined>(selv: ReadonlyMap<K, V>): Set<V> => {
		const ret = new Set<V>();
		for (const [key, value] of selv) {
			ret.add(value);
		}

		return ret;
	},
};

declare global {
	interface ReadonlyArray<T> {
		find<U extends T>(
			this: ReadonlyArray<T>,
			func: (value: T, index: number, arr: ReadonlyArray<T>) => value is U,
		): U | undefined;
		find(
			this: ReadonlyArray<T>,
			func: (value: T, index: number, arr: ReadonlyArray<T>) => boolean | undefined,
		): T | undefined;
	}
	interface ReadonlySet<T> {
		find<U extends T>(this: ReadonlySet<T>, func: (value: T, set: ReadonlySet<T>) => value is U): U | undefined;
		find(this: ReadonlySet<T>, func: (value: T, set: ReadonlySet<T>) => boolean | undefined): T | undefined;
	}
	interface ReadonlyMap<K, V> {
		find(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V, map: ReadonlyMap<K, V>) => boolean | undefined,
		): LuaTuple<[K, V]> | LuaTuple<[undefined, undefined]>;

		findKey<U extends K>(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V, map: ReadonlyMap<K, V>) => key is U,
		): U | undefined;
		findKey(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V, map: ReadonlyMap<K, V>) => boolean | undefined,
		): K | undefined;

		findValue<U extends V>(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V, map: ReadonlyMap<K, V>) => value is U,
		): U | undefined;
		findValue(
			this: ReadonlyMap<K, V>,
			func: (key: K, value: V, map: ReadonlyMap<K, V>) => boolean | undefined,
		): V | undefined;
	}
}
export const ArrayMacrosFind: PropertyMacros<ReadonlyArray<defined>> = {
	find: <T extends defined>(
		selv: ReadonlyArray<T>,
		func: (value: T, index: number, arr: ReadonlyArray<T>) => boolean | undefined,
	): T | undefined => {
		for (const [index, value] of ipairs(selv)) {
			if (func(value, index, selv)) {
				return value;
			}
		}
	},
};
export const SetMacrosFind: PropertyMacros<ReadonlySet<defined>> = {
	find: <T extends defined>(
		selv: ReadonlySet<T>,
		func: (value: T, arr: ReadonlySet<T>) => boolean | undefined,
	): T | undefined => {
		for (const value of selv) {
			if (func(value, selv)) {
				return value;
			}
		}
	},
};
export const MapMacrosFind: PropertyMacros<ReadonlyMap<defined, defined>> = {
	find: <K extends defined, V extends defined>(
		selv: ReadonlyMap<K, V>,
		func: (key: K, value: V, arr: ReadonlyMap<K, V>) => boolean | undefined,
	): LuaTuple<[K, V]> | LuaTuple<[undefined, undefined]> => {
		for (const [key, value] of selv) {
			if (func(key, value, selv)) {
				return $tuple(key, value);
			}
		}

		return $tuple(undefined, undefined);
	},
	findKey: <K extends defined, V extends defined>(
		selv: ReadonlyMap<K, V>,
		func: (key: K, value: V, arr: ReadonlyMap<K, V>) => boolean | undefined,
	): K | undefined => {
		for (const [key, value] of selv) {
			if (func(key, value, selv)) {
				return key;
			}
		}
	},
	findValue: <K extends defined, V extends defined>(
		selv: ReadonlyMap<K, V>,
		func: (key: K, value: V, arr: ReadonlyMap<K, V>) => boolean | undefined,
	): V | undefined => {
		for (const [key, value] of selv) {
			if (func(key, value, selv)) {
				return value;
			}
		}
	},
};

declare global {
	interface ReadonlyArray<T> {
		asReadonly(): ReadonlyArray<T>;
		clone(): T[];
	}
	interface ReadonlySet<T> {
		asReadonly(): ReadonlySet<T>;
		clone(): Set<T>;
	}
	interface ReadonlyMap<K, V> {
		asReadonly(): ReadonlyMap<K, V>;
		clone(): Map<K, V>;
	}
}
export const ArrayMacros9: PropertyMacros<ReadonlyArray<defined>> = {
	asReadonly: (selv) => selv,
	clone: (selv) => [...selv],
};
export const SetMacros9: PropertyMacros<ReadonlySet<defined>> = {
	asReadonly: (selv) => selv,
	clone: (selv) => asSet({ ...asObject(selv as never) }),
};
export const MapMacros9: PropertyMacros<ReadonlyMap<defined, defined>> = {
	asReadonly: (selv) => selv,
	clone: (selv) => asMap({ ...asObject(selv as never) }),
};

declare global {
	interface ReadonlyArray<T> {
		groupBy<U extends defined>(
			this: ReadonlyArray<T>,
			keyfunc: (value: T, index: number, arr: ReadonlyArray<T>) => U,
		): Map<U, T[]>;
	}
	interface ReadonlySet<T> {
		groupBy<U extends defined>(this: ReadonlySet<T>, keyfunc: (value: T, ste: ReadonlySet<T>) => U): Map<U, T[]>;
	}
	interface ReadonlyMap<K, V> {
		groupBy<KU extends defined>(
			this: ReadonlyMap<K, V>,
			keyfunc: (key: K, value: V, map: ReadonlyMap<K, V>) => KU,
		): Map<KU, V[]>;
		groupBy<KU extends defined, VU extends defined>(
			this: ReadonlyMap<K, V>,
			keyfunc: (key: K, value: V, map: ReadonlyMap<K, V>) => KU,
			valuefunc: (key: K, value: V, map: ReadonlyMap<K, V>) => VU,
		): Map<KU, VU[]>;
	}
}
export const ArrayMacrosGroupBy: PropertyMacros<ReadonlyArray<defined>> = {
	groupBy: <T extends defined, U extends defined>(
		selv: ReadonlyArray<T>,
		keyfunc: (value: T, index: number, arr: ReadonlyArray<T>) => U,
	): Map<U, T[]> => {
		const ret = new Map<U, T[]>();
		for (const [index, value] of ipairs(selv)) {
			const key = keyfunc(value, index, selv);
			let arr = ret.get(key);
			if (!arr) ret.set(key, (arr = []));

			arr.push(value);
		}

		return ret;
	},
};
export const SetMacrosGroupBy: PropertyMacros<ReadonlySet<defined>> = {
	groupBy: <T extends defined, U extends defined>(
		selv: ReadonlySet<T>,
		keyfunc: (value: T, set: ReadonlySet<T>) => U,
	): Map<U, T[]> => {
		const ret = new Map<U, T[]>();
		for (const value of selv) {
			const key = keyfunc(value, selv);
			let arr = ret.get(key);
			if (!arr) ret.set(key, (arr = []));

			arr.push(value);
		}

		return ret;
	},
};
export const MapMacrosGroupBy: PropertyMacros<ReadonlyMap<defined, defined>> = {
	groupBy: <K extends defined, V extends defined, KU extends defined, VU extends defined>(
		selv: ReadonlyMap<K, V>,
		keyfunc: (key: K, value: V, map: ReadonlyMap<K, V>) => KU,
		valuefunc?: (key: K, value: V, map: ReadonlyMap<K, V>) => VU,
	): Map<KU, defined[]> => {
		const ret = new Map<KU, defined[]>();
		for (const [key, value] of selv) {
			const k = keyfunc(key, value, selv);
			let arr = ret.get(k);
			if (!arr) ret.set(k, (arr = []));

			const v = valuefunc ? valuefunc(key, value, selv) : value;
			arr.push(v);
		}

		return ret;
	},
};

declare global {
	interface ReadonlyArray<T> {
		except(this: ReadonlyArray<defined>, items: readonly T[]): T[];
		exceptSet(this: ReadonlyArray<defined>, items: ReadonlySet<T>): T[];
	}
	interface ReadonlySet<T> {
		except(this: ReadonlySet<defined>, items: readonly T[]): Set<T>;
		exceptSet(this: ReadonlySet<defined>, items: ReadonlySet<T>): Set<T>;
	}
	interface ReadonlyMap<K, V> {
		exceptKeys(this: ReadonlyMap<defined, defined>, items: readonly K[]): Map<K, V>;
		exceptValues(this: ReadonlyMap<defined, defined>, items: readonly V[]): Map<K, V>;
		exceptKeysSet(this: ReadonlyMap<defined, defined>, items: ReadonlySet<K>): Map<K, V>;
		exceptValuesSet(this: ReadonlyMap<defined, defined>, items: ReadonlySet<V>): Map<K, V>;
	}
}
export const ArrayMacrosExcept: PropertyMacros<ReadonlyArray<defined>> = {
	except: <T extends defined>(selv: ReadonlyArray<T>, items: readonly T[]): T[] => {
		const ret: T[] = [];
		for (const value of selv) {
			if (items.includes(value)) continue;
			ret.push(value);
		}

		return ret;
	},
	exceptSet: <T extends defined>(selv: ReadonlyArray<T>, items: ReadonlySet<T>): T[] => {
		const ret: T[] = [];
		for (const value of selv) {
			if (items.has(value)) continue;
			ret.push(value);
		}

		return ret;
	},
};
export const SetMacrosExcept: PropertyMacros<ReadonlySet<defined>> = {
	except: <T extends defined>(selv: ReadonlySet<T>, items: readonly T[]): Set<T> => {
		const ret = new Set<T>();
		for (const value of selv) {
			if (items.includes(value)) continue;
			ret.add(value);
		}

		return ret;
	},
	exceptSet: <T extends defined>(selv: ReadonlySet<T>, items: ReadonlySet<T>): Set<T> => {
		const ret = new Set<T>();
		for (const value of selv) {
			if (items.has(value)) continue;
			ret.add(value);
		}

		return ret;
	},
};
export const MapMacrosExcept: PropertyMacros<ReadonlyMap<defined, defined>> = {
	exceptKeys: <K extends defined, V extends defined>(selv: ReadonlyMap<K, V>, items: readonly K[]): Map<K, V> => {
		const ret = new Map<K, V>();
		for (const [key, value] of selv) {
			if (items.includes(key)) continue;
			ret.set(key, value);
		}

		return ret;
	},
	exceptKeysSet: <K extends defined, V extends defined>(
		selv: ReadonlyMap<K, V>,
		items: ReadonlySet<K>,
	): Map<K, V> => {
		const ret = new Map<K, V>();
		for (const [key, value] of selv) {
			if (items.has(key)) continue;
			ret.set(key, value);
		}

		return ret;
	},
	exceptValues: <K extends defined, V extends defined>(selv: ReadonlyMap<K, V>, items: readonly V[]): Map<K, V> => {
		const ret = new Map<K, V>();
		for (const [key, value] of selv) {
			if (items.includes(value)) continue;
			ret.set(key, value);
		}

		return ret;
	},
	exceptValuesSet: <K extends defined, V extends defined>(
		selv: ReadonlyMap<K, V>,
		items: ReadonlySet<V>,
	): Map<K, V> => {
		const ret = new Map<K, V>();
		for (const [key, value] of selv) {
			if (items.has(value)) continue;
			ret.set(key, value);
		}

		return ret;
	},
};

declare global {
	interface ReadonlyArray<T> {
		toSet(this: ReadonlyArray<defined>): Set<T>;
		toMap<K extends defined>(this: ReadonlyArray<defined>, func: (value: T) => K): Map<K, T>;
	}
	interface ReadonlySet<T> {
		toArray(this: ReadonlySet<defined>): T[];
		toMap<K extends defined>(this: ReadonlySet<defined>, func: (value: T) => K): Map<K, T>;
	}
	interface ReadonlyMap<K, V> {
		toArray(this: ReadonlyMap<defined, defined>): [key: K, value: V][];
		toSet(this: ReadonlyMap<defined, defined>): Set<[key: K, value: V]>;
	}
}
export const ArrayMacrosConvert: PropertyMacros<ReadonlyArray<defined>> = {
	toSet: <T extends defined>(selv: ReadonlyArray<T>): Set<T> => new Set(selv),
	toMap: <T extends defined, K extends defined>(selv: ReadonlyArray<T>, func: (value: T) => K): Map<K, T> =>
		selv.mapToMap((v) => $tuple(func(v), v)),
};
export const SetMacrosConvert: PropertyMacros<ReadonlySet<defined>> = {
	toArray: <T extends defined>(selv: ReadonlySet<T>): T[] => [...selv],
	toMap: <T extends defined, K extends defined>(selv: ReadonlySet<T>, func: (value: T) => K): Map<K, T> =>
		selv.mapToMap((v) => $tuple(func(v), v)),
};
export const MapMacrosConvert: PropertyMacros<ReadonlyMap<defined, defined>> = {
	toArray: <K extends defined, V extends defined>(selv: ReadonlyMap<K, V>): [K, V][] => [...selv],
	toSet: <K extends defined, V extends defined>(selv: ReadonlyMap<K, V>): Set<[K, V]> => new Set([...selv]),
};

declare global {
	interface ReadonlyArray<T> {
		sequenceEquals(this: ReadonlyArray<defined>, other: readonly T[]): boolean;
	}
	interface ReadonlySet<T> {
		sequenceEquals(this: ReadonlySet<defined>, other: ReadonlySet<T>): boolean;
	}
	interface ReadonlyMap<K, V> {
		sequenceEquals(this: ReadonlyMap<defined, defined>, other: ReadonlyMap<K, V>): boolean;
	}
}
export const ArrayMacrosSequenceEquals: PropertyMacros<ReadonlyArray<defined>> = {
	sequenceEquals: <T extends defined>(selv: ReadonlyArray<T>, other: readonly T[]): boolean => {
		if (selv.size() !== other.size()) {
			return false;
		}

		for (let i = 0; i < selv.size(); i++) {
			if (selv[i] !== other[i]) {
				return false;
			}
		}

		return true;
	},
};
export const SetMacrosSequenceEquals: PropertyMacros<ReadonlySet<defined>> = {
	sequenceEquals: <T extends defined>(selv: ReadonlySet<T>, other: ReadonlySet<T>): boolean => {
		for (const value of selv) {
			if (!other.has(value)) {
				return false;
			}
		}

		return true;
	},
};
export const MapMacrosSequenceEquals: PropertyMacros<ReadonlyMap<defined, defined>> = {
	sequenceEquals: <K extends defined, V extends defined>(
		selv: ReadonlyMap<K, V>,
		other: ReadonlyMap<K, V>,
	): boolean => {
		for (const [key, value] of selv) {
			if (other.get(key) !== value) {
				return false;
			}
		}

		return true;
	},
};

declare global {
	interface Map<K, V> {
		getOrSet(this: Map<defined, defined>, key: K, create: () => V): V;
	}
}
export const WritableMapMacros: PropertyMacros<Map<defined, defined>> = {
	getOrSet: <K extends defined, V extends defined>(selv: Map<K, V>, key: K, create: () => V): V => {
		const value = selv.get(key);
		if (value !== undefined) return value;

		const newvalue = create();
		selv.set(key, newvalue);

		return newvalue;
	},
};

declare global {
	interface ReadonlyArray<T> {
		min(this: ReadonlyArray<number>): number | undefined;
		max(this: ReadonlyArray<number>): number | undefined;
	}
}
export const NumberArrayMacros: PropertyMacros<ReadonlyArray<number>> = {
	min: (array: readonly number[]): number | undefined => {
		let min: number | undefined = undefined;
		for (const item of array) {
			if (!min || min > item) {
				min = item;
			}
		}

		return min;
	},
	max: (array: readonly number[]): number | undefined => {
		let min: number | undefined = undefined;
		for (const item of array) {
			if (!min || min < item) {
				min = item;
			}
		}

		return min;
	},
};
