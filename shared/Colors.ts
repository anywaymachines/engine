export namespace Colors {
	export const white = Color3.fromRGB(255, 255, 255);
	export const black = Color3.fromRGB(0, 0, 0);

	export const red = Color3.fromRGB(255, 73, 76);
	export const green = Color3.fromRGB(48, 173, 85);
	export const blue = Color3.fromRGB(85, 170, 255);
	export const yellow = Color3.fromRGB(252, 252, 105);
	export const pink = Color3.fromRGB(244, 142, 255);
	export const purple = Color3.fromRGB(120, 18, 120);
	export const orange = Color3.fromRGB(237, 184, 51);

	export function toInt(color: Color3) {
		return math.floor(color.B * 255) + (math.floor(color.G * 255) << 8) + (math.floor(color.R * 255) << 16);
	}
	export function grayscale(b: number) {
		return Color3.fromRGB(b, b, b);
	}

	/**
	 * @param lightening Percentage to lighten the color by, 0-1
	 */
	function lighten(color: Color3, lightening: number): Color3 {
		const [h, s, v] = color.ToHSV();
		return Color3.fromHSV(h, s, v + (1 - v) * lightening);
	}
	export function lightenPressed(color: Color3): Color3 {
		return lighten(color, 0.5);
	}
}
