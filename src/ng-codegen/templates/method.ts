
export const METHOD_TEMPLATE = `
    public %s(%s: %s): Observable<%s> {
        return this.api.request<%s>('%s', %s);
    }
`;