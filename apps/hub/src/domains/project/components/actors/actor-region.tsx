import { Flex, WithTooltip } from "@tivet-gg/components";
import { useSuspenseQuery } from "@tanstack/react-query";
import { actorRegionQueryOptions } from "../../queries";
import {
	REGION_LABEL,
	RegionIcon,
	getRegionKey,
} from "../matchmaker/lobby-region";

interface ActorRegionProps {
	regionId: string;
	projectNameId: string;
	environmentNameId: string;
	showLabel?: boolean | "abbreviated";
	className?: string;
}

export function ActorRegion({
	projectNameId,
	regionId,
	environmentNameId,
	showLabel,
	className,
}: ActorRegionProps) {
	const { data: region } = useSuspenseQuery(
		actorRegionQueryOptions({ projectNameId, environmentNameId, regionId }),
	);

	const regionKey = getRegionKey(region?.id);

	if (showLabel) {
		return (
			<Flex gap="2" items="center" justify="center" className={className}>
				<RegionIcon region={regionKey} className="w-4 min-w-4" />
				<span>
					{showLabel === "abbreviated"
						? regionKey.toUpperCase()
						: (REGION_LABEL[regionKey] ?? REGION_LABEL.unknown)}
				</span>
			</Flex>
		);
	}

	return (
		<WithTooltip
			content={REGION_LABEL[regionKey] ?? REGION_LABEL.unknown}
			trigger={
				<Flex
					gap="2"
					items="center"
					justify="center"
					className={className}
				>
					<RegionIcon region={regionKey} className="w-4 min-w-4" />
				</Flex>
			}
		/>
	);
}
