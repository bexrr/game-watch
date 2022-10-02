import { InfoSource, Notification } from '@game-watch/database';
import { NIGHTLY_JOB_OPTIONS, QueueParams, QueueType } from '@game-watch/queue';
import { CacheService, Logger } from '@game-watch/service';
import {
    Country,
    GameDataU,
    InfoSourceState,
    InfoSourceType,
    NotificationType,
} from '@game-watch/shared';
import { EntityManager } from '@mikro-orm/core';
import axios from 'axios';
import { Queue } from 'bullmq';

export interface InfoResolverContext {
    logger: Logger
    userCountry: Country
    source: InfoSource<InfoSourceType, InfoSourceState.Found>
}

export interface InfoResolver<T extends GameDataU = GameDataU> {
    type: InfoSourceType
    resolve: (context: InfoResolverContext) => Promise<T>
}

export class CriticalError extends Error {
    public constructor(
        public sourceType: InfoSourceType,
        public originalError: Error
    ) {
        super();
    }
}

export class ResolveService {
    public constructor(
        private readonly resolvers: InfoResolver[],
        private readonly cacheService: CacheService,
        private readonly createNotificationsQueue: Queue<QueueParams[QueueType.CreateNotifications]>,
        private readonly em: EntityManager,
        private readonly sourceScopedLogger: Logger
    ) { }

    public async resolveSource({ sourceId, triggeredManually }: {
        sourceId: string
        triggeredManually?: boolean
    }) {
        const startTime = new Date().getTime();

        const source = await this.em
            .findOneOrFail<InfoSource<InfoSourceType, InfoSourceState.Found>, 'user'>(
                InfoSource,
                {
                    id: sourceId,
                    state: { $ne: InfoSourceState.Disabled }
                },
                { populate: ['user'] }
            );

        const userCountry = source.user.get().country;

        const logger = this.sourceScopedLogger.child({ type: source.type, userCountry });

        logger.info(`Resolving ${source.type}`);

        try {
            const resolvedGameData = await this.resolveGameInformation(
                { source, logger, userCountry }
            );

            logger.debug(`Resolved source information in ${source.type}`);

            if (!triggeredManually) {
                await this.addToNotificationQueue({
                    sourceId,
                    resolvedGameData,
                    existingGameData: source.data as GameDataU,
                });
            }

            await this.em.nativeUpdate(InfoSource, sourceId, {
                state: InfoSourceState.Resolved,
                data: resolvedGameData,
                updatedAt: new Date()
            });

            // Delete old, unnecessary ResolveError notifications so that on a new error a
            // new notification is created.
            await this.em.nativeDelete(Notification, {
                infoSource: source as InfoSource,
                type: NotificationType.ResolveError,
            });

            const duration = new Date().getTime() - startTime;
            logger.debug(`Resolving source took ${duration} ms`);
        } catch (error) {
            logger.warn(`Source ${source.type} could not be resolved`);

            if (!triggeredManually) {
                await this.addToNotificationQueue({
                    sourceId,
                    // Will trigger a ResolveError Notification.
                    resolvedGameData: null,
                    existingGameData: source.data as GameDataU,
                });
            }

            await this.em.nativeUpdate(InfoSource, sourceId, {
                state: InfoSourceState.Error,
                updatedAt: new Date()
            });

            if (
                // We only want to retry on network errors that are not signaling us to stop.
                (axios.isAxiosError(error) && error.response?.status !== 403)
                // This error occurs if Puppeteer timeouts.
                || error.name === 'TimeoutError'
            ) {
                throw error;
            }

            logger.warn("Retrying likely won't help. Aborting immediately");
            throw new CriticalError(source.type, error);
        }
    }

    private async resolveGameInformation(context: InfoResolverContext): Promise<GameDataU> {
        const { source: { type, data: { id } }, userCountry, logger } = context;

        const cacheKey = `${type}:${userCountry}:${id}`.toLocaleLowerCase();
        const existingData = await this.cacheService.get<GameDataU>(cacheKey);
        if (existingData) {
            logger.debug(`Data for ${cacheKey} was found in cache`);

            return existingData;
        }

        const startTime = new Date().getTime();

        const resolvedData = await this
            .getResolverForTypeOrFail(type)
            .resolve(context);

        const duration = new Date().getTime() - startTime;
        logger.debug(`Resolving ${type} took ${duration} ms`);

        await this.cacheService.set(cacheKey, resolvedData);

        return resolvedData;
    }

    private getResolverForTypeOrFail(type: InfoSourceType): InfoResolver {
        const resolverForType = this.resolvers.find(resolver => resolver.type == type);
        if (!resolverForType) {
            throw new Error(`No resolver for type ${type} found`);
        }
        return resolverForType;
    }

    private async addToNotificationQueue(
        { sourceId, existingGameData, resolvedGameData }: {
            sourceId: string
            existingGameData: GameDataU | null
            resolvedGameData: GameDataU | null
        }
    ) {
        await this.createNotificationsQueue.add(
            QueueType.CreateNotifications,
            {
                sourceId,
                existingGameData,
                resolvedGameData,
            },
            {
                jobId: sourceId,
                priority: 2,
                ...NIGHTLY_JOB_OPTIONS
            }
        );
    }
}
