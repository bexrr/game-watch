import { AddIcon, CheckIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Tag as ChakraTag, TagLabel, TagLeftIcon } from '@chakra-ui/react';
import { TagDto } from '@game-watch/shared';
import React, { useCallback, useMemo } from 'react';

import { useGameContext } from '../../providers/GameProvider';
import { useTagContext } from '../../providers/TagProvider';

export interface TagWithToggleState extends TagDto {
    toggled: boolean
}

export interface EditGameTagProps {
    onNewTag: () => void
    onCancel: () => void
}

export const EditGameTags: React.FC<EditGameTagProps> = ({ onNewTag, onCancel }) => {
    const { tags: gameTags, addTagToGame, removeTagFromGame } = useGameContext();
    const { tags: allTags } = useTagContext();

    const tagsWithToggleState = useMemo(() => {
        const activeTags = gameTags.map(tag => tag.id);

        return allTags.map(tag => ({
            ...tag,
            toggled: activeTags.includes(tag.id)
        }));
    }, [allTags, gameTags]);

    const toggleTag = useCallback(async (tag: TagWithToggleState) => {
        if (tag.toggled) {
            await removeTagFromGame(tag);
        } else {
            await addTagToGame(tag);
        }
    }, [addTagToGame, removeTagFromGame]);

    return (
        <Flex align="center" position="relative">
            <Box ml="-0.5rem" mt="-0.5rem">
                <ChakraTag
                    onClick={onNewTag}
                    colorScheme="teal"
                    cursor="pointer"
                    ml="0.5rem"
                    mt="0.5rem"
                >
                    <TagLeftIcon boxSize="12px" as={AddIcon} />
                    <TagLabel>New Tag</TagLabel>
                </ChakraTag>
                {tagsWithToggleState.map(tag => (
                    <ChakraTag
                        key={tag.id}
                        onClick={() => toggleTag(tag)}
                        variant={tag.toggled ? 'subtle' : 'outline'}
                        colorScheme={tag.toggled ? tag.color : 'whiteAlpha'}
                        cursor="pointer"
                        ml="0.5rem"
                        mt="0.5rem"
                    >
                        {tag.name}
                    </ChakraTag>
                ))}
            </Box>
            <Flex align="center" position="absolute" right="0" top="0" height="100%">
                <IconButton aria-label="cancel" size="sm" icon={<CheckIcon />} onClick={onCancel} />
            </Flex>
        </Flex>
    );
};
