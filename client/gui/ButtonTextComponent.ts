import { Component } from "engine/shared/component/Component";
import type { TextButtonDefinition } from "engine/client/gui/Button";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";

/** Component that handles button text and provides an ObservableValue for it. */
export class ButtonTextComponent extends Component {
	readonly text;

	constructor(parent: InstanceComponent<TextButtonDefinition>) {
		super();

		const tb =
			(parent.instance.FindFirstChild("TextLabel") as TextLabel | undefined) ??
			(parent.instance.IsA("TextButton") ? parent.instance : undefined) ??
			parent.instance.FindFirstChildWhichIsA("TextLabel", true) ??
			(parent.instance as { TextLabel: TextLabel }).TextLabel;

		this.text = this.event.observableFromInstanceParam(tb, "Text");
	}
}
