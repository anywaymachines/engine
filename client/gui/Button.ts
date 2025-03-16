import { Control } from "engine/client/gui/Control";
import { Element } from "engine/shared/Element";
import type { ElementProperties } from "engine/shared/Element";

export type ButtonDefinition = GuiButton;
/** Simple Control wrapper for {@link ButtonComponent}. */
export class ButtonControl extends Control<ButtonDefinition> {
	readonly activated: ReadonlyArgsSignal;

	constructor(instance: ButtonDefinition, activated?: () => void) {
		super(instance);

		this.activated = this.buttonComponent().activated;
		if (activated) {
			this.activated.Connect(activated);
		}
	}
}

export type TextButtonDefinition = (GuiButton & { readonly TextLabel: TextLabel }) | TextButton;
/** Simple Control wrapper for {@link ButtonComponent} and {@link ButtonTextComponent}. */
export class TextButtonControl<T extends TextButtonDefinition = TextButtonDefinition> extends Control<T> {
	static create(props: ElementProperties<TextButton>, activated?: () => void) {
		const gui = Element.create("TextButton", props);
		return new TextButtonControl(gui, activated);
	}

	readonly activated;
	readonly text;

	constructor(gui: T, activated?: () => void) {
		super(gui);

		this.activated = this.buttonComponent().activated;
		if (activated) {
			this.activated.Connect(activated);
		}

		this.text = this.buttonTextComponent().text;
	}
}
