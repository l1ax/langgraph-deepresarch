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
        super('clarify');
    }

    toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            eventType: this.eventType,
            status: this.status,
            content: this.content,
        };
    }
}

export namespace ClarifyEvent {
    export interface IContent {
        contentType: 'text';
        data: {
            need_clarification: boolean;
            question: string;
            verification: string;
        };
    }
}