import { PhoneNumberUtil as _PNUtil , PhoneNumberFormat} from "google-libphonenumber";
const PNUtil = _PNUtil.getInstance();

export function parsePhoneNumber(
    phonenumber: string
): libphonenumber.PhoneNumber {
    const paserInputRes = PNUtil.parseAndKeepRawInput(phonenumber);
    return paserInputRes;
}

export function testStringCNPhoneNumber(phonenumber: string): boolean {
    try {
        return PNUtil.isValidNumberForRegion(
            PNUtil.parseAndKeepRawInput(phonenumber),
            "CN"
        );
    } catch (e) {
        return false;
    }
}

export function testPhoneNumberCNPhoneNumber(phonenumber: libphonenumber.PhoneNumber): boolean {
    try {
        return PNUtil.isValidNumberForRegion(
            phonenumber,
            "CN"
        );
    } catch (e) {
        return false;
    }
}


// format to E164 
export function formatPhoneNumberToString( phoneNumber:libphonenumber.PhoneNumber):string{
    return PNUtil.format(phoneNumber,PhoneNumberFormat.E164);
}