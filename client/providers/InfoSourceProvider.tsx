import React, { useCallback, useContext, useMemo } from "react";
import { http } from "../util/http";
import { Game, InfoSource, InfoSourceType, useGameContext } from "./GameProvider";


export interface InfoSourceCtx {
    infoSources: InfoSource[]
    addInfoSource: (type: InfoSourceType, remoteGameId: string) => Promise<InfoSource>
    syncInfoSource: (infoSource: InfoSource) => Promise<void>
    disableInfoSource: (infoSource: InfoSource) => Promise<void>
}

export const InfoSourceContext = React.createContext<InfoSourceCtx>({
    infoSources: [],
    addInfoSource: async () => ({} as InfoSource),
    syncInfoSource: async () => { },
    disableInfoSource: async () => { },
});

export function useInfoSourceContext() {
    const context = useContext(InfoSourceContext);

    return context as InfoSourceCtx;
}

export const InfoSourceProvider: React.FC<{ game: Game }> = ({ children, game }) => {
    const { setGameInfoSource } = useGameContext();

    const addInfoSource = useCallback(async (type: InfoSourceType, remoteGameId: string) => {
        const { data: infoSource } = await http.post<any>(`/info-source`, {
            gameId: game.id,
            type,
            remoteGameId
        });

        setGameInfoSource(game, infoSource);

        return infoSource;
    }, [game, setGameInfoSource]);

    const syncInfoSource = useCallback(async (infoSource: InfoSource) => {
        setGameInfoSource(game, {
            ...infoSource,
            loading: true
        });

        const { data } = await http.post<any>(`/info-source/${infoSource.id}/sync`);

        setGameInfoSource(game, data);
    }, [game, setGameInfoSource]);

    const disableInfoSource = useCallback(async (infoSource: InfoSource) => {
        setGameInfoSource(game, {
            ...infoSource,
            loading: true
        });

        const { data } = await http.post<any>(`/info-source/${infoSource.id}/disable`);

        setGameInfoSource(game, data);
    }, [game, setGameInfoSource]);

    const contextValue = useMemo(() => ({
        infoSources: game.infoSources,
        addInfoSource,
        syncInfoSource,
        disableInfoSource
    }), [game, addInfoSource, syncInfoSource, disableInfoSource]);

    return (
        <InfoSourceContext.Provider value={contextValue}>
            {children}
        </InfoSourceContext.Provider>
    )
}