import { ContentProvider, ReplicatedStorage } from "@rbxts/services";
import { Control } from "engine/client/gui/Control";
import { ObjectOverlayStorage } from "engine/shared/component/ObjectOverlayStorage";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { Element } from "engine/shared/Element";
import { Signal } from "engine/shared/event/Signal";
import type { ElementProperties } from "engine/shared/Element";

const clickSound = Element.create("Sound", {
	Name: "Click",
	SoundId: "rbxassetid://876939830",
	Parent: ReplicatedStorage,
});
ContentProvider.PreloadAsync([clickSound]);

export type ButtonDefinition = GuiButton;
export class ButtonControl<T extends ButtonDefinition = ButtonDefinition> extends Control<T> {
	readonly activated = new Signal();
	private readonly visibilityOverlay;

	constructor(gui: T, activated?: () => void) {
		super(gui);

		this.visibilityOverlay = new ObjectOverlayStorage({ transparency: gui.Transparency });
		const silent = this.getAttribute<boolean>("silent") === true;

		this.event.subscribe(this.gui.Activated, () => {
			if (!silent) clickSound.Play();
			this.activated.Fire();
		});

		if (activated) {
			this.activated.Connect(activated);
		}

		this.visibilityOverlay.value.subscribe(({ transparency }) => {
			TransformService.run(gui, (tr) => {
				if (gui.Transparency === 1 && transparency !== 1) {
					tr.func(() => (this.gui.Visible = true)).then();
				}

				tr.transform(gui as GuiObject, "Transparency", transparency, Transforms.commonProps.quadOut02);

				if (transparency === 1) {
					tr.then().func(() => (this.gui.Visible = false));
				}
			});
		});
	}

	setInteractable(interactable: boolean) {
		this.gui.Interactable = interactable;
		this.visibilityOverlay.get(0).transparency = interactable ? undefined : 0.6;
	}
	// protected setInstanceVisibilityFunction(visible: boolean): void {
	// 	this.visibilityOverlay.get(-1).transparency = visible ? undefined : 1;
	// }
}

export type TextButtonDefinition = (GuiButton & { readonly TextLabel: TextLabel }) | TextButton;
export class TextButtonControl<T extends TextButtonDefinition = TextButtonDefinition> extends ButtonControl<T> {
	readonly text;

	constructor(gui: T, activated?: () => void) {
		super(gui, activated);

		const isTextButton = (button: TextButtonDefinition): button is TextButton =>
			!button.FindFirstChild("TextLabel");

		this.text = this.event.observableFromInstanceParam(
			isTextButton(this.gui) ? (this.gui as TextButton) : this.gui.TextLabel!,
			"Text",
		);
	}

	static create(props: ElementProperties<TextButton>, activated?: () => void) {
		const gui = Element.create("TextButton", props);
		return new TextButtonControl(gui, activated);
	}
}
