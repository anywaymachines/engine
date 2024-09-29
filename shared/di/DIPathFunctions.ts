/** Decorator function. Replaces the parameter with the path of type that is supplied with {@link typeParameter} type argument */
export function pathOf(typeParameter: string): (...args: any[]) => void {
	return () => {};
}

/** Returns the path to the supplied class type, if possible */
export const getDIClassSymbol = <T extends object>(obj: T): string => {
	const meta = getmetatable(obj) as { __csymbol?: string; __index?: object };
	const s = meta.__csymbol;
	if (s !== undefined) return s;

	if (!meta.__index) {
		const mmeta = getmetatable(meta);
		assert(mmeta);

		return getDIClassSymbol(mmeta);
	}

	assert(meta.__index !== obj);
	return getDIClassSymbol(meta.__index);
};
