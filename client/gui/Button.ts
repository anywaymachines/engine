import { ContentProvider, ReplicatedStorage } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { InstanceValueStorage } from "engine/shared/component/InstanceValueStorage";
import { ObjectOverlayStorage } from "engine/shared/component/ObjectOverlayStorage";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { Element } from "engine/shared/Element";
import { ArgsSignal, Signal } from "engine/shared/event/Signal";
import type { ElementProperties } from "engine/shared/Element";

const clickSound = Element.create("Sound", {
	Name: "Click",
	SoundId: "rbxassetid://876939830",
	Parent: ReplicatedStorage,
});
ContentProvider.PreloadAsync([clickSound]);

export type ButtonDefinition = GuiButton;

class ChildComponent<T extends Component> extends Component {
	constructor(readonly parentComponent: T) {
		super();
	}
}

/** Component that handles {@link GuiButton.Activated} event and provides a signal for it. */
export class ButtonComponent2 extends ChildComponent<InstanceComponent<ButtonComponentDefinition>> {
	readonly activated: ReadonlyArgsSignal;

	constructor(parent: InstanceComponent<ButtonComponentDefinition>) {
		super(parent);

		const activated = new ArgsSignal();
		this.activated = activated;

		const silent = parent.getAttribute<boolean>("silent") === true;
		this.event.subscribe(parent.instance.Activated, () => {
			if (!silent) clickSound.Play();
			activated.Fire();
		});
	}
}

export class ButtonInteractabilityComponent2 extends ChildComponent<InstanceComponent<ButtonDefinition>> {
	private readonly transparencyOverlay;

	constructor(parent: InstanceComponent<ButtonDefinition>) {
		super(parent);

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

export type ButtonTextComponentDefinition = Instance &
	({ readonly TextLabel: Instance & { Text: string } } | { Text: string });
/** Component that handles {@link GuiButton.Activated} event and provides a signal for it. */
export class ButtonTextComponent2 extends ChildComponent<InstanceComponent<ButtonTextComponentDefinition>> {
	readonly text;

	constructor(parent: InstanceComponent<ButtonTextComponentDefinition>) {
		super(parent);

		const isTextButton = (button: ButtonTextComponentDefinition): button is Instance & { Text: string } =>
			!button.FindFirstChild("TextLabel");

		this.text = this.event.observableFromInstanceParam(
			isTextButton(parent.instance) ? (parent.instance as TextButton) : parent.instance.TextLabel!,
			"Text",
		);
	}
}

//

export type ButtonComponentDefinition = Instance & Pick<GuiButton, "Activated">;
/** Component that handles {@link GuiButton.Activated} event and provides a signal for it. */
export class ButtonComponent extends InstanceComponent<ButtonComponentDefinition> {
	readonly activated: ReadonlyArgsSignal;

	constructor(instance: ButtonComponentDefinition, func?: () => void) {
		super(instance);

		const activated = new ArgsSignal();
		this.activated = activated;
		if (func) {
			activated.Connect(func);
		}

		const silent = this.getAttribute<boolean>("silent") === true;
		this.event.subscribe(instance.Activated, () => {
			if (!silent) clickSound.Play();
			activated.Fire();
		});
	}
}

export type ButtonControlDefinition = Instance & Pick<GuiButton, "Activated">;
/** Component that handles {@link GuiButton.Activated} event and provides a signal for it. */
export class ButtonControl extends InstanceComponent<ButtonComponentDefinition> {
	readonly activated: ReadonlyArgsSignal;

	constructor(instance: ButtonComponentDefinition, func?: () => void) {
		super(instance);

		const activated = new ArgsSignal();
		this.activated = activated;
		if (func) {
			activated.Connect(func);
		}

		const silent = this.getAttribute<boolean>("silent") === true;
		this.event.subscribe(instance.Activated, () => {
			if (!silent) clickSound.Play();
			activated.Fire();
		});
	}
}

export class ButtonInteractabilityComponent extends InstanceComponent<ButtonDefinition> {
	private readonly transparencyOverlay;

	constructor(gui: ButtonDefinition) {
		super(gui);

		this.transparencyOverlay = InstanceValueStorage.get(gui, "Transparency");
		this.transparencyOverlay.value.subscribe((transparency) => {
			Transforms.create()
				.if(gui.Transparency === 1 && transparency !== 1, (tr) => tr.show(gui))
				.transform(gui as GuiObject, "Transparency", transparency, Transforms.quadOut02)
				.if(transparency === 1, (tr) => tr.then().hide(gui));
		});
	}

	setInteractable(interactable: boolean): void {
		this.instance.Interactable = interactable;
		this.transparencyOverlay.overlay(5, interactable ? undefined : 0.6);
	}
}

class _ButtonControl<T extends ButtonDefinition = ButtonDefinition> extends InstanceComponent<T> {
	readonly activated = new Signal();
	private readonly transparencyOverlay;

	constructor(gui: T, activated?: () => void) {
		super(gui);

		this.transparencyOverlay = new ObjectOverlayStorage({ transparency: gui.Transparency });
		const silent = this.getAttribute<boolean>("silent") === true;

		this.event.subscribe(gui.Activated, () => {
			if (!silent) clickSound.Play();
			this.activated.Fire();
		});

		if (activated) {
			this.activated.Connect(activated);
		}

		this.transparencyOverlay.value.subscribe(({ transparency }) => {
			TransformService.run(gui, (tr) => {
				if (gui.Transparency === 1 && transparency !== 1) {
					tr.func(() => (gui.Visible = true)).then();
				}

				tr.transform(gui as GuiObject, "Transparency", transparency, Transforms.commonProps.quadOut02);

				if (transparency === 1) {
					tr.then().func(() => (gui.Visible = false));
				}
			});
		});
	}

	setInteractable(interactable: boolean): void {
		this.instance.Interactable = interactable;
		this.transparencyOverlay.get(0).transparency = interactable ? undefined : 0.6;
	}
}
export type ButtonControll<T extends ButtonDefinition = ButtonDefinition> = _ButtonControl<T>;
export const ButtonControll = _ButtonControl;

export type TextButtonDefinition = (GuiButton & { readonly TextLabel: TextLabel }) | TextButton;
export class TextButtonControl<T extends TextButtonDefinition = TextButtonDefinition> extends ButtonControll<T> {
	readonly text;

	constructor(gui: T, activated?: () => void) {
		super(gui, activated);

		const isTextButton = (button: TextButtonDefinition): button is TextButton =>
			!button.FindFirstChild("TextLabel");

		this.text = this.event.observableFromInstanceParam(
			isTextButton(gui) ? (gui as TextButton) : gui.TextLabel!,
			"Text",
		);
	}

	static create(props: ElementProperties<TextButton>, activated?: () => void) {
		const gui = Element.create("TextButton", props);
		return new TextButtonControl(gui, activated);
	}
}
