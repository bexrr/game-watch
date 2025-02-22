import { InfoSource, Notification } from '@game-watch/database';
import { QueueParams, QueueType } from '@game-watch/queue';
import { Logger } from '@game-watch/service';
import { InfoSourceState, InfoSourceType, NotificationType } from '@game-watch/shared';
import { EntityManager } from '@mikro-orm/core';
import { Queue } from 'bullmq';

import { ResolveService } from './resolve-service';

interface Params {
    sourceId: string
    initialRun?: boolean;
    skipCache?: boolean;
    resolveService: ResolveService
    createNotificationsQueue: Queue<QueueParams[QueueType.CreateNotifications]>
    em: EntityManager
    logger: Logger
}

export const resolveSource = async ({
    sourceId,
    initialRun,
    skipCache,
    resolveService,
    em,
    logger,
    createNotificationsQueue,
}: Params) => {
    const startTime = new Date().getTime();

    const source = await em.findOneOrFail<InfoSource<InfoSourceType, InfoSourceState.Found>, 'user'>(
        InfoSource,
        {
            id: sourceId,
            state: { $ne: InfoSourceState.Disabled }
        },
        { populate: ['user'] }
    );

    const userCountry = source.user.get().country;

    logger.info(`Resolving ${source.type}`);

    const resolvedGameData = await resolveService.resolveGameInformation(
        { source, logger, skipCache, userCountry, initialRun }
    );
    if (!resolvedGameData) {
        logger.warn(`Source ${source.type} could not be resolved`);

        await em.nativeUpdate(InfoSource, sourceId, {
            state: InfoSourceState.Error,
            updatedAt: new Date()
        });

        if (!initialRun) {
            await createNotificationsQueue.add(
                QueueType.CreateNotifications,
                {
                    sourceId,
                    existingGameData: source.data,
                    resolvedGameData: null,
                },
                { jobId: sourceId, priority: 2 }
            );
        }

        return;
    }
    logger.info(`Resolved source information in ${source.type}`);

    if (!initialRun) {
        await createNotificationsQueue.add(
            QueueType.CreateNotifications,
            {
                sourceId,
                existingGameData: source.data,
                resolvedGameData,
            },
            { jobId: sourceId, priority: 2 }
        );
    }

    await em.nativeUpdate(InfoSource, sourceId, {
        state: InfoSourceState.Resolved,
        data: resolvedGameData,
        updatedAt: new Date()
    });

    // Delete old, unnecessary ResolveError notifications so that on a new error a new notification
    // is created.
    await em.nativeDelete(Notification, {
        infoSource: source as InfoSource,
        type: NotificationType.ResolveError,
    });

    const duration = new Date().getTime() - startTime;
    logger.debug(`Resolving source took ${duration} ms`);
};
