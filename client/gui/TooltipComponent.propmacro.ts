import { TooltipComponent } from "engine/client/gui/TooltipComponent";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [TooltipComponentMacros];

//
type icpm<T extends Instance> = InstanceComponent<T>;

declare module "engine/shared/component/InstanceComponent" {
	interface InstanceComponent<T extends Instance> {
		/** Add or get the tooltip component */
		tooltipComponent(this: icpm<GuiObject>): TooltipComponent;

		/** Initialize the tooltip with the provided text, return this. */
		setTooltipText(this: icpm<GuiObject>, text: string | undefined): this;
	}
}
export const TooltipComponentMacros: PropertyMacros<InstanceComponent<GuiButton>> = {
	tooltipComponent: (selv) => selv.getComponent(TooltipComponent),
	setTooltipText: (selv, text) => {
		selv.tooltipComponent().text.set(text);
		return selv;
	},
};
