import { observable } from 'mobx';
import { BaseModel } from './Model';

export default class Workbench {
    @observable
    readonly items: BaseModel[] = [];
}
