declare namespace ComponentEStateTypes {
	export interface ReadonlyEnableable {
		isEnabled(): boolean;
		onEnable(func: () => void): void;
		onDisable(func: () => void): void;
	}
	export interface ReadonlyDestroyable {
		isDestroyed(): boolean;
		onDestroy(func: () => void): void;
	}

	export interface Enableable {
		enable(): void;
		disable(): void;
	}
	export interface Destroyable {
		destroy(): void;
	}

	export interface ComponentEStateBase extends ReadonlyEnableable, ReadonlyDestroyable, Enableable, Destroyable {}
}

interface ComponentEState extends ComponentEStateTypes.ComponentEStateBase {}
