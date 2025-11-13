import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TaskDetailData } from './components/task-detail-modal.component';
import { CalendarConfigService, CalendarComponentState } from './calendar-config.service';
import {
  getTaskColor,
  hasTodayTask,
  escapeHtml,
  calculatePanelPositionByElement,
  calculatePanelPositionByRect,
  calculatePanelPositionByMouseEvent,
  clearAllTimeouts,
  clearHideTimeout,
  initEventMouseHandlers,
  cleanupEventMouseHandlers,
  type TimeoutManager,
  type EventHandlerCallbacks,
  calendarEvents
} from './calendar-data-handle';

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    NzSpinModule,
    NzModalModule,
    NzButtonModule,
    NzDescriptionsModule,
    NzTagModule,
    NzDividerModule
  ],
  templateUrl: './calendar-modal.component.html',
  styleUrl: './calendar-modal.component.scss'
})
export class CalendarModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fullCalendar') calendarComponent!: FullCalendarComponent;
  private resizeObserver?: ResizeObserver;
  
  // 浮动面板相关
  showTaskIntroPanel = false; // 是否显示任务简介面板（悬停显示）
  showTaskDetailPanel = false; // 是否显示任务处理面板（点击显示）
  currentTaskData: TaskDetailData | null = null; // 当前显示的任务数据
  panelPosition = { top: '100px', left: '100px' }; // 面板位置（初始值，避免在 0,0 位置）
  panelProcessing = false; // 处理任务中
  isPanelPositionReady = false; // 面板位置是否已计算完成（用于避免闪烁）
  isPanelPositionLocked = false; // 面板位置是否已锁定（锁定后不能改变位置）
  pendingTaskData: TaskDetailData | null = null; // 等待显示的任务数据（当旧面板位置锁定时）
  pendingTaskPosition: { top: string; left: string } | null = null; // 等待显示的任务位置
  pendingTaskEventId: string | null = null; // 等待显示的任务事件ID
  
  // 定时器管理器（符合函数式编程，通过参数传递）
  timeoutManager: TimeoutManager = {
    showIntroTimeout: undefined,
    hideIntroTimeout: undefined
  };
  
  autoClickTodayTask: boolean = false; // 是否自动点击今天的任务

  // 组件状态对象（用于服务访问）
  private get componentState(): CalendarComponentState {
    return {
      // 使用 getter 方法获取最新状态
      getShowTaskIntroPanel: () => this.showTaskIntroPanel,
      getShowTaskDetailPanel: () => this.showTaskDetailPanel,
      getCurrentTaskData: () => this.currentTaskData,
      getPanelPosition: () => this.panelPosition,
      getIsPanelPositionReady: () => this.isPanelPositionReady,
      getIsPanelPositionLocked: () => this.isPanelPositionLocked,
      getPendingTaskData: () => this.pendingTaskData,
      getPendingTaskPosition: () => this.pendingTaskPosition,
      getPendingTaskEventId: () => this.pendingTaskEventId,
      timeoutManager: this.timeoutManager,
      calendarEvents: this.calendarEvents,
      cdr: this.cdr,
      ngZone: this.ngZone,
      setShowTaskIntroPanel: (value: boolean) => { this.showTaskIntroPanel = value; },
      setShowTaskDetailPanel: (value: boolean) => { this.showTaskDetailPanel = value; },
      setCurrentTaskData: (value: TaskDetailData | null) => { this.currentTaskData = value; },
      setPanelPosition: (value: { top: string; left: string }) => { this.panelPosition = value; },
      setIsPanelPositionReady: (value: boolean) => { this.isPanelPositionReady = value; },
      setIsPanelPositionLocked: (value: boolean) => { this.isPanelPositionLocked = value; },
      setPendingTaskData: (value: TaskDetailData | null) => { this.pendingTaskData = value; },
      setPendingTaskPosition: (value: { top: string; left: string } | null) => { this.pendingTaskPosition = value; },
      setPendingTaskEventId: (value: string | null) => { this.pendingTaskEventId = value; }
    };
  }

  constructor(
    private cdr: ChangeDetectorRef, 
    private ngZone: NgZone,
    private modal: NzModalService,
    private message: NzMessageService,
    private modalRef: NzModalRef,
    public calendarConfigService: CalendarConfigService
  ) {
    // 从模态框配置中获取参数
    const config = this.modalRef.getConfig();
    if (config.nzData) {
      this.autoClickTodayTask = config.nzData.autoClickTodayTask || false;
    }
    
    // 监听点击事件，点击空白处关闭任务处理面板
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('click', this.handleDocumentClick);
    });
  }
  
  //MARK:处理文档点击事件（点击空白处关闭面板）
  private handleDocumentClick = (event: MouseEvent) => {
    // 检查是否有确认弹框显示（通过检查是否有 .ant-modal-confirm 元素）
    const confirmModal = document.querySelector('.ant-modal-confirm');
    if (confirmModal) {
      // 如果有确认弹框显示，不关闭任务处理面板
      return;
    }
    
    // 检查点击的元素是否在任务处理面板内
    const target = event.target as HTMLElement;
    const taskPanel = document.querySelector('.task-detail-panel-permanent');
    
    if (taskPanel && this.showTaskDetailPanel) {
      // 如果点击的是面板内部或其子元素，不关闭
      if (taskPanel.contains(target)) {
        return;
      }
      
      // 如果点击的是任务元素，不关闭（点击任务元素会触发自己的处理逻辑）
      const clickedEvent = target.closest('.fc-event');
      if (clickedEvent) {
        return;
      }
      
      // 点击空白处，关闭面板
      this.ngZone.run(() => {
        this.closeTaskDetailPanel();
      });
    }
  }
