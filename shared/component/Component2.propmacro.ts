// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [Component2Macros];

//

declare global {
	interface Component2PropMacros {
		isEnabled(): boolean;
		isDestroyed(): boolean;

		enable(): void;
		disable(): void;
		destroy(): void;

		onEnable(func: () => void): void;
		onDisable(func: () => void): void;
		onDestroy(func: () => void): void;
	}
}
export const Component2Macros: PropertyMacros<Component2PropMacros> = {
	isEnabled: (selv): boolean => selv.enabledState.isEnabled(),
	isDestroyed: (selv): boolean => selv.enabledState.isDestroyed(),
	onEnable: (selv, func): void => selv.enabledState.onEnable(func),
	onDisable: (selv, func): void => selv.enabledState.onDisable(func),
	onDestroy: (selv, func): void => selv.enabledState.onDestroy(func),
	enable: (selv): void => selv.enabledState.enable(),
	disable: (selv): void => selv.enabledState.disable(),
	destroy: (selv): void => selv.enabledState.destroy(),
};
