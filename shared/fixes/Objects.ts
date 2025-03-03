export namespace Objects {
	export const empty: readonly [] = [];

	export function firstKey<T>(object: readonly T[]): number | undefined;
	export function firstKey<T>(object: ReadonlyMap<T, defined>): T | undefined;
	export function firstKey<T>(object: ReadonlySet<T>): T | undefined;
	export function firstKey<T extends object>(object: T): keyof T | undefined;
	export function firstKey<T extends object>(object: T): keyof T | undefined {
		return next(object)[0];
	}

	export function firstValue<T extends readonly T[]>(object: T): T | undefined;
	export function firstValue<T extends ReadonlyMap<defined, T>>(object: T): T | undefined;
	export function firstValue<T extends ReadonlySet<T>>(object: T): boolean | undefined;
	export function firstValue<T extends object>(object: T): T[keyof T] | undefined;
	export function firstValue<T extends object>(object: T): T[keyof T] | undefined {
		return next(object)[1];
	}

	export function keys<T extends object>(object: T): (keyof T)[] {
		return asMap(object).keys();
	}

	export function values<T extends object>(object: T): (T[keyof T] & defined)[] {
		return asMap(object).values();
	}

	export function size(object: object): number {
		return asMap(object).size();
	}

	/** Shorthand for `asObject(asMap(obj).mapToMap((k, v) => $tuple(k, func(v))))` */
	export function mapValues<const TObj extends object, const V extends defined>(
		obj: TObj,
		func: (key: keyof TObj, value: TObj[keyof TObj] & defined) => V | undefined,
	): object & { [k in keyof TObj]: V } {
		return asObject(asMap(obj).mapToMap((k, v) => $tuple(k, func(k, v))));
	}

	export function map<
		const TObj extends readonly unknown[],
		const K extends string | number | symbol,
		const V extends defined,
	>(
		obj: TObj,
		keyfunc: (key: keyof TObj, value: TObj extends readonly (infer E)[] ? E : never) => K,
		valuefunc: (key: keyof TObj, value: TObj extends readonly (infer E)[] ? E : never) => V | undefined,
	): object & { [k in K]: V };
	export function map<const TObj extends object, const K extends string | number | symbol, const V extends defined>(
		obj: TObj,
		keyfunc: (key: keyof TObj, value: TObj[keyof TObj] & defined) => K,
		valuefunc: (key: keyof TObj, value: TObj[keyof TObj] & defined) => V | undefined,
	): object & { [k in K]: V };
	/** Shorthand for `asObject(asMap(obj).mapToMap((k, v) => $tuple(kfunc(k), vfunc(v))))` with the key and value functions divided to simplify writing the type */
	export function map<const TObj extends object, const K extends string | number | symbol, const V extends defined>(
		obj: TObj,
		keyfunc: (key: keyof TObj, value: TObj[keyof TObj] & defined) => K,
		valuefunc: (key: keyof TObj, value: TObj[keyof TObj] & defined) => V | undefined,
	): object & { [k in K]: V } {
		return asObject(asMap(obj).mapToMap((k, v) => $tuple(keyfunc(k, v), valuefunc(k, v))));
	}

	export function entriesArray<T extends object>(object: T): (readonly [keyof T, T[keyof T] & defined])[] {
		const result: [keyof T, T[keyof T] & defined][] = [];
		for (const [key, value] of asMap(object)) {
			result.push([key, value]);
		}

		return result;
	}

	export function assign<T extends object, TProps extends object>(
		toObj: T,
		properties: TProps & Partial<T>,
	): T & TProps {
		for (const [key, value] of asMap(properties)) {
			(toObj as Record<keyof T | keyof TProps, unknown>)[key] = value;
		}

		return toObj as T & TProps;
	}

	export function fromEntries<T extends readonly (readonly [key: string | number, value: defined])[]>(
		entries: T,
	): { [k in T[number][0]]: Extract<T[number], readonly [k, unknown]>[1] } {
		return asObject(new Map(entries) as Map<T[number][0], T[number][1]>) as { [key in T[number][0]]: T[number][1] };
	}

	export function writable<T extends object>(object: T): Writable<T> {
		return object;
	}
	export function awaitThrow<T>(promise: Promise<T>): T {
		const [success, ret] = promise.await();
		if (!success) throw ret;

		return ret;
	}
	/** Wrap all the provided functions in promises, immediately run them all and wait for completion */
	export function multiAwait(funcs: (() => void)[]): void {
		awaitThrow(Promise.all(funcs.map(Promise.try)));
	}

	export function deepEquals(left: unknown, right: unknown): boolean {
		if (typeOf(left) !== typeOf(right)) {
			return false;
		}

		if (typeIs(left, "Instance") && typeIs(right, "Instance")) {
			return left === right;
		}

		if (typeIs(left, "table")) {
			assert(typeIs(right, "table"));
			return objectDeepEquals(left, right);
		}

		return left === right;
	}
	function objectDeepEquals(left: object, right: object): boolean {
		for (const [kl] of pairs(left)) {
			if (!(kl in right)) {
				return false;
			}

			if (!deepEquals(left[kl], right[kl])) {
				return false;
			}
		}
		for (const [kr] of pairs(right)) {
			if (!(kr in left)) {
				return false;
			}
		}

		return true;
	}

	/** Object deep equals check, but checks only propeties that exists on `properties` */
	export function objectDeepEqualsExisting(object: object, properties: object): boolean {
		for (const [k] of pairs(properties)) {
			if (!(k in object)) {
				return false;
			}

			if (!deepEquals(object[k], properties[k])) {
				return false;
			}
		}

		return true;
	}

	export function deepCombine<T extends object>(o1: T, o2: PartialThrough<T>): T;
	export function deepCombine<T extends object>(...objects: readonly T[]): T;
	export function deepCombine<T extends object>(...objects: readonly T[]): T {
		const result = {} as T;
		for (const obj of objects) {
			for (const [key, value] of pairs(obj)) {
				if (typeIs(value, "table") && typeIs(result[key as keyof T], "table")) {
					result[key as keyof T] = deepCombine(result[key as keyof T] as object, value) as T[keyof T];
				} else {
					result[key as keyof T] = value;
				}
			}
		}

		return result;
	}

	// Returns full paths of the object T
	export type PathsOf<T> = T extends object
		? { [K in keyof T]: T[K] extends object ? [K, ...PathsOf<T[K]>] : [K] }[keyof T] & readonly string[]
		: readonly [];

	// Returns a value of the object T at the path TPath
	export type ValueOf<T, TPath extends readonly (string | number)[]> = TPath extends readonly []
		? T
		: TPath extends readonly [infer First extends keyof T, ...infer Rest extends readonly (string | number)[]]
			? ValueOf<T[First], Rest>
			: never;

	export function getValueByPathTyped<const TObj extends object, const TPath extends readonly string[]>(
		obj: TObj,
		path: TPath,
	): ValueOf<TObj, TPath>;
	export function getValueByPathTyped(obj: object, path: readonly string[]): unknown {
		return getValueByPath(obj, path);
	}

	export function getValueByPath(obj: object, path: readonly (string | number)[]): unknown {
		let v: unknown = obj;
		for (const p of path) {
			v = (v as { [k in string | number]: unknown })[p];
		}

		return v;
	}
	export function createObjectWithValueByPath<V>(value: V, path: readonly (string | number)[]): object {
		const obj: { [k in string | number]: unknown } = {};
		let part = obj;
		for (const [i, p] of ipairs(path)) {
			if (i === path.size()) {
				part[p] = value;
			} else {
				part = part[p] = {};
			}
		}

		return obj;
	}

	/** Executes the function and throws if it ever yields */
	export function requireNoYield<TArgs extends unknown[], TRet>(
		func: (...args: TArgs) => TRet,
		...args: TArgs
	): TRet {
		const co = coroutine.create(func);

		const [ok, result] = coroutine.resume(co, ...args);
		if (!ok) {
			const message = result;
			error(debug.traceback(co, tostring(message)), 2);
		}

		if (coroutine.status(co) !== "dead") {
			error(debug.traceback(co, "Attempted to yield inside the no-yield zone!"), 1);
		}

		return result as TRet;
	}
	/** Returns a function that wraps {@link func} with {@link requireNoYield} */
	export function wrapRequireNoYield<TFunc extends (...args: TArgs) => TRet, TArgs extends unknown[], TRet>(
		func: TFunc,
	): (...args: TArgs) => TRet {
		return (...args) => requireNoYield(func, ...args);
	}
}
