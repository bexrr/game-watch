/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { Box, Flex } from "@chakra-ui/layout";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Game, InfoSource as Source, useGameContext } from "../providers/GameProvider";
import { Skeleton, Text, SkeletonText, useColorModeValue } from "@chakra-ui/react";
import { InfoSource } from "./InfoSource";
import { GameTileMenu } from "./GameTile/GameTileMenu";
import { LoadingSpinner } from "./LoadingSpinner";
import { AddInfoSource } from "./GameTile/AddInfoSource";

// TODO: Let users select the priority / image
const INFO_SOURCE_PRIORITY = [
    "psStore",
    "steam",
    "nintendo",
]

const retrieveDataFromInfoSources = (infoSources: Source[], key: string): string | null => {
    for (const infoSource of infoSources) {
        if (infoSource.data?.[key]) {
            if (key === "thumbnailUrl") {
                const thumbnailUrl = infoSource.data[key] as string;

                if (infoSource.type === "nintendo") {
                    const width = 460 + 100;
                    const height = 215 + 100;
                    return thumbnailUrl
                        .replace(/w_(\d*)/, `w_${width}`)
                        .replace(/h_(\d*)/, `h_${height}`)
                }

                if (infoSource.type === "psStore") {
                    const url = new URL(thumbnailUrl);
                    url.searchParams.delete("w");
                    url.searchParams.append("w", "460");
                    return url.toString();
                }
            }

            return infoSource.data[key] as string;
        }
    }

    return null;
}

/**
 * TODO:
 * - Toasts for errors
 */
export const GameTile: React.FC<{ game: Game }> = ({ game }) => {
    const { syncGame, deleteGame } = useGameContext();

    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    const onSync = useCallback(async () => {
        setLoading(true);
        await syncGame(game.id);
        setLoading(false);
    }, [game, syncGame])


    const onDelete = useCallback(async () => {
        setLoading(true);
        await deleteGame(game.id);
        setLoading(false);
    }, [game, deleteGame]);

    // Needed so that the effect props are evaluated correct.
    const infoSourceLength = useMemo(() => game.infoSources.length, [game]);
    useEffect(() => {
        (async () => {
            if (!infoSourceLength) {
                setImageLoading(true);
                await onSync();
            }
        })();
        // We only want to call the effect then
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [infoSourceLength]);

    const sortedInfoSources = useMemo(
        () => game.infoSources
            .filter(source => !source.disabled)
            .sort((a, b) => {
                const aPriority = INFO_SOURCE_PRIORITY.findIndex(type => type === a.type);
                const bPriority = INFO_SOURCE_PRIORITY.findIndex(type => type === b.type);
                return aPriority - bPriority;
            })
        , [game.infoSources]);

    const { fullName, thumbnail } = useMemo(() => ({
        fullName: retrieveDataFromInfoSources(sortedInfoSources, "fullName"),
        thumbnail: retrieveDataFromInfoSources(sortedInfoSources, "thumbnailUrl"),
    }), [sortedInfoSources]);

    return (
        <Box
            position="relative"
            marginX={[0, 0, "1rem"]}
            marginY="1rem"
            height="100%"
            minWidth={["100%", "28rem"]}
            maxWidth={["100vw", "28rem"]}
            overflow="hidden"
            bg={useColorModeValue('white', 'gray.800')}
            borderWidth="1px"
            rounded="lg"
            shadow="lg"
            boxShadow="xl"
            _hover={{
                borderColor: useColorModeValue("grey", "white")
            }}
            transition="border-color 0.15s ease"
        >
            <Box position="absolute" right="0" top="0" zIndex="1">
                <GameTileMenu onSync={onSync} onDelete={onDelete} gameName={fullName ?? game.name} />
            </Box>
            <Flex direction="column">
                <Box position="relative">
                    {(loading || (infoSourceLength > 0 && imageLoading)) && <LoadingSpinner size="xl" />}
                    <Skeleton isLoaded={!loading || infoSourceLength > 0}>
                        <Flex justify="center" height="215px" bg={useColorModeValue("white", "gray.900")} >
                            {thumbnail &&
                                <img
                                src={thumbnail}
                                width="460"
                                onLoad={() => setImageLoading(false)}
                                style={{ objectFit: "cover" }}
                                />
                            }
                        </Flex>
                    </Skeleton>
                </Box>
                <Box padding="1rem">
                    <Text fontSize="2xl">{fullName ?? game.name}</Text>
                    <Box>
                        {loading && infoSourceLength === 0 ?
                            <SkeletonText />
                            : sortedInfoSources
                                .map(source => <InfoSource key={source.id} game={game} source={source} />)
                        }

                        {!loading && infoSourceLength === 0 &&
                            <Text size="xl" textAlign="center" my="1" >No sources found :C</Text>
                        }
                    </Box>
                    {!loading && <AddInfoSource game={game} />}
                </Box>
            </Flex>
        </Box>
    )
}