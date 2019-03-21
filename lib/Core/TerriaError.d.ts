export = TerriaError;

declare class TerriaError {
    sender?: Object;
    title: string;
    message?: string;
    raisedToUser: boolean

    constructor(options: Pick<TerriaError, "sender" | "title" | "message">);
}
