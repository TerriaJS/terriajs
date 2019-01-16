import { observable } from 'mobx';
import { BaseModel } from './Model';

export default class Workbench {
    @observable
    readonly items: BaseModel[] = [];

    removeAll() {
        while(this.items.length) {
            this.items.pop();
        }
    }
}