/*
任务展示的元素:品牌、任务类型（打电话，发文章，发朋友圈，发微信）、任务描述。
*/
  // 根据任务类型和完成状态获取对应的颜色（使用外部函数）
  getTaskColor = getTaskColor;

  //MARK:检查今天是否有任务
  hasTodayTask(): boolean {
    return hasTodayTask(this.calendarEvents);
  }

  // 初始化日历事件（使用共享的默认事件数据）
  calendarEvents: EventInput[] = calendarEvents;

  isShowCalendar = false;
  
  // 转义 HTML 特殊字符，用于 title 属性（使用外部函数）
  private escapeHtml = escapeHtml;

  // 日历配置（通过服务创建）
  calendarOptions!: CalendarOptions;

  // 年月跳转相关 - 通过服务管理，但为了模板双向绑定，保留组件属性
  get selectedYear(): number {
    return this.calendarConfigService.selectedYear;
  }
  set selectedYear(value: number) {
    this.calendarConfigService.selectedYear = value;
  }

  get selectedMonth(): number {
    return this.calendarConfigService.selectedMonth;
  }
  set selectedMonth(value: number) {
    this.calendarConfigService.selectedMonth = value;
  }
  // 月份列表 - 从服务获取
  get months(): number[] {
    return this.calendarConfigService.months;
  }
  // 生成年份列表 - 从服务获取
  getYears(): number[] {
    return this.calendarConfigService.getYears();
  }
  // 获取月份名称 - 从服务获取
  getMonthName(month: number): string {
    return this.calendarConfigService.getMonthName(month);
  }
  //MARK:ngOnInit
  ngOnInit() {
    // 初始化日历配置（在构造函数后、视图初始化前）
    this.calendarOptions = this.calendarConfigService.createCalendarOptions(
      this.calendarEvents,
      {
        onEventClick: (arg) => this.calendarConfigService.handleEventClick(arg, this.componentState),
        onEventMouseEnter: (arg) => this.calendarConfigService.handleEventMouseEnter(arg, this.componentState),
        onEventMouseLeave: (arg) => this.calendarConfigService.handleEventMouseLeave(arg, this.componentState),
        escapeHtml: this.escapeHtml
      }
    );
  }
  //MARK:ngAfterViewInit
  ngAfterViewInit() {
    // 模态框打开需要时间，需要等待模态框完全渲染
    setTimeout(() => {
      //这个延迟展示日历是为了等待页面加载完成否则日历宽度有问题.
      this.isShowCalendar = true;
      // 延迟初始化鼠标事件，等待日历完全渲染
      setTimeout(() => {
        this.initEventMouseHandlers();
        // 如果需要自动点击今天的任务
        if (this.autoClickTodayTask) {
          this.calendarConfigService.autoClickTodayFirstTask(
            this.calendarComponent,
            this.calendarEvents,
            this.componentState
          );
        }
      }, 200);
    }, 100);
    
    // 监听事件渲染完成，重新初始化鼠标事件
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      api.on('eventsSet', () => {
        setTimeout(() => {
          this.initEventMouseHandlers();
          // 如果需要自动点击今天的任务
          if (this.autoClickTodayTask) {
            this.autoClickTodayFirstTask();
          }
        }, 100);
      });
      

      setTimeout(() => {
        this.initEventMouseHandlers();
        
        // 如果需要自动点击今天的任务
        if (this.autoClickTodayTask) {
          this.calendarConfigService.autoClickTodayFirstTask(
            this.calendarComponent,
            this.calendarEvents,
            this.componentState
          );
        }
      }, 600);
      
    
    }    
    // 使用 ResizeObserver 监听容器尺寸变化
    if (typeof ResizeObserver !== 'undefined') {
      const wrapper = document.querySelector('.calendar-wrapper');
      if (wrapper) {
        this.resizeObserver = new ResizeObserver(() => {
          this.updateCalendarSize();
        });
        this.resizeObserver.observe(wrapper);
      }
    }
    
    // 监听窗口大小变化，确保日历宽度正确
    window.addEventListener('resize', this.updateCalendarSize);
  }
  // 更新日历尺寸
  updateCalendarSize = () => {
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      // 触发日历重新计算尺寸
      api.updateSize();
    }
  }
  //MARK:鼠标进入任务事件（使用 FullCalendar 的 eventMouseEnter）- 已移至服务
  handleEventMouseEnter(arg: any): void {
    this.calendarConfigService.handleEventMouseEnter(arg, this.componentState);
  }
  //MARK:鼠标离开任务事件（使用 FullCalendar 的 eventMouseLeave）- 已移至服务
  handleEventMouseLeave(arg: any): void {
    this.calendarConfigService.handleEventMouseLeave(arg, this.componentState);
  }
  //MARK:点击任务事件：显示任务处理面板 - 已移至服务
  handleEventClick(arg: any): void {
    this.calendarConfigService.handleEventClick(arg, this.componentState);
  }
  //MARK:关闭任务处理面板
  closeTaskDetailPanel(): void {
    this.showTaskDetailPanel = false;
    this.currentTaskData = null;
    this.cdr.markForCheck();
  }
  //MARK:自动点击今天的第一个任务 - 已移至服务
  autoClickTodayFirstTask(): void {
    this.calendarConfigService.autoClickTodayFirstTask(
      this.calendarComponent,
      this.calendarEvents,
      this.componentState
    );
  }
  //MARK:初始化事件鼠标处理器（保留作为备用，现在主要使用 FullCalendar 的 eventMouseEnter/Leave）
  initEventMouseHandlers(): void {
    const api = this.calendarComponent?.getApi();
    if (!api) {
      return;
    }
    
    // 定义回调函数
    const callbacks: EventHandlerCallbacks = {
      onMouseEnter: (taskData: TaskDetailData, event: MouseEvent) => {
        // 如果简介面板已经显示，且是同一个任务，不更新（避免重复触发）
        if (this.showTaskIntroPanel && this.currentTaskData && 
            this.currentTaskData.taskId === taskData.taskId) {
          return; // 同一个任务，不更新
        }
        // 如果简介面板已经显示，但面板位置已锁定，也不更新
        if (this.showTaskIntroPanel && this.isPanelPositionLocked) {
          return; // 面板位置已锁定，不更新
        }
      },
      onMouseLeave: () => {
      }
    };
    
    // 使用外部函数初始化（函数式编程）
    initEventMouseHandlers(api, callbacks);
  }
  //MARK:清理事件鼠标处理器（使用外部函数）
  cleanupEventMouseHandlers = cleanupEventMouseHandlers;
  //MARK:根据元素位置更新面板位置（保持向后兼容）
  updatePanelPositionByElement(element: HTMLElement): void {
    const position = calculatePanelPositionByElement(element);
    if (position) {
      this.panelPosition = position;
    }
  }
  //MARK:根据Rect更新面板位置（保持向后兼容）
  updatePanelPositionByRect(rect: DOMRect): void {
    this.panelPosition = calculatePanelPositionByRect(rect);
  }
  //MARK:更新面板位置（使用鼠标事件，备用方案）
  updatePanelPosition(event: MouseEvent) {
    console.log("更新面板位置");
    const position = calculatePanelPositionByMouseEvent(event);
    console.log("更新面板位置-计算结果", position);
    if (position) {
      this.panelPosition = position;
      console.log("更新面板位置-更新结果", this.panelPosition);
    }
  }
  //MARK:显示等待的任务面板 - 已移至服务（私有方法，通过服务内部调用）
  
  //MARK:鼠标进入面板（简介面板）
  handleIntroPanelMouseEnter() {
    // 清除隐藏定时器（使用外部函数）
    clearHideTimeout(this.timeoutManager);
  }
  //MARK:鼠标离开面板（简介面板）- 已移至服务
  handleIntroPanelMouseLeave() {
    this.calendarConfigService.handleIntroPanelMouseLeave(this.componentState);
  }
  //MARK:处理任务确认弹框
  handleCompleteTask() {
    if (!this.currentTaskData) return;
    
    // 如果当前显示的是简介面板，关闭它
    if (this.showTaskIntroPanel) {
      this.showTaskIntroPanel = false;
    }
    
    // 显示二次确认弹框
    this.modal.confirm({
      nzTitle: '确认处理任务',
      nzContent: `确定要处理任务"${this.currentTaskData.brand}"吗？处理后将标记为已完成。`,
      nzOkText: '确认处理',
      nzCancelText: '取消',
      nzOnOk: () => {
        // 确认处理，处理成功后关闭面板
        return this.doCompleteTask().then(() => {
          // 处理成功后关闭任务处理面板
          this.closeTaskDetailPanel();
        });
      },
      nzOnCancel: () => {
        // 取消时，不关闭任务处理面板
        return;
      }
    });
  }
  //MARK:执行处理任务（确认后调用）
  private doCompleteTask(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentTaskData) {
        resolve();
        return;
      }
      
      // 保存当前任务数据的副本，避免异步操作期间数据被清空
      const taskData = { ...this.currentTaskData };
      const taskId = taskData.taskId;
      
      if (!taskId) {
        resolve();
        return;
      }
      
      this.panelProcessing = true;
      
      // 模拟异步操作
      setTimeout(() => {
        // 更新任务数据（使用保存的副本）
        taskData.isCompleted = true;
        
        // 设置处理时间和处理人
        const now = new Date();
        taskData.processedTime = now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        taskData.processedBy = '张三'; // 演示用的处理人，实际应从用户服务获取
        
        // 如果面板仍然打开，更新当前显示的数据
        if (this.currentTaskData && this.currentTaskData.taskId === taskId) {
          this.currentTaskData.isCompleted = taskData.isCompleted;
          this.currentTaskData.processedTime = taskData.processedTime;
          this.currentTaskData.processedBy = taskData.processedBy;
        }
        
        this.panelProcessing = false;
        
        // 更新日历中的事件（使用保存的副本）
        this.updateCalendarEvent(taskData);
        
        // 显示成功提示
        this.message.success('任务已完成', {
          nzDuration: 2000 // 2秒后自动关闭
        });
        
        // 触发变更检测
        this.cdr.markForCheck();
        
        resolve();
      }, 500);
    });
  }
  //MARK:任务处理后更新日历事件
  private updateCalendarEvent(updatedData: TaskDetailData) {
    if (!updatedData.taskId) return;
    // 查找并更新 calendarEvents
    const index = this.calendarEvents.findIndex((e: any) => {
      const eTaskId = e.id || (e.extendedProps as any)?.taskId;
      return eTaskId === updatedData.taskId;
    });
        if (index !== -1) {
          const originalEvent = this.calendarEvents[index] as any;
          if (originalEvent.extendedProps) {
            originalEvent.extendedProps = {
              ...originalEvent.extendedProps,
              isCompleted: true,
              processedTime: updatedData.processedTime,
              processedBy: updatedData.processedBy
            };
            originalEvent.color = this.getTaskColor(originalEvent.extendedProps.taskType, true);
      }
    }

    // 使用 FullCalendar API 更新事件
    const api = this.calendarComponent?.getApi();
    if (api) {
      const event = api.getEventById(updatedData.taskId);
      if (event) {
        const extendedProps = event.extendedProps as any;
      event.setProp('color', this.getTaskColor(extendedProps.taskType, true));
      event.setExtendedProp('isCompleted', true);
      event.setExtendedProp('processedTime', updatedData.processedTime);
      event.setExtendedProp('processedBy', updatedData.processedBy);
    }

      // 重新渲染
      api.render();
    }
  }
  //MARK:跳转年月
  gotoDate(): void {
    // 使用服务创建日期对象
    const date = this.calendarConfigService.createDateForNavigation(
      this.calendarConfigService.selectedYear,
      this.calendarConfigService.selectedMonth
    );
    
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      // 跳转到指定日期（会自动跳转到该日期所在的月份）
      api.gotoDate(date);
      // 更新日历尺寸
      this.updateCalendarSize();
    }
  }
  //MARK:跳转今天
  goToToday(): void {
    const today = this.calendarConfigService.getToday();
    this.calendarConfigService.selectedYear = today.getFullYear();
    this.calendarConfigService.selectedMonth = today.getMonth() + 1;
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      api.today();
      this.updateCalendarSize();
    }
  }
  //MARK:ngOnDestroy
  // 清理面板定时器
  ngOnDestroy() {
    // 清理定时器（使用外部函数）
    clearAllTimeouts(this.timeoutManager);
    // 移除事件监听
    window.removeEventListener('resize', this.updateCalendarSize);
    // 断开 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    // 清理鼠标事件处理器（使用外部函数）
    cleanupEventMouseHandlers();
    // 移除文档点击监听
    document.removeEventListener('click', this.handleDocumentClick);
  }

}

