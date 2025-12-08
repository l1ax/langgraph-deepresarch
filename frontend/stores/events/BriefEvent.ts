import { BaseEvent } from './BaseEvent';

/**
 * 研究概要事件
 */
export class BriefEvent extends BaseEvent<BriefEvent.IContent> {
  content: BriefEvent.IContent;

  constructor(data: BaseEvent.IEventData<BriefEvent.IData>) {
    super(data);
    this.content = data.content;
  }

  /** 研究概要内容 */
  get researchBrief(): string {
    return this.content.data.research_brief;
  }
}

export namespace BriefEvent {
  export interface IData {
    research_brief: string;
  }

  export interface IContent extends BaseEvent.IContent {
    data: IData;
  }
}

