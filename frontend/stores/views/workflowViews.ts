/**
 * @file agent 执行工作流视图
 * @author l1ax
 */

import { action, computed, observable } from "mobx";
import {AnyEvent, BaseEvent, ToolCallEvent} from '../events';
import { BaseNode, createNodeFactory, SupervisorNode } from '../nodes';
import {Edge as BaseEdge} from '../edges';
import {Node, Edge} from '@xyflow/react';
import {Graph} from '../graph';

export class WorkflowViews {
    @observable
    graph: Graph = new Graph();

    constructor() {}

    @action.bound
    transformEventsToViews(events: AnyEvent[]): void {
        this.graph.restoreDataFromEvents(events);
    }
}
