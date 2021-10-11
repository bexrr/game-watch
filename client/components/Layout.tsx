import Head from 'next/head'
import React, { PropsWithChildren } from 'react'
import Header from './Header'
import { Flex, Box, useColorModeValue } from "@chakra-ui/react";


export default function Layout({ children }: PropsWithChildren<{}>) {
    return (
        <Flex
            direction="column"
            bg={useColorModeValue('gray.100', 'gray.700')}
            height="100vh"
            minHeight="100vh"
        >
            <Head>
                <title>GameWatch</title>
                <meta name="description" content="Overview of game release dates, prices and news" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header />
            <Flex
                direction="column"
                justifyContent="space-between"
                pt="2rem"
                pX={[0, 0, "2rem"]}
                mt="4rem"
                overflow="auto"
                minHeight="calc(100vh - 4rem)"
            >
                {children}
                <Flex
                    justify="center"
                    align="center"
                    width="100%"
                    p="1rem"
                    pt="1.25rem"
                    bg={useColorModeValue('white', 'gray.800')}
                    boxShadow="xl"
                >
                    <a
                        href="https://github.com/Agreon"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Made by <b>Agreon</b>
                    </a>
            </Flex>
            </Flex>

        </Flex>
    )
}