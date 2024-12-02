import { ContentProvider, ReplicatedStorage } from "@rbxts/services";
import { Control } from "engine/client/gui/Control";
import { Component } from "engine/shared/component/Component";
import { InstanceValueStorage } from "engine/shared/component/InstanceValueStorage";
import { Transforms } from "engine/shared/component/Transforms";
import { Element } from "engine/shared/Element";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ElementProperties } from "engine/shared/Element";

const clickSound = Element.create("Sound", {
	Name: "Click",
	SoundId: "rbxassetid://876939830",
	Parent: ReplicatedStorage,
});
ContentProvider.PreloadAsync([clickSound]);

/** Component that handles {@link GuiButton.Activated} event and provides a signal for it. */
export class ButtonComponent extends Component {
	readonly activated: ReadonlyArgsSignal;

	constructor(parent: InstanceComponent<ButtonDefinition>) {
		super();

		const activated = new ArgsSignal();
		this.activated = activated;

		const silent = parent.getAttribute<boolean>("silent") === true;
		this.event.subscribe(parent.instance.Activated, () => {
			if (!silent) clickSound.Play();
			activated.Fire();
		});
	}
}

/** Component that handles button interactability. */
export class ButtonInteractabilityComponent extends Component {
	private readonly parentComponent;
	private readonly transparencyOverlay;

	constructor(parent: InstanceComponent<ButtonDefinition>) {
		super();

		this.parentComponent = parent;

		this.transparencyOverlay = InstanceValueStorage.get(parent.instance, "Transparency");
		this.transparencyOverlay.value.subscribe((transparency) => {
			Transforms.create()
				.if(parent.instance.Transparency === 1 && transparency !== 1, (tr) => tr.show(parent.instance))
				.transform(parent.instance, "Transparency", transparency, Transforms.quadOut02)
				.if(transparency === 1, (tr) => tr.then().hide(parent.instance));
		});
	}

	setInteractable(interactable: boolean): void {
		this.parentComponent.instance.Interactable = interactable;
		this.transparencyOverlay.overlay(5, interactable ? undefined : 0.6);
	}
}

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

//

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
