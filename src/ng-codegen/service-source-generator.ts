import { Service, ServiceMethod, DtoImport } from "./interfaces";
import { camelCaseToDash, format } from "./util";
import { METHOD_TEMPLATE } from "./templates/method";
import { SERVICE_TEMPLATE } from "./templates/service";


export class ServiceSourceGenerator {

    constructor(private service: Service) { }

    public generate(): string {
        const methodsCode = this.generateMethodsCode();

        const dtoImports = this.createImportsCode(this.service.importedDtos);

        return format(
            SERVICE_TEMPLATE,
            dtoImports,
            this.service.name,
            methodsCode
        );
    }

    private generateMethodsCode() {
        return this.service.methods
            .map(method => this.createMethodCode(method))
            .reduce((prev, curr) => `${prev}${curr}`, '');
    }

    private createMethodCode(method: ServiceMethod): string {
        return format(
            METHOD_TEMPLATE, 
            method.name, 
            method.bodyParameterName, 
            method.bodyTypeName, 
            method.returnTypeName,
            method.returnTypeName,
            method.path,
            method.bodyParameterName
        );
    }

    private createImportsCode(dtos: Map<string, DtoImport>): string {
        let result = '';

        dtos.forEach(dto => {
            result = result + `import { ${dto.name} } from '../dtos/${camelCaseToDash(dto.name)}';\n`;
        });

        return result
    }
}



