import { ObjectType, Field, Resolver, Mutation, Arg, InputType } from 'type-graphql';
import { HashPassword } from '../../utils/HashPassword';
import RandomCode from '../../utils/RandomCode';
import { User } from '../../entity/user/User';
import { EmailService } from '../../service/EmailService';

@ObjectType()
class UserNewResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message?: string;
}
@InputType()
class PlayerLoginInput {
  @Field()
  email: string;

  @Field()
  password: string;
}
@InputType()
class PlayerNewInput extends PlayerLoginInput {
  @Field()
  display_name: string;

  @Field()
  referralCode: string;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserNewResponse, { nullable: true })
  async UserNew(
    @Arg('options', () => PlayerNewInput, { nullable: false })
    options: PlayerNewInput,
  ): Promise<UserNewResponse> {
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
    const player = await User.create({
      ...options

    }).save();

    await EmailService.sendConfirmationMail(options.email, confirmationCode);

    return { success: true };
  }
}
