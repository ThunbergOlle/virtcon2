import { LogApp, LogLevel, log } from '@shared';
import { User, UserInventoryItem, World } from '@virtcon2/database-postgres';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { RequestContext } from '../../graphql/RequestContext';
import { EmailService } from '../../service/EmailService';
import { GenerateToken } from '../../utils/GenerateToken';
import { HashPassword } from '../../utils/HashPassword';
import RandomCode from '../../utils/RandomCode';
import { UserNewInput } from './UserRequest';
import { UserLoginResponse, UserNewResponse } from './UserResponse';

@Resolver()
export class UserResolver {
  @Mutation(() => UserLoginResponse, { nullable: true })
  async UserLogin(
    @Arg('email', () => String, { nullable: false })
    email: string,
    @Arg('password', () => String, { nullable: false })
    password: string,
  ): Promise<UserLoginResponse> {
    const passwordHash = HashPassword(password);
    // get user
    const user = await User.findOne({
      where: { email: email, password: passwordHash },
    });
    if (user) {
      const token = GenerateToken();
      User.update({ id: user.id }, { token: token });
      return { user: user, token: token, success: true };
    } else {
      return { success: false, message: 'Email or password is incorrect' };
    }
  }

  @Mutation(() => UserNewResponse, { nullable: true })
  async UserNew(
    @Arg('options', () => UserNewInput)
    options: UserNewInput,
  ): Promise<UserNewResponse> {
    log(`New user: ${options.email} (${options.display_name})`, LogLevel.INFO, LogApp.API);
    // Hash password and generate one-time confirmation code
    const passwordHash = HashPassword(options.password);
    const confirmationCode = RandomCode();

    for (const key in options) {
      if (key === 'password') options[key] = passwordHash;
      else if (key === 'display_name') options[key].replace(/ /g, '_');
    }
    // TODO: Combine this into one database request
    const playerWithSameEmail = await User.findOne({
      where: { email: options.email },
    });
    const playerWithSameDisplayName = await User.findOne({
      where: { display_name: options.display_name },
    });
    if (playerWithSameEmail) return { success: false, message: 'Email already exists' };
    else if (playerWithSameDisplayName) return { success: false, message: 'Name already exists' };

    /* Create database entry */
    const newUserEntity = User.create({
      ...options,
      confirmationCode,
      isConfirmed: process.env.NODE_ENV === 'production' ? false : true,
    });

    await User.save(newUserEntity);
    await World.GenerateNewWorld(newUserEntity);

    await EmailService.sendConfirmationMail(options.email, confirmationCode);

    return { success: true };
  }
  @Query(() => [UserInventoryItem], { nullable: false })
  async UserInventory(
    @Arg('userId', () => String, { nullable: false })
    userId: string,
  ) {
    const user = await User.findOne({
      where: { id: userId },
      relations: ['inventory', 'inventory.item'],
    });
    return user.inventory;
  }
  @Query(() => User, { nullable: true })
  Me(@Ctx() context: RequestContext) {
    return context.user;
  }
}
