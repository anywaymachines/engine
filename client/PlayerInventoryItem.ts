import { InstanceComponent } from "engine/shared/component/InstanceComponent";

/** Player inventory item. Enabled when the player equips the item and disabled when unequips */
export class PlayerInventoryItem<T extends Tool = Tool> extends InstanceComponent<T> {
	constructor(instance: T) {
		super(instance);

		instance.Equipped.Connect(() => this.enable());
		instance.Unequipped.Connect(() => this.disable());
	}
}
