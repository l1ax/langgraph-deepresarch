import {BaseEvent} from './BaseEvent';

export class BriefEvent extends BaseEvent<BriefEvent.IContent> {
    content: BriefEvent.IContent = {
        contentType: 'text',
        data: {
            research_brief: '',
        },
    };

    constructor() {
        super('brief');
    }

    toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            eventType: this.eventType,
            content: this.content,
        };
    }
}

export namespace BriefEvent {
    export interface IContent {
        contentType: 'text';
        data: {
            /** 研究概要内容 */
            research_brief: string;
        };
    }
}

