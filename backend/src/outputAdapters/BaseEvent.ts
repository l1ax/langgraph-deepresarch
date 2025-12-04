export abstract class BaseEvent<T extends BaseEvent.IContent> implements BaseEvent.IEvent<T> {
    constructor(public eventType: BaseEvent.EventType) {

    }

    abstract content: T;

    abstract toJSON(): Record<string, unknown>;
}

export namespace BaseEvent {
    export interface IEvent<T extends IContent> {
        /** 事件类型 */
        eventType: EventType;
        /** 事件内容 */
        content: T;
    }


    /** 事件类型 */
    export type EventType = 'clarify';

    /** 事件内容 */
    export interface IContent {
        /** 传输内容的类型 */
        contentType: 'text';
        /** 传输内容 */
        data: unknown;
    }
}
