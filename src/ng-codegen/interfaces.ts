

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
    importedDtos: Map<string, DtoImport>;
}

export interface Dto {
    name: string;
    sourceCode: string;
}

export interface DtoImport {
    name: string;
    location: string;
    id: string;
}