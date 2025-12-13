import {BaseEvent} from './BaseEvent';

export class BriefEvent extends BaseEvent<BriefEvent.IContent> {
    content: BriefEvent.IContent = {
        contentType: 'text',
        data: {
            research_brief: '',
        },
    };

    /**
     * @param deterministicId 可选的确定性 ID
     */
    constructor(deterministicId?: string) {
        super('/ai/brief', deterministicId);
    }
}

export namespace BriefEvent {
    export interface IContent extends BaseEvent.IContent {
        contentType: 'text';
        data: {
            /** 研究概要内容 */
            research_brief: string;
            /** 研究概要推理过程 */
            research_brief_reasoning?: string;
        } | string;
    }
}

