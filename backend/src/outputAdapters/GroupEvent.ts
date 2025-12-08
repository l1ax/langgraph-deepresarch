/**
 * @file 聚合事件，用于聚合后续的子事件
 */

import {BaseEvent} from './BaseEvent';

export class GroupEvent extends BaseEvent<GroupEvent.IContent> {
    content: GroupEvent.IContent = {
        contentType: 'text',
        data: null,
    };

    constructor(roleName: BaseEvent.RoleName) {
        super(BaseEvent.createEventType(roleName, 'group'));
    }
}

export namespace GroupEvent {
    export interface IContent extends BaseEvent.IContent {
        contentType: 'text';
        data: null;
    }
}