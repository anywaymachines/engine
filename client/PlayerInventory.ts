import { Players } from "@rbxts/services";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import { HostedService } from "engine/shared/di/HostedService";
import type { PlayerInventoryItem } from "engine/client/PlayerInventoryItem";

@injectable
export class PlayerInventory extends HostedService {
	private readonly registeredTools = new Map<string, (instance: Tool) => PlayerInventoryItem>();
	private readonly items = this.parentDestroyOnly(new ComponentKeyedChildren<Instance, PlayerInventoryItem>());

	constructor() {
		super();

		const add = (tool: Instance) => {
			if (!tool.IsA("Tool")) return;
			if (this.items.getAll().has(tool)) return;

			const registered = this.registeredTools.get(tool.Name);
			if (!registered) return;

			const controller = registered(tool);
			this.items.add(tool, controller);
		};

		// backpack is recreated every time a Character is created
		this.event.subscribeObservable(
			LocalPlayer.character,
			() => {
				const backpack = Players.LocalPlayer.WaitForChild("Backpack");
				backpack.ChildAdded.Connect(add);
				for (const child of backpack.GetChildren()) {
					add(child);
				}
			},
			true,
		);
	}

	registerTool(id: string, func: (instance: Tool) => PlayerInventoryItem) {
		this.registeredTools.set(id, func);
	}
	registerToolClass<TArgs extends unknown[]>(
		id: string,
		di: DIContainer,
		clazz: ConstructorOf<PlayerInventoryItem, [Tool, ...TArgs]>,
		args?: Partial<TArgs>,
	) {
		this.registerTool(id, (instance) => di.resolveForeignClass(clazz, [instance, ...(args ?? [])]));
	}
}
