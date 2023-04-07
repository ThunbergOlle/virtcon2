import { InputType, Field } from 'type-graphql';
@InputType()
export class UserLoginInput {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;
}

@InputType()
export class UserNewInput extends UserLoginInput {
  @Field(() => String)
  display_name: string;

  @Field(() => String, { nullable: true })
  referralCode: string;
}
