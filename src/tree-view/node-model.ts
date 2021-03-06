import {computedFrom, observable} from 'aurelia-binding';
import {getLogger, Logger} from 'aurelia-logging';
import {TaskQueue} from 'aurelia-task-queue';
import {DataSourceApi} from './data-source';
import {TreeNode} from './tree-node';

export class NodeModel {
    children: NodeModel[] | null;
    childrenGetter: (() => Promise<any[]>) | null;
    dataSourceApi: DataSourceApi;
    element: TreeNode;
    isExpanded: boolean;
    isFocused: boolean;
    isLoading: boolean;
    @observable() isSelected: boolean;
    isVisible: boolean;
    log: Logger;
    parent: NodeModel | null;
    payload: any;
    taskQueue: TaskQueue;

    private suspendEvents = false;

    constructor(parent?: NodeModel | null, children?: NodeModel[] | null, childrenGetter?: (() => Promise<any[]>), payload?: any) {
        this.log = getLogger('aurelia-tree-view/node-model');
        this.suspendEvents = true;
        this.children = children || null;
        this.childrenGetter = childrenGetter || null;
        this.parent = parent || null;
        this.payload = payload || null;

        this.isExpanded = false;
        this.isFocused = false;
        this.isLoading = false;
        this.isSelected = false;
        this.isVisible = true;
        this.suspendEvents = false;
    }

    @computedFrom('children')
    get hasChildren(): boolean {
        let result = false;
        if (this.children) {
            result = this.children.length > 0;
        } else if (this.childrenGetter) {
            // has a childrenGetter, so children state is undefined
            result = true;
        }
        return result;
    }

    collapse(force: boolean = false) {
        if (this.children && (this.isExpanded || force)) {
            this.children.forEach(child => {
                child.isVisible = false;
            });
            this.isExpanded = false;
        }
        return Promise.resolve();
    }

    expand(force: boolean = false): Promise<void> {
        if (!this.isExpanded || force) {
            this.log.debug('expand called', this.payload);
            let promise: Promise<any>;
            if (this.childrenGetter) {
                this.isLoading = true;
                promise = this.childrenGetter();
            } else {
                promise = Promise.resolve();
            }
            return promise.then(() => {
                this.isLoading = false;
                if (this.children) {
                    this.children.forEach(child => {
                        child.isVisible = true;
                    });
                }
                this.isExpanded = true;
            });
        }
        return Promise.resolve();
    }

    isSelectedChanged(newValue: boolean) {
        if (!this.suspendEvents) {
            if (this.element) {
                this.element.isSelected = newValue;
            } else {
                this.log.warn('element is not defined yet - use TaskQueue - ', (this.payload ? this.payload.title : 'no payload!'));
                this.log.warn('local taskQueue', this.taskQueue);
            }
        }
    }
}
