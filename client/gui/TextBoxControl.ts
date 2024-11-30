import { Control2 } from "engine/client/gui/Control";
import { Signal } from "engine/shared/event/Signal";

export type TextBoxControlDefinition = TextBox;

/** Control that represents a text value */
export class TextBoxControl extends Control2<TextBoxControlDefinition> {
	readonly submitted = new Signal<(value: string) => void>();
	readonly text;

	constructor(gui: TextBoxControlDefinition) {
		super(gui);
		this.text = this.event.observableFromInstanceParam(gui, "Text");

		const activated = () => this.submitted.Fire(this.text.get());
		this.event.subscribe(this.gui.FocusLost, activated);
		this.event.subscribe(this.gui.ReturnPressedFromOnScreenKeyboard, activated);
	}
}
