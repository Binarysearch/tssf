import { Service, ServiceMethod } from "./interfaces";
import { camelCaseToDash } from "./util";

export class ServiceSourceGenerator {

    constructor(private service: Service) { }

    public generate(): string {
        let methodsCode = this.service.methods.map(method => this.createMethodCode(method)).reduce((prev, curr) => {
            return `
                ${prev}
                ${curr}
            `;
        }, '');

        let dtoImports = this.createImportsCode(this.service.dtos);

        return `
${dtoImports}
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
    
@Injectable({ providedIn: 'root' })
export class ${this.service.name} {
    ${methodsCode}
}
        `;
    }

    private createMethodCode(method: ServiceMethod): string {
        return `
    public ${method.name}(${method.bodyParameterName}: ${method.bodyTypeName}): Observable<${method.returnTypeName}> {
        const path = '${method.path}';
    }
        `;
    }

    private createImportsCode(dtos: Map<string, { name: string; location: string; id: string; }>): string {
        let result = '';

        dtos.forEach(dto => {
            result = result + `
import { ${dto.name} } from '../dtos/${camelCaseToDash(dto.name)}';`;
        });

        return result
    }
}



