export function buildTestCode(options: { testCode: string }) {
    return `
    <div>
    Hello friend This is your verification code email
    </div>
    <div>
        TestCode:<span>${options.testCode}</span>
    </div>
    `;
}
