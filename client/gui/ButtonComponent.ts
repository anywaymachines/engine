import { ContentProvider, ReplicatedStorage } from "@rbxts/services";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
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
export class ButtonComponent<T extends ButtonDefinition = ButtonDefinition> extends InstanceComponent<T> {
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

	setInteractable(interactable: boolean) {
		this.instance.Interactable = interactable;
		this.transparencyOverlay.get(0).transparency = interactable ? undefined : 0.6;
	}
}

export type TextButtonDefinition = (GuiButton & { readonly TextLabel: TextLabel }) | TextButton;
export class TextButtonComponent<T extends TextButtonDefinition = TextButtonDefinition> extends ButtonComponent<T> {
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
		return new TextButtonComponent(gui, activated);
	}
}
