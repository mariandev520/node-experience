import faker from "faker";
import ItemRepoFactory from "../Factories/ItemRepoFactory";
import IItemRepository from "../../InterfaceAdapters/IRepositories/IItemRepository";
import Item from "../../Domain/Entities/Item";
import IItemDomain from "../../InterfaceAdapters/IDomain/IItemDomain";

class ItemSeedFactory
{
    private itemRepo: IItemRepository;

    constructor()
    {
        this.itemRepo = ItemRepoFactory.create();
    }

    public async init()
    {
        const indexes = Array.from( {length: 10}, (v, i) => i + 1 );

        for await (const index of indexes)
        {
            const title = faker.name.title();
            const type = faker.random.number();

            const item: IItemDomain = new Item();

            item.name = title;
            item.type = type;

            await this.itemRepo.save(item);
        }
    }
}

export default ItemSeedFactory;