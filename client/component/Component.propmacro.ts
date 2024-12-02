import { AnimationComponent } from "engine/client/gui/AnimationComponent";
import { ButtonComponent, ButtonInteractabilityComponent } from "engine/client/gui/Button";
import { ButtonTextComponent } from "engine/client/gui/Button";
import { VisibilityComponent } from "engine/shared/component/VisibilityComponent";
import type { TextButtonDefinition } from "engine/client/gui/Button";
import type { _InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ObservableSwitchKey } from "engine/shared/event/ObservableSwitch";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [Macros1, Macros2, Macros3, Macros4];

//

type icpm<T extends Instance> = InstanceComponentPropMacros<T>;

declare global {
	interface InstanceComponentPropMacros<T extends Instance> extends _InstanceComponent<T> {
		/** Add or get the button component */
		buttonComponent(this: icpm<GuiButton>): ButtonComponent;

		/** Subscribe a button action, return the connection. */
		addButtonAction(this: icpm<GuiButton>, func: () => void): SignalConnection;

		/** Subscribe a button action, return this. */
		withButtonAction(this: icpm<GuiButton>, func: () => void): this;

		/** Add or get the button interactability component */
		buttonInteractabilityComponent(this: icpm<GuiButton>): ButtonInteractabilityComponent;

		/** Set button interactability, return this. */
		setButtonInteractable(this: icpm<GuiButton>, interactable: boolean): this;

		/** Add or get the button text component */
		buttonTextComponent(this: icpm<TextButtonDefinition>): ButtonTextComponent;

		/** Set button text, return this. */
		setButtonText(this: icpm<TextButtonDefinition>, text: string): this;
	}
}
export const Macros1: PropertyMacros<InstanceComponentPropMacros<GuiButton>> = {
	buttonComponent: (selv) => selv.getComponent(ButtonComponent),
	addButtonAction: (selv, func) => selv.buttonComponent().activated.Connect(func),
	withButtonAction: (selv, func) => {
		selv.addButtonAction(func);
		return selv;
	},

	buttonInteractabilityComponent: (selv) => selv.getComponent(ButtonInteractabilityComponent),
	setButtonInteractable: (selv, interactable) => {
		selv.buttonInteractabilityComponent().setInteractable(interactable);
		return selv;
	},
};

export const Macros2: PropertyMacros<InstanceComponentPropMacros<TextButtonDefinition>> = {
	buttonTextComponent: (selv) => selv.getComponent(ButtonTextComponent),
	setButtonText: (selv, interactable) => {
		selv.buttonTextComponent().text.set(interactable);
		return selv;
	},
};

declare global {
	interface InstanceComponentPropMacros<T extends Instance> extends _InstanceComponent<T> {
		/** Add or get the visibility component. */
		visibilityComponent(this: icpm<GuiObject>): VisibilityComponent;
		/** Enable and show the component using the main key. Might trigger animations. */
		show_(this: icpm<GuiObject>, key?: ObservableSwitchKey): void;
		/** Disable and hide the component using the main key. Might trigger animations. */
		hide_(this: icpm<GuiObject>, key?: ObservableSwitchKey): void;
		/** Set enabled state and visibility of the component using the main key. Might trigger animations. */
		setVisibleAndEnabled(this: icpm<GuiObject>, visible: boolean, key?: ObservableSwitchKey): void;

		/** Set visibility of the GuiObject using the main key. Might trigger animations. */
		setInstanceVisibility(this: icpm<GuiObject>, visible: boolean, key?: ObservableSwitchKey): void;
		/** Returns whether the component's VisibilityComponent is visible or not. Does not check the actual GuiObject visibility. */
		isInstanceVisible(this: icpm<GuiObject>, key?: ObservableSwitchKey): boolean;
	}
}
export const Macros3: PropertyMacros<InstanceComponentPropMacros<GuiObject>> = {
	visibilityComponent: (selv) => selv.getComponent(VisibilityComponent),
	show_: (selv, key) => selv.setVisibleAndEnabled(true, key),
	hide_: (selv, key) => selv.setVisibleAndEnabled(false, key),
	setVisibleAndEnabled: (selv, visible, key) => {
		selv.setInstanceVisibility(visible, key);
		selv.setEnabled(visible);
	},
	setInstanceVisibility: (selv, visible, key) => selv.visibilityComponent().setVisible(visible, key),
	isInstanceVisible: (selv, key) => selv.visibilityComponent().isVisible(key),
};

declare global {
	interface InstanceComponentPropMacros<T extends Instance> extends _InstanceComponent<T> {
		/** Add or get the animation component. */
		animationComponent(this: icpm<GuiObject>): AnimationComponent;
	}
}
export const Macros4: PropertyMacros<InstanceComponentPropMacros<GuiObject>> = {
	animationComponent: (selv) => selv.getComponent(AnimationComponent),
};
