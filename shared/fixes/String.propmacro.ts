import { Objects } from "engine/shared/fixes/Objects";
import { utf8_lc_uc, utf8_uc_lc } from "engine/shared/fixes/utf8data";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [StringMacros];

declare global {
	interface String {
		contains(this: string, search: string): boolean;
		startsWith(this: string, search: string): boolean;

		trim(this: string): string;
		fullLower(this: string): string;
		fullUpper(this: string): string;
	}
}
export const StringMacros: PropertyMacros<String> = {
	contains: (str: String, search: string): boolean => {
		return (str as string).find(search)[0] !== undefined;
	},
	startsWith: (str: String, search: string): boolean => {
		return (str as string).sub(1, search.size()) === search;
	},

	trim: (str: String): string => {
		return (str as string).gsub("^%s*(.-)%s*$", "%1")[0];
	},
	fullLower: (str: String): string => {
		let ret = "";
		for (const c of str as string) {
			ret += utf8_uc_lc[c as never] ?? c;
		}

		return ret;
	},
	fullUpper: (str: String): string => {
		let ret = "";
		for (const c of str as string) {
			ret += utf8_lc_uc[c as never] ?? c;
		}

		return ret;
	},
};

export namespace Strings {
	export function pretty(value: unknown): string {
		if (typeIs(value, "string")) return value;

		if (typeIs(value, "table")) {
			if (1 in value) {
				return `[ ${Objects.values(value).map(pretty).join()} ]`;
			}

			return `{ ${Objects.entriesArray(value)
				.map((e) => `${e[0]}: ${pretty(e[1])}`)
				.join()} }`;
		}

		return tostring(value);
	}

	export function prettyNumber(value: number, step: number | undefined) {
		if (value !== value) return "NaN";

		const maxdigits = math.min(4, step ? math.max(0, math.ceil(-math.log(step, 10))) : math.huge);
		const multiplied = value * math.pow(10, maxdigits);

		let valuestr = string.format("%i", multiplied);
		while (valuestr.size() < maxdigits + 1) {
			valuestr = "0" + valuestr;
		}

		const integerstr = valuestr.sub(1, -maxdigits - 1);

		let floatingstr = maxdigits === 0 ? "" : valuestr.sub(-maxdigits);
		while (floatingstr.sub(-1) === "0") {
			if (floatingstr.size() === 0) break;
			floatingstr = floatingstr.sub(1, -2);
		}

		if (floatingstr.size() === 0) {
			return integerstr;
		}

		return `${integerstr}.${floatingstr}`;
	}
}
