

export interface RequestMapping {
    controller: Object;
    name: string;
    method: Function;
}

export class RequestManager {

    private static mappings: Map<string, RequestMapping> = new Map();

    public static addRequestMapping(requestMapping: RequestMapping) {
        this.mappings.set(requestMapping.name, requestMapping);
    }

    public static getRequestMapping(name: string): RequestMapping {
        const mapping = this.mappings.get(name);
        if (mapping) {
            return mapping;
        }
        throw new Error(`RequestMapping '${name}' not found`);
    }

}
