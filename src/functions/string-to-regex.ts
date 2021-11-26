export function stringToRegexFuzzy(rawSting:string,fuzzy=4){
    return rawSting.split("").map(regexTransform).join(`[\\S\\s]{0,${fuzzy}}`);
}
const transformRawChar=[
    "[",
    "]",
    "\\",
    "^",
    "$",
    ".",
    "|",
    "?",
    "*",
    "+",
    "(",
    ")"
];
export function regexTransform(v:string){
    if(transformRawChar.indexOf(v)!=-1){
        return `\\${v}`;
    }else{
        return v;
    }
}