import { BaseEvent } from './BaseEvent';

/**
 * 澄清事件
 */
export class ClarifyEvent extends BaseEvent<ClarifyEvent.IContent> {
  content: ClarifyEvent.IContent;

  constructor(data: BaseEvent.IEventData<ClarifyEvent.IData>) {
    super(data);
    this.content = data.content;
  }

  /** 是否需要澄清 */
  get needClarification(): boolean {
    return this.content.data.need_clarification;
  }

  /** 澄清问题 */
  get question(): string {
    return this.content.data.question;
  }

  /** 验证信息 */
  get verification(): string {
    return this.content.data.verification;
  }
}

export namespace ClarifyEvent {
  export interface IData {
    need_clarification: boolean;
    question: string;
    verification: string;
  }

  export interface IContent extends BaseEvent.IContent {
    data: IData;
  }
}

