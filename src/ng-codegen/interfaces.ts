

export interface ServiceMethod {
    name: string;
    path: string;
    bodyTypeName: string | null;
    bodyParameterName: string | null;
    returnTypeName: string;
}

export interface Service {
    name: string;
    methods: ServiceMethod[];
    dtos: Map<string, { name: string, location: string, id: string }>;
}