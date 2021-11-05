import { Input } from "@chakra-ui/input";
import { Button, useColorModeValue } from "@chakra-ui/react";
import { Flex } from "@chakra-ui/layout";
import { useState, useCallback, useRef, useEffect } from "react";
import { useGamesContext } from "../providers/GamesProvider";

export const AddGame: React.FC = () => {
    const { addGame } = useGamesContext();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");

    // Focus initially
    const inputRef = useRef<HTMLInputElement | null>(null)
    useEffect(() => { inputRef.current && inputRef.current.focus() }, []);

    const searchGame = useCallback(async () => {
        setLoading(true);
        try {
            await addGame(name);
            setName("");
        } finally {
            setLoading(false);
        }
    }, [addGame, name, setName]);

    const onNameKeyPress = useCallback(async ({ key }) => {
        if (key === "Enter") {
            await searchGame();
        }
    }, [searchGame]);

    return (
        <Flex align="center">
            <Input
                ref={inputRef}
                value={name}
                disabled={loading}
                onChange={(event) => setName(event.target.value)}
                onKeyPress={onNameKeyPress}
                placeholder="Name of the game"
                bg={useColorModeValue("white", "gray.800")}
                size="lg"
            />
            <Button
                variant="solid"
                colorScheme="teal"
                ml="1rem"
                size="lg"
                onClick={searchGame}
                isLoading={loading}
            >
                Add
            </Button>
        </Flex>
    )
}