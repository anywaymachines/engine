import { Workspace } from "@rbxts/services";
import { Colors } from "engine/shared/Colors";

export namespace Materials {
	const materialTextures: { [k in Enum.Material["Name"]]: string | undefined } = {
		Asphalt: "9930003046",
		Basalt: "9920482056",
		Brick: "9920482813",
		Cardboard: "14108651729",
		Carpet: "14108662587",
		CeramicTiles: "17429425079",
		ClayRoofTiles: "18147681935",
		Cobblestone: "9919718991",
		Concrete: "9920484153",
		CorrodedMetal: "9920589327",
		CrackedLava: "9920484943",
		DiamondPlate: "10237720195",
		Fabric: "9920517696",
		Foil: "9466552117",
		Glacier: "9920518732",
		Glass: "9438868521",
		Granite: "9920550238",
		Grass: "9920551868",
		Ground: "9920554482",
		Ice: "9920555943",
		LeafyGrass: "9920557906",
		Leather: "14108670073",
		Limestone: "9920561437",
		Marble: "9439430596",
		Metal: "9920574687",
		Mud: "9920578473",
		Pavement: "9920579943",
		Pebble: "9920581082",
		Plaster: "14108671255",
		Rock: "9920587470",
		RoofShingles: "119722544879522",
		Rubber: "14108673018",
		Salt: "9920590225",
		Sand: "9920591683",
		Sandstone: "9920596120",
		Slate: "9920599782",
		Snow: "9920620284",
		Wood: "9920625290",
		WoodPlanks: "9920626778",

		//** Dead materials */
		SmoothPlastic: undefined,
		Neon: undefined,
		Plastic: undefined,
		ForceField: undefined,
		Air: undefined,
		Water: undefined,
	};

	export function getMaterialTexture(material: Enum.Material): string | undefined {
		return materialTextures[material.Name];
	}

	export function getMaterialDefaultColor(material: Enum.Material): Color3 {
		try {
			return Workspace.Terrain!.GetMaterialColor(material);
		} catch {
			return Colors.white;
		}
	}

	const materialNames: { readonly [k in Enum.Material["Name"]]?: string } = {
		RoofShingles: "Roof Shingles",
		DiamondPlate: "Diamond Plate",
		WoodPlanks: "Wood Planks",
		CorrodedMetal: "Corroded Metal",
		Asphalt: undefined,
		Basalt: undefined,
		Cardboard: undefined,
		Rubber: undefined,
		Brick: undefined,
		Cobblestone: undefined,
		Concrete: undefined,
		Fabric: undefined,
		Glass: undefined,
		Granite: undefined,
		Grass: undefined,
		Ice: undefined,
		Marble: undefined,
		Metal: undefined,
		Pebble: undefined,
		Plastic: undefined,
		Sand: undefined,
		Slate: undefined,
		Wood: undefined,
	};
	export function getMaterialDisplayName(material: Enum.Material): string {
		return materialNames[material.Name] ?? material.Name;
	}
}
