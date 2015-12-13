import {NgFor, NgIf, Component, Directive, View, ElementRef, Inject} from 'angular2/angular2';

import * as Rx from 'rxjs/Rx.KitchenSink'

import {RuleActionComponent} from './rule-action-component';
import {ConditionGroupComponent} from './rule-condition-group-component';

import {InputToggle} from '../../../view/components/input/toggle/InputToggle'
import {ApiRoot} from '../../../api/persistence/ApiRoot';

import {RuleService, RuleModel} from "../../../api/rule-engine/Rule";
import {ActionService, ActionModel} from "../../../api/rule-engine/Action";
import {CwChangeEvent} from "../../../api/util/CwEvent";
import {EntityMeta} from "../../../api/persistence/EntityBase";
import {ConditionGroupModel, ConditionGroupService} from "../../../api/rule-engine/ConditionGroup";

import {Dropdown, DropdownModel, DropdownOption} from "../semantic/modules/dropdown/dropdown";
import {InputText} from "../semantic/elements/input-text/input-text";
import {ActionTypeModel} from "../../../api/rule-engine/ActionType";

var rsrc = {
  fireOn: {
    EVERY_PAGE: 'Every Page',
    ONCE_PER_VISIT: 'Once per visit',
    ONCE_PER_VISITOR: 'Once per visitor',
    EVERY_REQUEST: 'Every Request'
  }
}

@Component({
  selector: 'rule',
  properties: ["rule", "hidden"]
})
@View({
  template: `<div flex layout="column" class="cw-rule" [class.cw-hidden]="hidden" [class.cw-disabled]="!rule.enabled">
  <div flex="grow" layout="row" layout-align="space-between-center" class="cw-header" *ngIf="!hidden" (click)="toggleCollapsed()">
    <div flex="70" layout="row" layout-align="start-center" class="cw-header" *ngIf="!hidden">
      <i flex="none" class="caret icon cw-rule-caret large" [class.right]="collapsed" [class.down]="!collapsed" aria-hidden="true"></i>
      <cw-input-text flex="70"
                      class="cw-rule-name-input"
                     (change)="handleRuleNameChange($event.target.value)"
                     (focus)="collapsed = false"
                     (click)="$event.stopPropagation()"
                     [name]="ruleNameInputTextModel.name">
                     [placeholder]="ruleNameInputTextModel.placeholder"
                     [value]="ruleNameInputTextModel.value">
      </cw-input-text>
      <span class="cw-fire-on-label">{{rsrc.inputs.fireOn.label}}</span>
      <cw-input-dropdown flex="none" class="cw-fire-on-dropdown" [model]="fireOnDropdown" (change)="handleFireOnDropdownChange($event)" (click)="$event.stopPropagation()"></cw-input-dropdown>
    </div>
    <div flex="30" layout="row" layout-align="end-center" class="cw-header" *ngIf="!hidden">
      <cw-toggle-input class="cw-input"
                        [on-text]="rsrc.inputs.onOff.on.label"
                        [off-text]="rsrc.inputs.onOff.off.label"
                       [value]="rule.enabled"
                       (toggle)="rule.enabled = $event.target.value"
                       (click)="$event.stopPropagation()">
      </cw-toggle-input>
      <div class="cw-btn-group">
        <div class="ui basic icon buttons">
          <button class="ui button" aria-label="Delete Rule" (click)="removeRule($event)">
            <i class="trash icon"></i>
          </button>
          <button class="ui button" arial-label="Add Group" (click)="addGroup(); collapsed=false; $event.stopPropagation()" [disabled]="!rule.isPersisted()">
            <i class="plus icon" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div flex layout="column" class="cw-accordion-body" [class.cw-hidden]="collapsed">
    <condition-group flex="grow" layout="row" *ng-for="var group of groups; var i=index"
                     [rule]="rule"
                     [group]="group"
                     [group-index]="i"></condition-group>
    <div flex layout="column" layout-align="center-start" class="cw-action-separator">
      {{rsrc.inputs.action.firesActions}}
    </div>
    <div flex="100" layout="column" class="cw-rule-actions">
      <div flex layout="row" layout-align="space-between-center" class="cw-action-row" *ng-for="var action of actions; var i=index">
        <div flex layout="row" layout-align="start-center"  layout-fill>
          <rule-action flex [action]="action"></rule-action>
        </div>
        <div flex="0" layout="row" layout-align="end-center">
          <div class="cw-spacer cw-add-condition" *ngIf="i !== (actions.length - 1)"></div>
          <div class="cw-btn-group" *ngIf="i === (actions.length - 1)">
            <div class="ui basic icon buttons">
              <button class="cw-button-add-item ui small basic button" arial-label="Add Action" (click)="addAction();" [disabled]="!action.isPersisted()">
                <i class="plus icon" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

`,
  directives: [InputToggle, RuleActionComponent, ConditionGroupComponent, NgIf, NgFor, InputText, Dropdown]
})
class RuleComponent {
  _rule:RuleModel
  actions:Array<ActionModel>
  groups:Array<ConditionGroupModel>

  hidden:boolean
  collapsed:boolean

  elementRef:ElementRef
  rsrc:any
  private ruleService:RuleService
  private actionService:ActionService
  private groupService:ConditionGroupService

  private actionStub:ActionModel
  private actionStubWatch:Rx.Subscription<ActionModel>
  private ruleNameInputTextModel:any
  private fireOnDropdown:DropdownModel
  private _groupStub:ConditionGroupModel;


