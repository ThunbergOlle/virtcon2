import { MaxLength, MinLength } from 'class-validator';
import { Field, InputType } from 'type-graphql';
@InputType()
export class UserLoginInput {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;
}

@InputType()
export class UserNewInput extends UserLoginInput {
  @MinLength(3)
  @MaxLength(15)
  @Field(() => String)
  display_name: string;

  @Field(() => String, { nullable: true })
  referral_code: string;
}
