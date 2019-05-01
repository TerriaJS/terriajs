import { observable } from 'mobx';
import { BaseModel } from './Model';
import isDefined from '../Core/isDefined';

export default class Workbench {
    @observable
    readonly items: BaseModel[] = [];

    removeItem(item: BaseModel) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1)
        }
    }

    removeAll() {
        while(this.items.length) {
            this.items.pop();
        }
    }
}