  constructor(elementRef:ElementRef,
              ruleService:RuleService,
              actionService:ActionService,
              conditionGroupService:ConditionGroupService) {
    this.rsrc = ruleService.rsrc
    ruleService.onResourceUpdate.subscribe((messages)=>{
      this.rsrc = messages
    })
    this.elementRef = elementRef
    this.actionService = actionService
    this.ruleService = ruleService;
    this.groupService = conditionGroupService;

    this.groups = []
    this.actions = []

    this.hidden = false
    this.collapsed = true


    var fireOnOptions = [
      new DropdownOption('EVERY_PAGE', 'EVERY_PAGE', this.rsrc.inputs.fireOn.options.EveryPage),
      new DropdownOption('ONCE_PER_VISIT', 'ONCE_PER_VISIT', this.rsrc.inputs.fireOn.options.OncePerVisit),
      new DropdownOption('ONCE_PER_VISITOR', 'ONCE_PER_VISITOR', this.rsrc.inputs.fireOn.options.OncePerVisitor),
      new DropdownOption('EVERY_REQUEST', 'EVERY_REQUEST', this.rsrc.inputs.fireOn.options.EveryRequest),
    ]
    this.fireOnDropdown = new DropdownModel('fireOn', "Select One", ['EVERY_PAGE'], fireOnOptions)

    this.ruleNameInputTextModel = {placeholder: this.rsrc.inputs.name.placeholder}
    //this.ruleNameInputTextModel.validate = (newValue:string)=> {
    //  if (!newValue) {
    //    throw new Error("Required Field")
    //  }
    //}
  }

  onInit() {
    if (!this.rule.isPersisted()) {
      var el:Element = this.elementRef.nativeElement
      window.setTimeout(function () {
        var els:any = el.getElementsByClassName('cw-rule-name-input')
        els = els[0] ? els[0].getElementsByTagName('input') : []
        if (els[0]) {
          els[0]['focus']();
        }
      }, 50) //avoid tick recursively error
    }
  }

  set rule(rule:RuleModel) {
    if (!this.rule || this.rule.key !== rule.key) {
      this._rule = rule
      this.groups = []
      this.actions = []
      this.actionService.onAdd.subscribe((action:ActionModel) => this.handleActionAdd(action), (err) => this.handleActionAddError(err))
      this.actionService.onRemove.subscribe((action:ActionModel) => this.handleActionRemove(action), (err) => this.handleActionRemoveError(err))
      this.groupService.onAdd.subscribe((group:ConditionGroupModel) => this.handleGroupAdd(group), (err) => this.handleGroupAddError(err))
      this.groupService.onRemove.subscribe((group:ConditionGroupModel) => this.handleGroupRemove(group), (err) => this.handleGroupRemoveError(err))
      this.actionService.list(this.rule)
      this.groupService.list(this.rule)
      this.ruleNameInputTextModel.value = rule.name
      this.fireOnDropdown.selected = [rule.fireOn]
      if (Object.keys(rule.actions).length === 0) {
        this.addAction()
      }
      if (Object.keys(rule.groups).length === 0) {
        this.addGroup()
      }
      if(this.rule.name == ''){
        this.collapsed = false
      }

    }
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed
  }

  get rule():RuleModel {
    return this._rule
  }

  handleFireOnDropdownChange(event:any) {
    this.rule.fireOn = event.value
  }

  handleRuleNameChange(name:string) {
    this.rule.name = name
  }

  addGroup() {
    this._groupStub = new ConditionGroupModel()
    this._groupStub.priority = this.groups.length ? this.groups[this.groups.length - 1].priority + 1 : 1
    this._groupStub.operator = 'AND'
    this._groupStub.owningRule = this.rule
    this.groups.push(this._groupStub)
    /* Groups are persisted when a Condition is added to them. */
  }

  addAction() {
    this.actionStub = new ActionModel(null, new ActionTypeModel())
    this.actionStub.owningRule = this.rule
    this.actions.push(this.actionStub)

    // @todo ggranum
    //this.actionStubWatch = this.actionStub.onChange.subscribe((vcEvent:CwChangeEvent<ActionModel>)=> {
    //  if (vcEvent.target.isValid()) {
    //    this.actionService.add(this.actionStub)
    //  }
    //})
  }

  handleActionAdd(action:ActionModel) {
    if (action.owningRule.key === this.rule.key) {
      if (action == this.actionStub) {
        this.actionStub = null
        this.actionStubWatch.unsubscribe()
      } else if (this.actions.indexOf(action) == -1) {
        this.actions.push(action)
      }
    }
  }

  handleActionAddError(err:any) {
    console.log("Error: ", err)
    throw err
  }

  handleActionRemove(action:ActionModel) {
    this.actions = this.actions.filter((aryAction)=> {
      return aryAction.key != action.key
    })
    if (this.actions.length === 0) {
      this.addAction()
    }
  }

  handleActionRemoveError(err:any) {
    console.log("Error: ", err)
    throw err
  }


  handleGroupAdd(group:ConditionGroupModel) {
    if (group.owningRule.key === this.rule.key) {
      if (group == this._groupStub) {
        this._groupStub = null

      } else if (this.groups.indexOf(group) == -1) {
        this.groups.push(group)
        this.groups.sort(function (a, b) {
          return a.priority - b.priority;
        });
      }
    }
  }

  handleGroupAddError(err:any) {
    console.log("Error: ", err)
    throw err
  }

  handleGroupRemove(group:ConditionGroupModel) {
    this.groups = this.groups.filter((aryGroup)=> {
      return aryGroup.key != group.key
    })
    if (this.groups.length === 0) {
      this.addGroup()
    }
  }

  handleGroupRemoveError(err:any) {
    console.log("Error: ", err)
    throw err
  }

  removeRule(event:any) {
    if ((event.altKey && event.shiftKey) || confirm('Are you sure you want delete this rule?')) {
      event.stopPropagation()
      this.ruleService.remove(this.rule)
    }
  }
}

export {RuleComponent}