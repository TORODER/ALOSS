


export function locationToPos(locationStr: string): LongitudeLatitude | undefined {
    const locations = locationStr.split(",");
    if (locations.length == 2) {
        return [parseFloat(locations[0]), parseFloat(locations[1])];
    } else {
        return undefined;
    }
}