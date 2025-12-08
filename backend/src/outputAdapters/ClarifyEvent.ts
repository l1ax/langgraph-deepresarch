import {BaseEvent} from './BaseEvent';

export class ClarifyEvent extends BaseEvent<ClarifyEvent.IContent> {
    content: ClarifyEvent.IContent = {
        contentType: 'text',
        data: {
            need_clarification: false,
            question: '',
            verification: '',
        },
    };

    constructor() {
        super('/ai/clarify');
    }
}

export namespace ClarifyEvent {
    export interface IContent extends BaseEvent.IContent {
        contentType: 'text';
        data: {
            need_clarification: boolean;
            question: string;
            verification: string;
        } | string;
    }
}