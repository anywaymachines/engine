export namespace MathUtils {
	export const e = 2.718281828459;

	export function round(value: number, step: number | undefined): number {
		if (step === undefined || step === 0) {
			return value;
		}
		if (step === 1) {
			return math.round(value);
		}

		const halfstep = step / 2;
		return value - ((value + halfstep) % step) + halfstep;
	}
	export function clamp(value: number, min: number | undefined, max: number | undefined, step?: number) {
		value = round(value, step);
		if (min) value = math.max(value, min);
		if (max) value = math.min(value, max);

		return value;
	}
}
