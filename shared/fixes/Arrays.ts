export namespace Arrays {
	export function intersect<T extends defined>(arrays: readonly (readonly T[])[]): T[] {
		if (arrays.isEmpty()) return [];

		return arrays.reduce((acc, arr) => acc.filter((item) => arr.includes(item)), [...arrays[0]]);
	}
}

export namespace Sets {
	export function intersect<T extends defined>(sets: readonly ReadonlySet<T>[]): T[] {
		if (sets.isEmpty()) return [];

		return sets.reduce((acc, arr) => acc.filter((item) => arr.has(item)), [...sets[0]]);
	}
}
