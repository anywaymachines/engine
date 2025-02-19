import { RunService } from "@rbxts/services";
import { Element } from "engine/shared/Element";

export namespace PlayerRemotes {
	export function fromFolder<const T extends { readonly [k in string]: unknown }>(
		folder: Instance,
		create: (get: <T>(name: string, instanceType: "RemoteFunction" | "RemoteEvent") => T) => T,
	): T {
		const get = <T>(name: string, instanceType: "RemoteFunction" | "RemoteEvent"): T => {
			if (RunService.IsServer()) {
				return Element.create(instanceType, { Name: name, Parent: folder }) as T;
			}

			return folder.FindFirstChild(name) as T;
		};

		return create(get);
	}
}
