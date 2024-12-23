import { AnimationComponent } from "engine/client/gui/AnimationComponent";
import { ButtonComponent } from "engine/client/gui/ButtonComponent";
import { ButtonInteractabilityComponent } from "engine/client/gui/ButtonInteractabilityComponent";
import { ButtonTextComponent } from "engine/client/gui/ButtonTextComponent";
import { VisibilityComponent } from "engine/shared/component/VisibilityComponent";
import type { Action } from "engine/client/Action";
import type { TextButtonDefinition } from "engine/client/gui/Button";
import type { Component } from "engine/shared/component/Component";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ValueOverlayKey } from "engine/shared/component/OverlayValueStorage";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [CMacros, Macros1, Macros2, Macros3, Macros4, Macros5];

//

declare module "engine/shared/component/Component" {
	interface Component {
		/** Parents a child component to `this` and returns `this` */
		parentGui<T extends icpm<GuiObject>>(child: T, config?: ComponentParentConfig): T;
	}
}
export const CMacros: PropertyMacros<Component> = {
	parentGui: (selv, child, config) => {
		selv.parent(child, config);
		child.onEnabledStateChange((enabled) => child.visibilityComponent().setVisible(enabled));

		return child;
	},
};

type icpm<T extends Instance> = InstanceComponent<T>;

declare module "engine/shared/component/InstanceComponent" {
	interface InstanceComponent<T extends Instance> {
		/** Add or get the button component */
		buttonComponent(this: icpm<GuiButton>): ButtonComponent;

		/** Subscribe a button action, return this. */
		addButtonAction(this: icpm<GuiButton>, func: () => void): this;

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
export const Macros1: PropertyMacros<InstanceComponent<GuiButton>> = {
	buttonComponent: (selv) => selv.getComponent(ButtonComponent),
	addButtonAction: (selv, func) => {
		selv.buttonComponent().activated.Connect(func);
		return selv;
	},

	buttonInteractabilityComponent: (selv) => selv.getComponent(ButtonInteractabilityComponent),
	setButtonInteractable: (selv, interactable) => {
		selv.buttonInteractabilityComponent().setInteractable(interactable);
		return selv;
	},
};

export const Macros2: PropertyMacros<InstanceComponent<TextButtonDefinition>> = {
	buttonTextComponent: (selv) => selv.getComponent(ButtonTextComponent),
	setButtonText: (selv, interactable) => {
		selv.buttonTextComponent().text.set(interactable);
		return selv;
	},
};

declare module "engine/shared/component/InstanceComponent" {
	interface InstanceComponent<T extends Instance> {
		/** Add or get the visibility component. */
		visibilityComponent(this: icpm<GuiObject>): VisibilityComponent;
		/** Enable and show the component using the main key. Might trigger animations. */
		show(this: icpm<GuiObject>, key?: ValueOverlayKey): void;
		/** Disable and hide the component using the main key. Might trigger animations. */
		hide(this: icpm<GuiObject>, key?: ValueOverlayKey): void;
		/** Set enabled state and visibility of the component using the main key. Might trigger animations. */
		setVisibleAndEnabled(this: icpm<GuiObject>, visible: boolean, key?: ValueOverlayKey): void;

		/** Set visibility of the GuiObject using the main key. Might trigger animations. */
		setInstanceVisibility(this: icpm<GuiObject>, visible: boolean, key?: ValueOverlayKey): void;
		/** Returns whether the component's VisibilityComponent is visible or not. Does not check the actual GuiObject visibility. */
		isInstanceVisible(this: icpm<GuiObject>): boolean;
	}
}
export const Macros3: PropertyMacros<InstanceComponent<GuiObject>> = {
	visibilityComponent: (selv) => selv.getComponent(VisibilityComponent),
	show: (selv, key) => selv.setVisibleAndEnabled(true, key),
	hide: (selv, key) => selv.setVisibleAndEnabled(false, key),
	setVisibleAndEnabled: (selv, visible, key) => {
		selv.setInstanceVisibility(visible, key);
		selv.setEnabled(visible);
	},
	setInstanceVisibility: (selv, visible, key) => selv.visibilityComponent().setVisible(visible, key),
	isInstanceVisible: (selv) => selv.visibilityComponent().isVisible(),
};

declare module "engine/shared/component/InstanceComponent" {
	interface InstanceComponent<T extends Instance> {
		/** Add or get the animation component. */
		animationComponent(this: icpm<GuiObject>): AnimationComponent;
	}
}
export const Macros4: PropertyMacros<InstanceComponent<GuiObject>> = {
	animationComponent: (selv) => selv.getComponent(AnimationComponent),
};

declare module "engine/shared/component/InstanceComponent" {
	interface InstanceComponent<T extends Instance> {
		subscribeVisibilityFrom(
			this: icpm<GuiObject>,
			values: { readonly [k in string]: ReadonlyObservableValue<boolean> },
		): this;

		/** Subscribes the button to execute the given action when clicked and hide itself if the action can't execute. */
		subscribeToAction(this: icpm<GuiButton>, action: Action, indicator?: GuiButtonActionIndicator.Func): this;
	}
}
export const Macros5: PropertyMacros<InstanceComponent<GuiButton>> = {
	subscribeVisibilityFrom: (selv, values) => {
		selv.visibilityComponent().subscribeFrom(values);
		return selv;
	},
	subscribeToAction: (selv, action, indicator = GuiButtonActionIndicator.interactability) => {
		selv.addButtonAction(() => action.execute());
		indicator(selv, action);

		return selv;
	},
};

//

/** List of functions to provide into {@link InstanceComponent.subscribeToAction} */
export namespace GuiButtonActionIndicator {
	export type Func = (selv: InstanceComponent<GuiButton>, action: Action) => void;

	/** Show or hide the button based on action canExecute */
	export const hide: Func = (selv, action) => selv.subscribeVisibilityFrom({ main: action.canExecute });

	/** Set button interactability to action canExecute */
	export const interactability: Func = (selv, action) => {
		action.canExecute.subscribe((canExecute) => selv.setButtonInteractable(canExecute), true);
	};
}
