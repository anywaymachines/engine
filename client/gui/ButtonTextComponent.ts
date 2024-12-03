import { Component } from "engine/shared/component/Component";
import type { TextButtonDefinition } from "engine/client/gui/Button";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

/** Component that handles button text and provides an ObservableValue for it. */
export class ButtonTextComponent extends Component {
	readonly text;

	constructor(parent: InstanceComponent<TextButtonDefinition>) {
		super();

		const isTextButton = (button: TextButtonDefinition): button is TextButton =>
			!button.FindFirstChild("TextLabel");

		this.text = this.event.observableFromInstanceParam(
			isTextButton(parent.instance) ? (parent.instance as TextButton) : parent.instance.TextLabel,
			"Text",
		);
	}
}
