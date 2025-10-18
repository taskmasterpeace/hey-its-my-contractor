
declare module 'google-libphonenumber' {
    export class PhoneNumberUtil {
        static getInstance(): PhoneNumberUtil;

        isValidNumber(phoneNumber: any): boolean;
        parseAndKeepRawInput(phoneNumber: string): any;
    }
}
