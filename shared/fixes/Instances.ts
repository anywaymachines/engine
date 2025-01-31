export namespace Instances {
	export function findChild<T = Instance>(object: Instance, ...path: string[]): T | undefined {
		let ret: Instance | undefined = object;
		for (const part of path) {
			if (!ret) return undefined;
			ret = ret.FindFirstChild(part);
		}

		return ret as T;
	}
	export function waitForChild<T = Instance>(object: Instance, ...path: string[]): T {
		let ret: Instance = object;
		for (const part of path) {
			ret = ret.WaitForChild(part);
		}

		return ret as T;
	}
}
