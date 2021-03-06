import {Query, Model} from "mongoose";
import {injectable} from "inversify";

import INotificationRepository from "../../InterfaceAdapters/IRepositories/INotificationRepository";
import IPaginator from "../../InterfaceAdapters/Shared/IPaginator";
import ICriteria from "../../InterfaceAdapters/Shared/ICriteria";

import MongoPaginator from "../../Presentation/Shared/MongoPaginator";
import INotification from "../../InterfaceAdapters/IEntities/Mongoose/INotificationDocument";
import {connection} from "../Database/MongooseCreateConnection";
import INotificationDomain from "../../InterfaceAdapters/IInfrastructure/INotificationDomain";
import EmailNotification from "../Entities/EmailNotification";
import PushNotification from "../Entities/PushNotification";
import NotificationFilter from "../../Presentation/Criterias/Notification/NotificationFilter";
import NotFoundException from "../Exceptions/NotFoundException";

@injectable()
class NotificationMongoRepository implements INotificationRepository
{
    private readonly repository: Model<INotification>;
    private readonly emailRepository: Model<INotification>;
    private readonly pushRepository: Model<INotification>;

    constructor()
    {
        this.repository = connection.model<INotification>('Notification');
        this.emailRepository = this.repository.discriminators.EmailNotification;
        this.pushRepository = this.repository.discriminators.PushNotification;
    }

    async save (notification: INotificationDomain): Promise<INotificationDomain>
    {
        const rep = this.getRepository(notification);
        return await rep.create(notification);
    }

    async getOne(id: string): Promise<INotificationDomain>
    {
        const notification = await this.repository.findOne({_id: id});

        if (!notification)
        {
            throw new NotFoundException('Notification');
        }

        return notification;
    }

    async list(criteria: ICriteria): Promise<IPaginator>
    {
        const queryBuilder: Query<INotification[], INotification> = this.repository.find();
        const filter = criteria.getFilter();

        if (filter.has(NotificationFilter.KIND))
        {
            const type = filter.get(NotificationFilter.KIND);

            queryBuilder.where(NotificationFilter.KIND).equals(type);
        }
        if (filter.has(NotificationFilter.NAME))
        {
            const name: string = filter.get(NotificationFilter.NAME);
            const rsearch = new RegExp(name, "g");

            queryBuilder.where(NotificationFilter.NAME).regex(rsearch);
        }

        return new MongoPaginator(queryBuilder, criteria);
    }

    private getRepository(kind: any)
    {
        if (kind instanceof EmailNotification)
        {
            return this.emailRepository;
        }
        else if (kind instanceof PushNotification)
        {
            return this.pushRepository;
        }
        else
        {
            return this.repository;
        }
    }

}

export default NotificationMongoRepository;