export namespace Reflection {
	export interface Class<T extends object = object> {
		/** @deprecated */
		readonly ___nominal: T;

		/** The full and unique path to this class */
		readonly __csymbol: string;

		/** The parent class. */
		readonly __index?: ClassLevel1;
	}
	/** Empty object that is a metatable, with its metatable being the class */
	interface ClassLevel1 {
		/** The actual class. */
		readonly __index: Class;
	}

	/** Returns the class of an object. */
	export function getClass<T>(object: T): T extends object ? Class<T> | undefined : undefined;
	export function getClass<T>(object: T): Class | undefined {
		if (!typeIs(object, "table")) return;

		const meta1 = getmetatable(object);
		if (!meta1 || !typeIs(meta1, "table")) return;
		if (!("__index" in meta1)) return;

		const meta = meta1.__index;
		if (!isClass(meta)) return;

		return meta;
	}

	/** Returns true if the object is a class. */
	export function isClass(object: unknown): object is Class {
		if (!object) return false;
		if (!typeIs(object, "table")) return false;
		if (!("__csymbol" in object)) return false;

		return true;
	}

	/** Returns the parent class of this class. */
	export function getClassParent(clazz: Class): Class | undefined {
		return clazz.__index?.__index;
	}

	/** Returns true if the given class is a subclass of the parent. */
	export function isAssignableTo(clazz: Class, parent: Class) {
		if (clazz === parent) return true;

		let current: Class | undefined = clazz;
		while (current !== undefined) {
			if (current === parent) return true;
			current = getClassParent(current);
		}

		return false;
	}
	/** Returns true if the given class is a superclass of the child. */
	export function isAssignableFrom(clazz: Class, child: Class) {
		return isAssignableTo(child, clazz);
	}
}
