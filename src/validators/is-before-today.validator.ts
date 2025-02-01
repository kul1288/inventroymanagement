import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isBeforeToday', async: false })
export class IsBeforeToday implements ValidatorConstraintInterface {

    validate(date: Date, args: ValidationArguments) {
        return date < new Date();
    }

    defaultMessage(args: ValidationArguments) {
        return args.constraints[0] || 'Date should be a past date';
    }
}
