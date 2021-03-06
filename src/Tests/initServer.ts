import "reflect-metadata";

import "../Presentation/Handlers/IndexHandler";
import "../Presentation/Handlers/AuthHandler";
import "../Presentation/Handlers/ItemHandler";
import "../Presentation/Handlers/UserHandler";
import "../Presentation/Handlers/RoleHandler";
// import "../Presentation/Handlers/FileHandler";
// import "../Presentation/Handlers/NotificationHandler";

import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import LoggerWinston from "../Presentation/Middlewares/LoggerWinston";
import AuthenticationMiddleware from "../Presentation/Middlewares/AuthenticationMiddleware";
import RefreshTokenMiddleware from "../Presentation/Middlewares/RefreshTokenMiddleware";

import {InversifyExpressServer} from "inversify-express-utils";
import {ErrorHandler} from "../Presentation/Shared/ErrorHandler";
import supertest from "supertest";
import container from "../inversify.config";
import ICreateConnection from "../InterfaceAdapters/IDatabase/ICreateConnection";
import DatabaseFactory from "../Infrastructure/Factories/DatabaseFactory";
import SeedFactory from "../Infrastructure/Seeds/SeedFactory";
import EventHandler from "../Infrastructure/Events/EventHandler";
import RedirectRouteNotFoundMiddleware from "../Presentation/Middlewares/RedirectRouteNotFoundMiddleware";
import ITokenRepository from "../InterfaceAdapters/IRepositories/ITokenRepository";
import {REPOSITORIES} from "../repositories";
import TokenMongoRepository from "../Infrastructure/Repositories/TokenMongoRepository";
import {validateEnv} from "../Config/validateEnv";

const initServer = async () =>
{   let server: InversifyExpressServer;
    let request: supertest.SuperTest<supertest.Test>;
    let dbConnection: ICreateConnection;

    validateEnv();

    const databaseFactory = new DatabaseFactory();

    dbConnection = databaseFactory.create();

    dbConnection.initConfigTest(process.env.MONGO_URL);
    await dbConnection.create();

    container.unbind(REPOSITORIES.ITokenRepository);
    container.bind<ITokenRepository>(REPOSITORIES.ITokenRepository).to(TokenMongoRepository);

    server = new InversifyExpressServer(container);

    server.setConfig((app: any) =>
    {
        app.use(bodyParser.urlencoded({
            extended: true,
            limit: '5mb'
        }));
        app.use(bodyParser.json({
            limit: '5mb'
        }));
        app.use(compression());
        app.use(cors());
        app.use(helmet());
        app.use(LoggerWinston);
        app.use(AuthenticationMiddleware);
        app.use(RefreshTokenMiddleware);
    });

    server.setErrorConfig((app: any) =>
    {
        app.use(ErrorHandler.handle);
    });

    const application = await server.build();
    application.use(RedirectRouteNotFoundMiddleware);
    request = supertest(application);

    const seed = new SeedFactory();
    await seed.init();

    // TODO: Add filesystem mock
    // filesystem = FilesystemFactory.create();

    const eventHandler = EventHandler.getInstance();

    return {server, request, dbConnection}
}

export default initServer;