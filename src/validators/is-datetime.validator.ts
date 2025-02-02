import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isDateTime', async: false })
export class IsDateTime implements ValidatorConstraintInterface {
    validate(dateTime: string, args: ValidationArguments) {
        const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        return dateTimeRegex.test(dateTime);
    }

    defaultMessage(args: ValidationArguments) {
        return 'Date ($value) must be in the format yyyy-mm-dd hh:ii:ss';
    }
}
