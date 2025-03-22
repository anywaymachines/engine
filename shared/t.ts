import { Strings } from "engine/shared/fixes/String.propmacro";

type TupleToIntersection<T extends readonly unknown[]> = { [K in keyof T]: (x: T[K]) => void } extends {
	[K: number]: (x: infer I) => void;
}
	? I
	: never;

namespace RealT {
	class TypeCheckResult {
		private text?: string;
		private children?: TypeCheckResult[];

		getText(): string | undefined {
			return this.text;
		}
		setText(text: string): void {
			this.text = text;
		}

		next(): TypeCheckResult {
			const result = new TypeCheckResult();
			this.children ??= [];
			this.children.push(result);

			return result;
		}

		toString(layer: number = 0): string {
			return [this.text ?? "", ...(this.children ?? []).map((c) => c.toString(layer + 1))]
				.filter((c) => c.size() !== 0)
				.map((c) => `${string.rep(" ", layer)}${c}`)
				.join("\n");
		}
	}

	const pretty = Strings.pretty;

	export type Infer<T extends Type<unknown>> = T extends Type<infer V> ? V : never;
	type UnwrapObject<T extends { readonly [k in string]: Type<unknown> }> = Reconstruct<{
		readonly [k in keyof T]: Infer<T[k]>;
	}>;
	type UnwrapArrayUnion<T extends readonly Type<unknown>[]> = { readonly [k in keyof T]: Infer<T[k]> }[number];
	type UnwrapArrayIntersection<T extends readonly Type<unknown>[]> = TupleToIntersection<{
		readonly [k in keyof T]: Infer<T[k]>;
	}>;

	const toType = <T>(t: Type<T>["func"]): Type<T> => ({ func: t }) as never;
	export interface Type<T> extends t_type_propmacro<T> {
		readonly func: (value: unknown, result?: TypeCheckResult) => value is T;
	}

	function ofType<K extends keyof CheckableTypes>(name: K): Type<CheckableTypes[K]> {
		return toType((value, result): value is CheckableTypes[K] => {
			if (typeIs(value, name)) {
				return true;
			}

			result?.setText(`Value ${pretty(value)} is not of type ${name}`);
			return false;
		});
	}

	function _checkProperties(
		value: object,
		properties: { readonly [k in string]: Type<unknown> },
		result: TypeCheckResult | undefined,
	): boolean {
		const childr = result?.next();
		for (const [k, prop] of pairs(properties)) {
			if (!t.typeCheck(value[k as keyof object], prop, childr)) {
				result?.setText(`Property ${tostring(k)} of ${pretty(value)} has failed the check`);
				return false;
			}
		}

		return true;
	}

	//

	export const t = {
		typeCheck<T>(value: unknown, vtype: Type<T>, result?: TypeCheckResult): value is T {
			return vtype.func(value, result);
		},
		typeCheckWithThrow<T>(value: unknown, vtype: Type<T>): asserts value is T {
			const result = new TypeCheckResult();
			if (!t.typeCheck(value, vtype, result)) {
				throw result.toString();
			}
		},

		custom: toType,
		type: ofType,
		any: toType((v): v is unknown => true),
		anyInstance: ofType("Instance"),
		undefined: ofType("nil"),
		number: ofType("number"),
		boolean: ofType("boolean"),
		string: ofType("string"),
		object: ofType("table"),

		const: <const T>(val: T) => toType((value, result): value is T => value === val),

		true: toType((v: unknown, result?: TypeCheckResult): v is true => {
			if (!(v === true)) {
				result?.setText(`${v} is not true`);
				return false;
			}

			return true;
		}),
		false: toType((v: unknown, result?: TypeCheckResult): v is false => {
			if (!(v === false)) {
				result?.setText(`${v} is not false`);
				return false;
			}

			return true;
		}),

		vector2: ofType("Vector2"),
		vector3: ofType("Vector3"),
		color: ofType("Color3"),

		instance: <const T extends keyof Instances>(name: T): Type<Instances[T]> =>
			toType((value, result): value is Instances[T] => {
				if (!t.typeCheck(value, t.anyInstance, result)) {
					return false;
				}

				if (!value.IsA(name)) {
					result?.setText(`${value.ClassName} ${value.Name} is not of type ${name}`);
					return false;
				}

				return true;
			}),
		interface: <const T extends { readonly [k in string]: Type<unknown> }>(properties: T): Type<UnwrapObject<T>> =>
			toType((value, result): value is UnwrapObject<T> => {
				if (!t.typeCheck(value, t.object, result)) {
					return false;
				}

				return _checkProperties(value, properties, result);
			}),
		strictInterface: <const T extends { readonly [k in string]: Type<unknown> }>(
			properties: T,
		): Type<UnwrapObject<T>> =>
			toType((value, result): value is UnwrapObject<T> => {
				if (!t.typeCheck(value, t.object, result)) {
					return false;
				}

				for (const [k] of pairs(value)) {
					if (!(k in properties)) {
						result?.setText(`Property ${tostring(k)} of ${pretty(value)} should not exist`);
						return false;
					}
				}

				return _checkProperties(value, properties, result);
			}),

		intersection: <const T extends readonly Type<unknown>[]>(...items: T): Type<UnwrapArrayIntersection<T>> =>
			toType((value, result): value is UnwrapArrayIntersection<T> => {
				const childr = result?.next();

				for (const item of items) {
					if (!t.typeCheck(value, item, childr)) {
						result?.setText(`Value ${pretty(value)} has failed one of the intersection checks`);
						return false;
					}
				}

				return true;
			}),
		union: <const T extends readonly Type<unknown>[]>(...items: T): Type<UnwrapArrayUnion<T>> =>
			toType((value, result): value is UnwrapArrayUnion<T> => {
				for (const item of items) {
					if (t.typeCheck(value, item, result?.next())) {
						return true;
					}
				}

				result?.setText(`Value ${pretty(value)} has failed all of the union checks`);
				return false;
			}),
	} as const;
}

export namespace t {
	export type Infer<T extends Type<unknown>> = RealT.Infer<T>;
	export interface Type<T> extends RealT.Type<T> {}
}
export const t: typeof RealT.t & t_propmacro = RealT.t as never;
