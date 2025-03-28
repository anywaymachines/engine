import { HttpService } from "@rbxts/services";
import { Objects } from "engine/shared/fixes/Objects";

type Serializer<TActual, TSerialized extends JsonSerializedProperty> = {
	isType(obj: unknown): obj is TActual;
	serialize(value: TActual): TSerialized;
	deserialize(value: TSerialized): TActual;
};

/** A value or that is serializable by `HTTPService.JSONEncode` */
export type JsonSerializedProperty =
	| number
	| string
	| undefined
	| boolean
	| object
	| SerializedVector3
	| SerializedVector2
	| SerializedCFrame
	| SerializedUDim2
	| SerializedUDim
	| SerializedColor3;

type SerializedEnumItem = { readonly __type: "enumItem"; readonly type: string; readonly name: string };
const enumItem: Serializer<EnumItem, SerializedEnumItem> = {
	isType(obj): obj is EnumItem {
		return typeIs(obj, "EnumItem");
	},
	serialize(value: EnumItem): SerializedEnumItem {
		return {
			__type: "enumItem",
			type: tostring(value.EnumType),
			name: value.Name,
		};
	},
	deserialize(value: SerializedEnumItem): EnumItem {
		return (Enum as unknown as { readonly [k in string]: Enum })[value.type][value.name as never];
	},
};

type SerializedCFrame = {
	readonly __type: "cframe";
	readonly c: readonly [
		x: number,
		y: number,
		z: number,
		R00: number,
		R01: number,
		R02: number,
		R10: number,
		R11: number,
		R12: number,
		R20: number,
		R21: number,
		R22: number,
	];
};
const cframe: Serializer<CFrame, SerializedCFrame> = {
	isType(obj): obj is CFrame {
		return typeIs(obj, "CFrame");
	},
	serialize(value: CFrame): SerializedCFrame {
		return { __type: "cframe", c: value.GetComponents() };
	},
	deserialize(value: SerializedCFrame): CFrame {
		return new CFrame(...value.c);
	},
};

type SerializedVector2 = { readonly __type: "vector2"; readonly x: number; readonly y: number };
const vector2: Serializer<Vector2, SerializedVector2> = {
	isType(obj): obj is Vector2 {
		return typeIs(obj, "Vector2");
	},
	serialize(value: Vector2): SerializedVector2 {
		return { __type: "vector2", x: value.X, y: value.Y };
	},
	deserialize(value: SerializedVector2): Vector2 {
		return new Vector2(value.x, value.y);
	},
};

type SerializedVector3 = { readonly __type: "vector3"; readonly x: number; readonly y: number; readonly z: number };
const vector3: Serializer<Vector3, SerializedVector3> = {
	isType(obj): obj is Vector3 {
		return typeIs(obj, "Vector3");
	},
	serialize(value: Vector3): SerializedVector3 {
		return { __type: "vector3", x: value.X, y: value.Y, z: value.Z };
	},
	deserialize(value: SerializedVector3): Vector3 {
		return new Vector3(value.x, value.y, value.z);
	},
};

type SerializedUDim2 = {
	readonly __type: "udim2";
	readonly xs: number;
	readonly xo: number;
	readonly ys: number;
	readonly yo: number;
};
const udim2: Serializer<UDim2, SerializedUDim2> = {
	isType(obj): obj is UDim2 {
		return typeIs(obj, "UDim2");
	},
	serialize(value: UDim2): SerializedUDim2 {
		return { __type: "udim2", xs: value.X.Scale, xo: value.X.Offset, ys: value.Y.Scale, yo: value.Y.Offset };
	},
	deserialize(value: SerializedUDim2): UDim2 {
		return new UDim2(value.xs, value.xo, value.yo, value.ys);
	},
};

type SerializedUDim = { readonly __type: "udim"; readonly s: number; readonly o: number };
const udim: Serializer<UDim, SerializedUDim> = {
	isType(obj): obj is UDim {
		return typeIs(obj, "UDim");
	},
	serialize(value: UDim): SerializedUDim {
		return { __type: "udim", s: value.Scale, o: value.Offset };
	},
	deserialize(value: SerializedUDim): UDim {
		return new UDim(value.s, value.o);
	},
};

type SerializedColor3 = { readonly __type: "color3"; readonly r: number; readonly g: number; readonly b: number };
const color3: Serializer<Color3, SerializedColor3> = {
	isType(obj): obj is Color3 {
		return typeIs(obj, "Color3");
	},
	serialize(value: Color3): SerializedColor3 {
		return {
			__type: "color3",
			r: math.round(value.R * 255),
			g: math.round(value.G * 255),
			b: math.round(value.B * 255),
		};
	},
	deserialize(value: SerializedColor3): Color3 {
		return Color3.fromRGB(value.r, value.g, value.b);
	},
};

//

const serializers = {
	enumItem,
	vector2,
	vector3,
	cframe,
	udim2,
	udim,
	color3,
} as const satisfies { readonly [k in string]: Serializer<unknown, JsonSerializedProperty & { __type: k }> };
const serializerValues = Objects.values(serializers) as readonly Serializer<unknown, JsonSerializedProperty>[];

/** JSON de/serializer with the support of some roblox native types like `Vector3` or `CFrame` */
export namespace JSON {
	export function serialize(value: unknown): string {
		const process = (obj: unknown): unknown => {
			if (typeIs(obj, "number")) return obj;
			if (typeIs(obj, "string")) return obj;
			if (typeIs(obj, "boolean")) return obj;
			if (obj === undefined) return undefined;

			for (const serializer of serializerValues) {
				if (serializer.isType(obj)) {
					return serializer.serialize(obj as never);
				}
			}

			if (typeIs(obj, "table")) {
				const toserialize: Partial<Record<string | number | symbol, unknown>> = {};
				for (const [key, value] of pairs(obj)) {
					toserialize[key as keyof typeof toserialize] = process(value as JsonSerializedProperty);
				}

				return toserialize;
			}

			return obj;
		};

		return HttpService.JSONEncode(process(value));
	}
	export function deserialize<T>(data: string): T {
		const process = <T>(obj: JsonSerializedProperty): unknown => {
			if (typeIs(obj, "table") && "__type" in obj && obj["__type"] in serializers) {
				return serializers[obj["__type"]].deserialize(obj as never);
			}

			if (typeIs(obj, "number")) return obj;
			if (typeIs(obj, "boolean")) return obj;
			if (typeIs(obj, "string")) return obj;
			if (obj === undefined) return obj;

			if (typeIs(obj, "table")) {
				const toserialize: Partial<Record<keyof T, unknown>> = {};
				for (const [key, value] of pairs(obj)) {
					if (key === "__v") continue;
					toserialize[key as keyof T] = process(value);
				}

				return toserialize as T;
			}

			return obj;
		};

		return process(HttpService.JSONDecode(data) as JsonSerializedProperty) as T;
	}
}
