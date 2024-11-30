import { ButtonComponent2, ButtonInteractabilityComponent2 } from "engine/client/gui/Button";
import { ButtonTextComponent2 } from "engine/client/gui/Button";
import type { ButtonTextComponentDefinition } from "engine/client/gui/Button";
import type { _InstanceComponent } from "engine/shared/component/InstanceComponent";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [Macros1, Macros2];

//

declare global {
	interface InstanceComponentPropMacros<T extends Instance> extends _InstanceComponent<T> {
		/** Add or get the button component */
		buttonComponent(this: InstanceComponentPropMacros<GuiButton>): ButtonComponent2;

		/** Subscribe a button action, return the connection. */
		addButtonAction(this: InstanceComponentPropMacros<GuiButton>, func: () => void): SignalConnection;

		/** Subscribe a button action, return this. */
		withButtonAction(this: InstanceComponentPropMacros<GuiButton>, func: () => void): this;

		/** Add or get the button interactability component */
		buttonInteractabilityComponent(this: InstanceComponentPropMacros<GuiButton>): ButtonInteractabilityComponent2;

		/** Set button interactability, return this. */
		setButtonInteractable(this: InstanceComponentPropMacros<GuiButton>, interactable: boolean): this;

		/** Add or get the button text component */
		buttonTextComponent(this: InstanceComponentPropMacros<ButtonTextComponentDefinition>): ButtonTextComponent2;

		/** Set button text, return this. */
		setButtonText(this: InstanceComponentPropMacros<ButtonTextComponentDefinition>, text: string): this;
	}
}
export const Macros1: PropertyMacros<InstanceComponentPropMacros<GuiButton>> = {
	buttonComponent: (selv) => selv.getComponent(ButtonComponent2),
	addButtonAction: (selv, func) => selv.buttonComponent().activated.Connect(func),
	withButtonAction: (selv, func) => {
		selv.addButtonAction(func);
		return selv;
	},

	buttonInteractabilityComponent: (selv) => selv.getComponent(ButtonInteractabilityComponent2),
	setButtonInteractable: (selv, interactable) => {
		selv.buttonInteractabilityComponent().setInteractable(interactable);
		return selv;
	},
};

export const Macros2: PropertyMacros<InstanceComponentPropMacros<ButtonTextComponentDefinition>> = {
	buttonTextComponent: (selv) => selv.getComponent(ButtonTextComponent2),
	setButtonText: (selv, interactable) => {
		selv.buttonTextComponent().text.set(interactable);
		return selv;
	},
};
