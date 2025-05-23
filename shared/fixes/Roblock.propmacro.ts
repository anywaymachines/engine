// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [Vector3Macros, Vector2Macros];

declare global {
	interface Vector3 {
		/** Return a vector with all its components processed through the {@link func} */
		apply(this: Vector3, func: (value: number, axis: "X" | "Y" | "Z") => number): Vector3;

		/** Return a minimum number from all axes */
		findMin(this: Vector3): number;

		/** Return a minimum number from all axes */
		findMax(this: Vector3): number;

		/** Returns a vector that is `math.min` on both of the provided vectors
		 * @deprecated use Roblox built-in method
		 */
		min(this: Vector3, vector: Vector3): Vector3;

		/** Returns a vector that is `math.max` on both of the provided vectors
		 * @deprecated use Roblox built-in method
		 */
		max(this: Vector3, vector: Vector3): Vector3;

		with(this: Vector3, x?: number, y?: number, z?: number): Vector3;
	}
}
export const Vector3Macros: PropertyMacros<Vector3> = {
	apply: (vector: Vector3, func): Vector3 => {
		return new Vector3(func(vector.X, "X"), func(vector.Y, "Y"), func(vector.Z, "Z"));
	},
	findMin: (vector: Vector3): number => {
		return math.min(vector.X, vector.Y, vector.Z);
	},
	findMax: (vector: Vector3): number => {
		return math.max(vector.X, vector.Y, vector.Z);
	},
	min: (vector: Vector3, other: Vector3): Vector3 => {
		return new Vector3(math.min(vector.X, other.X), math.min(vector.Y, other.Y), math.min(vector.Z, other.Z));
	},
	max: (vector: Vector3, other: Vector3): Vector3 => {
		return new Vector3(math.max(vector.X, other.X), math.max(vector.Y, other.Y), math.max(vector.Z, other.Z));
	},
	with: (vector: Vector3, x?: number, y?: number, z?: number): Vector3 => {
		return new Vector3(x ?? vector.X, y ?? vector.Y, z ?? vector.Z);
	},
};

//

declare global {
	interface Vector2 {
		/** Return a vector with all its components processed through the {@link func} */
		apply(this: Vector2, func: (value: number, axis: "X" | "Y") => number): Vector2;

		/** Returns a vector that is `math.min` on both of the provided vectors */
		min(this: Vector2, vector: Vector2): Vector2;

		/** Returns a vector that is `math.max` on both of the provided vectors */
		max(this: Vector2, vector: Vector2): Vector2;
	}
}
export const Vector2Macros: PropertyMacros<Vector2> = {
	apply: (vector: Vector2, func): Vector2 => {
		return new Vector2(func(vector.X, "X"), func(vector.Y, "Y"));
	},
	min: (vector: Vector2, other: Vector2): Vector2 => {
		return new Vector2(math.min(vector.X, other.X), math.min(vector.Y, other.Y));
	},
	max: (vector: Vector2, other: Vector2): Vector2 => {
		return new Vector2(math.max(vector.X, other.X), math.max(vector.Y, other.Y));
	},
};
