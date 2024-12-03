import { GuiService, UserInputService } from "@rbxts/services";
import { ObservableValue } from "engine/shared/event/ObservableValue";

/** A permanent event that monitors the change in the type of input type, which makes the game more flexible */
namespace InputTypeChangeEvent {
	/** Returns the input type based on the given input type */
	function getInputTypeByEnum(userInputType: Enum.UserInputType): InputType {
		if (userInputType === Enum.UserInputType.Gamepad1) {
			return "Gamepad";
		} else if (userInputType === Enum.UserInputType.Touch) {
			return "Touch";
		} else {
			return "Desktop";
		}
	}

	/** Callback of subscribed event */
	function onLastInputTypeChanged(lastInputType: Enum.UserInputType) {
		const newInputType = getInputTypeByEnum(lastInputType);

		if (newInputType !== InputController.inputType.get()) {
			if (UserInputService.GetFocusedTextBox()) {
				return;
			}

			InputController.inputType.set(newInputType);
		}
	}

	export function subscribe() {
		// Event
		UserInputService.LastInputTypeChanged.Connect(onLastInputTypeChanged);
	}
}
InputTypeChangeEvent.subscribe();

/** Basic class of input data type control */
export namespace InputController {
	export const inputType = new ObservableValue<InputType>(InputController.getPhysicalInputType());

	export const isDesktop = inputType.createBased((inputType) => inputType === "Desktop");
	export const isGamepad = inputType.createBased((inputType) => inputType === "Gamepad");
	export const isTouch = inputType.createBased((inputType) => inputType === "Touch");

	/** Returns the input type based on the device the client is playing from */
	export function getPhysicalInputType(): InputType {
		if (GuiService.IsTenFootInterface()) {
			return "Gamepad";
		} else if (UserInputService.TouchEnabled && !UserInputService.MouseEnabled) {
			return "Touch";
		} else {
			return "Desktop";
		}
	}

	/** Returns true if the right or left ctrl is pressed */
	export function isCtrlPressed(): boolean {
		return (
			UserInputService.IsKeyDown(Enum.KeyCode.LeftControl) ||
			UserInputService.IsKeyDown(Enum.KeyCode.RightControl)
		);
	}

	/** Returns true if the right or left shift is pressed */
	export function isShiftPressed(): boolean {
		return (
			UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) || UserInputService.IsKeyDown(Enum.KeyCode.RightShift)
		);
	}
}
