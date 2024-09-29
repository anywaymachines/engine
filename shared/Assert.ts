export namespace Assert {
	function addMessage(text: string, message: string | undefined) {
		if (message) {
			return `${text}: ${message}`;
		}

		return text;
	}

	export function is<T, K extends keyof CheckableTypes>(
		value: T,
		valueType: K,
		message?: string,
	): asserts value is T & CheckableTypes[K] {
		if (!typeIs(value, valueType)) {
			throw addMessage(`Value is ${typeOf(value)}`, message);
		}
	}
	export function isNot<T, K extends keyof CheckableTypes>(
		value: T,
		valueType: K,
		message?: string,
	): asserts value is Exclude<T, CheckableTypes[K]> {
		if (typeIs(value, valueType)) {
			throw addMessage(`Value is ${typeOf(value)}`, message);
		}
	}

	export function notNull<T>(value: T, message?: string): asserts value is T & defined {
		if (value === undefined) throw addMessage(`Value is undefined`, message);
	}
	export function isNull<T>(value: T, message?: string): asserts value is T & undefined {
		if (value !== undefined) throw addMessage(`Value is not undefined: ${value}`, message);
	}
	export function isTrue(condition: boolean, message?: string): asserts condition is true {
		if (!condition) throw addMessage(`Condition is not true`, message);
	}
	export function isFalse(condition: boolean, message?: string): asserts condition is false {
		if (condition) throw addMessage(`Condition is not false`, message);
	}

	export function almostEquals(
		left: number | { get(): number },
		right: number | { get(): number },
		message?: string,
	) {
		left = typeIs(left, "table") && "get" in left ? left.get() : left;
		right = typeIs(right, "table") && "get" in right ? right.get() : right;

		if (math.abs(left - right) > 0.0001) {
			throw addMessage(`${left} and ${right} are not (almost) equal`, message);
		}
	}

	export function equals<T>(left: T | { get(): T }, right: T | { get(): T }, message?: string) {
		left = typeIs(left, "table") && "get" in left ? left.get() : left;
		right = typeIs(right, "table") && "get" in right ? right.get() : right;

		if (left !== right) {
			throw addMessage(`${left} and ${right} are not equal`, message);
		}
	}
	export function sequenceEquals<T>(left: readonly T[], right: readonly T[], message?: string) {
		if (left.size() !== right.size())
			throw addMessage(`Array sizes are not equal: ${left.size()} vs ${right.size()}`, message);

		for (let i = 0; i < left.size(); i++) {
			if (left[i] !== right[i]) {
				throw addMessage(`Elements at index ${i} are not equal: ${left[i]} vs ${right[i]}`, message);
			}
		}
	}
	export function setEquals<T>(left: ReadonlySet<T>, right: ReadonlySet<T>, message?: string) {
		if (left.size() !== right.size())
			throw addMessage(`Array sizes are not equal: ${left.size()} vs ${right.size()}`, message);

		const leftcopy = new Set([...left]);

		for (const item of right) {
			if (!leftcopy.delete(item)) {
				throw addMessage(`Left set does not containt an item from the right set: ${item}`, message);
			}
		}
	}

	/** Asserts that all the properties of {@link properties} are the same as in the {@link object} */
	export function propertiesEqual<T extends object, P extends object>(
		object: T,
		properties: P,
		message?: string,
	): asserts object is T & P {
		for (const [k, v] of pairs(properties)) {
			if (!(k in object)) {
				throw addMessage(`Key ${tostring(k)} was not found in object ${object}`, message);
			}

			Assert.equals(object[k as never], v, message);
		}
	}

	export namespace Testing {
		export function test(description: string, test: () => void) {
			print(`  Running [${description}]`);
			test();
		}

		export function expect<T>(value: T): Expect<T> {
			return new Expect(value);
		}

		export class Expect<T> {
			constructor(private readonly value: T) {}

			toBe<T extends boolean | number | string>(this: Expect<T>, value: T) {
				Assert.equals(this.value, value);
				return this;
			}

			toEqual<T extends readonly unknown[]>(this: Expect<T>, value: T) {
				Assert.sequenceEquals(this.value, value);
				return this;
			}
		}
	}
}
