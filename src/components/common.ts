export interface SelectItem {
    display: string;
    value: string;
}

export interface Component {
    render(): HTMLElement;
    renderComponent(): void;
}

export const convertTypeToSelectItem = <T extends { id: number; name: string }>(
    input: T,
): SelectItem => {
    return {
        display: input.name,
        value: input.id.toString(),
    };
};


export const convertSelectItemToType = <T extends { id: number; name: string }>(
    input: SelectItem,
): T => {
    console.trace();
    console.log(input);
    console.log(input.value)
    return {
        id: parseInt(input.value, 10),
        name: input.display,
    } as T;
};

