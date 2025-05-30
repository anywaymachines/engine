import { t } from "engine/shared/t";
import type { t_propmacro, t_type_propmacro } from "engine/shared/t";

type t = typeof t;

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [TMacros, TTypeMacros];

//

declare module "engine/shared/t" {
	/** @deprecated Internal use only */
	interface t_propmacro {
		numberWithBounds(min: number, max: number): t.Type<number, { min: number; max: number }>;
		numberWithBounds(
			min?: number,
			max?: number,
			step?: number,
		): t.Type<number, { min?: number; max?: number; step?: number }>;
	}
}
export const TMacros: PropertyMacros<t_propmacro, t> = {
	numberWithBounds: (t, min, max, step): t.Type<number, { min?: number; max?: number; step?: number }> =>
		t.custom(
			(value, result): value is number => {
				if (!t.typeCheck(value, t.number, result)) return false;

				if (min && value < min) {
					result?.setText(`Value ${value} is out of bounds of [${min}; ${max}]`);
					return false;
				}
				if (max && value > max) {
					result?.setText(`Value ${value} is out of bounds of [${min}; ${max}]`);
					return false;
				}
				if (step && value % step !== 0) {
					result?.setText(`Value ${value} is not rounded to ${step}`);
					return false;
				}

				return true;
			},
			{ min, max, step },
		),
};

declare module "engine/shared/t" {
	/** @deprecated Internal use only */
	interface t_type_propmacro<T> {
		orUndefined(): t.Type<T | undefined>;

		/** Adds a `{ ___nominal: TName }` property into the type. */
		nominal<const TName extends string>(name: TName): t.Type<T & { ___nominal: TName }>;

		/** Casts the type into another, if possible. */
		as<U extends T>(): t.Type<U>;
	}
}
export const TTypeMacros: PropertyMacros<t_type_propmacro<unknown>, t.Type<unknown>> = {
	orUndefined: <T>(selv: t.Type<T>): t.Type<T | undefined> => t.union(selv, t.undefined),
	nominal: (selv) => selv as never,
	as: (selv) => selv as never,
};
