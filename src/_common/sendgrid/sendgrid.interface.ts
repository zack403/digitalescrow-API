export interface SendgridData {
    to: string;
    from: string;
    templateId: string;
    dynamicTemplateData?: any;
    subject?: string;
    text?: string;
}