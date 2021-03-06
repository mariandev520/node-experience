import { lazyInject } from '../../../inversify.config'
import UserUpdatePayload from "../../../InterfaceAdapters/Payloads/Users/UserUpdatePayload";
import IUserRepository from "../../../InterfaceAdapters/IRepositories/IUserRepository";
import CheckUserRolePayload from "../../../InterfaceAdapters/Payloads/Auxiliars/CheckUserRolePayload";
import Roles from "../../../Config/Roles";
import IRoleRepository from "../../../InterfaceAdapters/IRepositories/IRoleRepository";
import RoleRepoFactory from "../../../Infrastructure/Factories/RoleRepoFactory";
import Role from '../../Entities/Role';
import {REPOSITORIES} from "../../../repositories";
import {SERVICES} from "../../../services";
import IUserDomain from "../../../InterfaceAdapters/IDomain/IUserDomain";
import AuthService from "../../../Application/Services/AuthService";
import CantDisabledException from "../../Exceptions/CantDisabledException";

class UpdateUserUseCase
{
    @lazyInject(REPOSITORIES.IUserRepository)
    private repository: IUserRepository;

    @lazyInject(SERVICES.IAuthService)
    private authService: AuthService;

    async handle(payload: UserUpdatePayload): Promise<IUserDomain>
    {
        const id = payload.getId();
        const user: IUserDomain = await this.repository.getOne(id);
        let enable = payload.getEnable();

        if (payload.getTokenUserId() === user.getId())
        {
            enable = true;
        }

        if(typeof user.roles !== 'undefined' && enable !== null) // TODO: Refactoring
        {
            let checkRole: CheckUserRolePayload = {
                roleToCheck: Roles.SUPER_ADMIN.toLocaleLowerCase(),
                user
            }

            const verifyRole = await this.checkIfUserHasRole(checkRole);

            if(verifyRole && !enable)
            {
                throw new CantDisabledException();
            }
        }

        user.firstName = payload.getFirstName();
        user.lastName = payload.getLastName();
        user.enable = payload.getEnable();
        user.email = payload.getEmail();
        user.permissions = payload.getPermissions();

        await this.repository.save(user);

        return user;
    }

    public async checkIfUserHasRole (payload: CheckUserRolePayload): Promise<boolean> // TODO: Create a user service
    {
        let roleRepository: IRoleRepository = RoleRepoFactory.create();
        let count = payload.user.roles.length;

        for (let i = 0; i < count; i++)
        {
            const role: Role = await roleRepository.getOne(payload.user.roles[i].getId());

            if(role.slug === payload.roleToCheck)
            {
                return true;
            }
        }

        return false;
    }
}

export default UpdateUserUseCase;
