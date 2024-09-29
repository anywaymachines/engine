import { ReplicatedStorage } from "@rbxts/services";

export namespace Instances {
	export const assets = ReplicatedStorage.WaitForChild("Assets") as Folder;

	export function getAssets<T extends object = Folder>() {
		return assets as T;
	}

	export function waitForChild<T = Instance>(object: Instance, ...path: string[]): T {
		let ret: Instance = object;
		for (const part of path) {
			ret = ret.WaitForChild(part);
		}

		return ret as T;
	}
}
