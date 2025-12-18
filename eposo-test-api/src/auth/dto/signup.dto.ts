import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchPassword', async: false })
export class MatchPasswordConstraint implements ValidatorConstraintInterface {
  validate(passwordConfirmation: string, args: ValidationArguments) {
    const object = args.object as SignUpDto;
    return object.password === passwordConfirmation;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password and password confirmation do not match.';
  }
}

export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;

  @IsNotEmpty()
  @Validate(MatchPasswordConstraint)
  passwordConfirmation: string;
}