import { TivetError } from "@tivet-gg/api";
import { TivetError as TivetEeError } from "@tivet-gg/api-ee";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

export function convertStringToId(x: string): string {
	return x.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function isTivetError(
	error: unknown,
): error is TivetError & { body: { message: string; code?: string } } {
	return (
		(error instanceof TivetError || error instanceof TivetEeError) &&
		typeof error.body === "object" &&
		error.body !== null &&
		Object.hasOwn(error.body, "message")
	);
}

const tivetLikeObject = z.object({
	body: z.object({
		message: z.string(),
		code: z.string().optional(),
	}),
	statusCode: z.number().optional(),
});

export function isLikeTivetError(
	error: unknown,
): error is z.infer<typeof tivetLikeObject> {
	return tivetLikeObject.safeParse(error).success;
}

export function hasMethod<TName extends string>(
	obj: unknown,
	methodName: TName,
): obj is { [key: string]: unknown } & { [K in TName]: () => unknown } {
	return z
		.object({
			[methodName]: z.function(),
		})
		.safeParse(obj).success;
}

export function noop() {}

export function findDuplicated<const Key extends string>(
	data: Record<Key, unknown>[],
	key: Key,
) {
	const duplicatesIdx: number[] = [];
	const set = new Set<unknown>();
	for (const [idx, variable] of [...data].reverse().entries()) {
		if (set.has(variable[key])) {
			duplicatesIdx.push(data.length - 1 - idx);
		}
		set.add(variable[key]);
	}

	return duplicatesIdx;
}

export const publicUrl = (path: string) => {
	const filename = path.startsWith("/") ? path.slice(1) : path;
	const url = import.meta.env.BASE_URL.endsWith("/")
		? import.meta.env.BASE_URL
		: `${import.meta.env.BASE_URL}/`;

	return `${url}${filename}`;
};

const uuidSchema = z.string().uuid();

export const isUuid = (
	uuid: string,
): uuid is `${string}-${string}-${string}-${string}-${string}` => {
	return uuidSchema.safeParse(uuid).success;
};

export const findUuidInUrl = (text: string) => {
	for (const part of text.split("/")) {
		if (isUuid(part)) {
			return part;
		}
	}
};

export function RestOnRouteChange(props: ErrorComponentProps) {
	const router = useRouter();

	// biome-ignore lint/correctness/useExhaustiveDependencies: it's a router subscription
	useEffect(() => {
		return router.subscribe("onResolved", () => {
			props.reset();
		});
	}, [router]);
}

export function assertNonNullable<V>(v: V): asserts v is Exclude<V, null> {
	if (!v) {
		throw new Error(`${v} is null`);
	}
}
