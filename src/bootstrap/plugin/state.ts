declare global{
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface State{}
}


export async function initState():Promise<State>{
    const baseState=Object.create(null);
    return baseState as State;
}