

export interface RequestMapping {
    controller: Object;
    name: string;
    method: Function;
}

export class RequestManager {

    private static mappings: Set<RequestMapping> = new Set();

    public static addRequestMapping(requestMapping: RequestMapping) {
        this.mappings.add(requestMapping);
    }

    public static getRequestMappings(): RequestMapping[] {
        return Array.from(this.mappings);
    }

}
