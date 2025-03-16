import { Control } from "engine/client/gui/Control";
import { Component } from "engine/shared/component/Component";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

export type TextBoxControlDefinition = TextBox;

/** Component that represents an editable text value */
export class TextBoxComponent extends Component {
	readonly submitted: ReadonlyArgsSignal<[value: string]>;
	readonly text;

	constructor(component: InstanceComponent<TextBoxControlDefinition>) {
		super();

		const gui = component.instance;
		this.text = this.event.observableFromInstanceParam(gui, "Text");

		const submitted = new ArgsSignal<[value: string]>();
		this.submitted = submitted;

		const activated = () => submitted.Fire(this.text.get());
		this.event.subscribe(gui.FocusLost, activated);
		this.event.subscribe(gui.ReturnPressedFromOnScreenKeyboard, activated);
	}
}

/** Control that represents an editable text value */
export class TextBoxControl extends Control<TextBoxControlDefinition> {
	readonly submitted;
	readonly text;

	constructor(gui: TextBoxControlDefinition) {
		super(gui);

		const component = this.getComponent(TextBoxComponent);
		this.submitted = component.submitted;
		this.text = component.text;
	}
}
