import { Flex } from "@chakra-ui/layout";
import { Spinner, ThemeTypings } from "@chakra-ui/react";

export const LoadingSpinner: React.FC<{ size: ThemeTypings["components"]["Spinner"]["sizes"] }> = ({ size }) => (
    <Flex
        position="absolute"
        width="100%"
        height="100%"
        justify="center"
        align="center"
        zIndex="1"
        backgroundColor="rgba(186, 186, 186, 0.21)"
    >
        <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size={size}
        />
    </Flex>
)