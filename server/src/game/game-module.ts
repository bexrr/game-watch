import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ResolveModule } from '../resolve/resolve-module';
import { SearchModule } from '../search/search-module';
import { GameController } from './game-controller';
import { Game } from './game-model';
import { GameService } from './game-service';
import { InfoSource } from './info-source-model';

@Module({
    imports: [
        MikroOrmModule.forFeature([Game, InfoSource]),
        SearchModule,
        ResolveModule
    ],
    providers: [
        GameService
    ],
    controllers: [
        GameController
    ]
})
export class GameModule { }
