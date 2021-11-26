import emailAddr from "email-addresses";

export function parseEmail(input: string): string | undefined {
    const result = emailAddr.parseOneAddress({
        input,
        strict: true,
        simple: true,
    });
    switch (true) {
        case result == undefined:
            return undefined;
        case (result as any).address == undefined:
            return undefined;
        default:
            return ((result as any).address as string).toLowerCase();
    }
}
