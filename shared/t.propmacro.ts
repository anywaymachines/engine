import { t } from "engine/shared/t";
import type { t_propmacro, T } from "engine/shared/t";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [TMacros];

//

declare module "engine/shared/t" {
	/** @deprecated Internal use only */
	interface t_propmacro {
		numberWithBounds(min?: number, max?: number, step?: number): T.Type<number>;
	}
}
export const TMacros: PropertyMacros<t_propmacro> = {
	numberWithBounds: (_, min, max, step): T.Type<number> => {
		return {
			func: (value, result): value is number => {
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
		};
	},
};
