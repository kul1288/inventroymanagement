import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isBeforeOrToday', async: false })
export class IsBeforeOrToday implements ValidatorConstraintInterface {
  validate(date: Date, args: ValidationArguments) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate <= today;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Date ($value) should be today or a past date';
  }
}
