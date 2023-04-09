import { ObjectType, Field } from 'type-graphql';
import { User } from '../../entity/user/User';

@ObjectType()
export class UserNewResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String, {nullable: true})
  message?: string;
}

@ObjectType()
export class UserLoginResponse {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => String, { nullable: true })
  token?: string;

  @Field(() => Boolean)
  success: boolean;

  @Field(() => String, { nullable: true })
  message?: string;
}
