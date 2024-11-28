// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ReadonlyEnableableEStateMacros, EStateMacros];

//

declare global {
	namespace ComponentEStateTypes {
		export interface ReadonlyEnableable {
			/** Subscribes to the enabled state change event.
			 * @param executeImmediately If true, the function will be called immediately with the current state. False by default
			 */
			onEnabledStateChange(func: (enabled: boolean) => void, executeImmediately?: boolean): void;
		}
	}
}
export const ReadonlyEnableableEStateMacros: PropertyMacros<ComponentEStateTypes.ReadonlyEnableable> = {
	onEnabledStateChange: (selv, func: (enabled: boolean) => void, executeImmediately = false) => {
		selv.onEnable(() => func(true));
		selv.onDisable(() => func(false));

		if (executeImmediately) {
			func(selv.isEnabled());
		}
	},
};

declare global {
	interface ComponentEState {
		/** Set the state of the component */
		setEnabled(enabled: boolean): void;

		/** Switch the state of the component */
		switchEnabled(): void;
	}
}
export const EStateMacros: PropertyMacros<ComponentEState> = {
	setEnabled: (selv, enabled) => {
		if (enabled) selv.enable();
		else selv.disable();
	},
	switchEnabled: (selv) => {
		selv.setEnabled(!selv.isEnabled());
	},
};
