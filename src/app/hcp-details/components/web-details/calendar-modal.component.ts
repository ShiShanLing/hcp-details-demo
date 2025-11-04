import { Component, AfterViewInit, ViewChild, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import zhCnLocale from '@fullcalendar/core/locales/zh-cn';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TaskDetailData } from './components/task-detail-modal.component';
import {
  TaskType,
  TaskIcon,
  TaskColor,
  getTaskColor,
  buildTaskDetailData,
  hasTodayTask,
  escapeHtml,
  calculatePanelPositionByElement,
  calculatePanelPositionByElementWithHeight,
  calculatePanelPositionByRect,
  calculatePanelPositionByMouseEvent,
  findTargetElement,
  extractEventData,
  computePanelPosition,
  getActualPanelHeight,
  clearAllTimeouts,
  clearShowTimeout,
  clearHideTimeout,
  initEventMouseHandlers,
  cleanupEventMouseHandlers,
  type TimeoutManager,
  type EventHandlerCallbacks
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
export class CalendarModalComponent implements AfterViewInit, OnDestroy {
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
  private timeoutManager: TimeoutManager = {
    showIntroTimeout: undefined,
    hideIntroTimeout: undefined
  };
  
  autoClickTodayTask: boolean = false; // 是否自动点击今天的任务

  constructor(
    private cdr: ChangeDetectorRef, 
    private ngZone: NgZone,
    private modal: NzModalService,
    private message: NzMessageService,
    private modalRef: NzModalRef
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
  calendarEvents: EventInput[] = [
    {
      id: 'task-001', // 添加唯一ID
      title: '欧乐欣', // 标题用于显示，但会被 eventContent 覆盖
      extendedProps: {
        taskId: 'task-001', // 也在 extendedProps 中保存ID
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是拜访备注-可能是没有拜访成功',
        isCompleted: false, // 未完成
        displayOrder: 0 // 跑马灯任务，优先级最高，确保显示在最上面
      },
      start: new Date().toISOString().split('T')[0],
      color: this.getTaskColor(TaskType.CallDoctor, false) // 使用配置的颜色
    },
    {
      id: 'task-1011', // 添加唯一ID
      title: '欧乐欣', // 标题用于显示，但会被 eventContent 覆盖
      extendedProps: {
        taskId: 'task-1011', // 也在 extendedProps 中保存ID
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是拜访备注-可能是没有拜访成功',
        isCompleted: false // 未完成
      },
      start: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 昨天的日期
      color: this.getTaskColor(TaskType.CallDoctor, false) // 使用配置的颜色
    },
    {
      id: 'task-2011', // 添加唯一ID
      title: '欧乐欣', // 标题用于显示，但会被 eventContent 覆盖
      extendedProps: {
        taskId: 'task-2011', // 也在 extendedProps 中保存ID
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是拜访备注-可能是没有拜访成功',
        isCompleted: false // 未完成
      },
      start: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 昨天的日期
      color: this.getTaskColor(TaskType.CallDoctor, false) // 使用配置的颜色
    },
    {
      id: 'task-3011', // 添加唯一ID
      title: '欧乐欣', // 标题用于显示，但会被 eventContent 覆盖
      extendedProps: {
        taskId: 'task-3011', // 也在 extendedProps 中保存ID
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是拜访备注-可能是没有拜访成功',
        isCompleted: false // 未完成
      },
      start: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], // 昨天的日期
      color: this.getTaskColor(TaskType.CallDoctor, false) // 使用配置的颜色
    },
    {
      id: 'task-002',
      title: '全再乐',
      extendedProps: {
        taskId: 'task-002',
        brand: '全再乐',
        icon: TaskIcon.WriteArticle,
        taskType: TaskType.WriteArticle,
        taskDescription: '这是文章备注-可能是没有文章成功',
        isCompleted: false, // 未完成
        displayOrder: 1 // 显示顺序
      },
      start: new Date().toISOString().split('T')[0],
      color: this.getTaskColor(TaskType.WriteArticle, false) // 使用配置的颜色
    },
    {
      id: 'task-003',
      title: '舒利迭',
      extendedProps: {
        taskId: 'task-003',
        brand: '舒利迭',
        icon: TaskIcon.SendWechat,
        taskType: TaskType.SendWechat,
        taskDescription: '这是微信备注-可能是没有微信成功',
        isCompleted: false // 未完成
      },
      start: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7天后的日期
      color: this.getTaskColor(TaskType.SendWechat, false) // 使用配置的颜色
    },
    {
      id: 'task-004',
      title: '测试朋友圈',
      extendedProps: {
        taskId: 'task-004',
        brand: '测试品牌',
        icon: TaskIcon.SendCircle,
        taskType: TaskType.SendCircle,
        taskDescription: '这是朋友圈备注-测试朋友圈功能',
        isCompleted: false, // 未完成
        displayOrder: 2 // 显示顺序
      },
      start: new Date().toISOString().split('T')[0],
      color: this.getTaskColor(TaskType.SendCircle, false) // 使用配置的颜色
    },
    // 已完成任务的示例
    {
      id: 'task-005',
      title: '已完成任务-欧乐欣',
      extendedProps: {
        taskId: 'task-005',
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是已完成的拜访任务',
        isCompleted: true, // 已完成
        processedTime: new Date().toLocaleString('zh-CN'),
        processedBy: '李四'
      },
      start: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 昨天的日期
      color: this.getTaskColor(TaskType.CallDoctor, true) // 灰色（已完成）
    },
  ];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: zhCnLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek' // 只保留月视图和周视图，周视图不显示时间
    },
    events: this.calendarEvents,
    editable: false, // 禁用编辑（拖拽、调整大小）
    selectable: false, // 禁用选择日期范围
    dayMaxEvents: true,
    weekends: true,
    // 事件排序：按 displayOrder 排序，确保跑马灯任务（欧乐欣）显示在最上面
    eventOrder: (a: any, b: any) => {
      const orderA = a.extendedProps?.displayOrder ?? 999;
      const orderB = b.extendedProps?.displayOrder ?? 999;
      return orderA - orderB;
    },
    height: '100%', // 使用100%填充父容器，通过CSS min-height限制最小高度
    contentHeight: 'auto', // 内容高度自动
            // 点击事件：显示任务处理面板
            eventClick: (arg) => {
              arg.jsEvent.preventDefault();
              arg.jsEvent.stopPropagation();
              this.handleEventClick(arg);
              return false;
            },
    // 鼠标悬停事件 - FullCalendar 原生支持
    eventMouseEnter: (arg) => {
      this.handleEventMouseEnter(arg);
    },
    eventMouseLeave: (arg) => {
      this.handleEventMouseLeave(arg);
    },
    // 自定义事件内容显示（多行展示）
    eventContent: (arg) => {
      const event = arg.event;
      const extendedProps = event.extendedProps as any;
      const brand = extendedProps.brand || '';
      const taskType = extendedProps.taskType || '';
      const taskDescription = extendedProps.taskDescription || '';
      const icon = extendedProps.icon || '';
      const isCompleted = extendedProps.isCompleted || false;
      
      // 创建多行内容，图标放在任务类型前面
      // 不添加 title 属性，避免显示浏览器默认的 tooltip（问号）
      const descriptionHtml = taskDescription 
        ? `<div class="fc-event-desc">${this.escapeHtml(taskDescription)}</div>` 
        : '';
      
      // 已完成标识
      const completedBadge = isCompleted ? '<span class="fc-event-completed">已完成</span>' : '';
      
      // 获取事件ID用于匹配和设置元素ID
      const eventId = extendedProps.taskId || event.id || '';
      const eventElementId = `task-event-${eventId}`;
      
      const html = `
        <div class="fc-custom-event" data-event-id="${eventId}" id="${eventElementId}">
          <div class="fc-event-brand">
            ${brand}
            ${completedBadge}
          </div>
          <div class="fc-event-type">
            ${icon ? `<i class="iconfont ${icon}"></i>` : ''}
            <span>${taskType}</span>
          </div>
          ${descriptionHtml}
        </div>
      `;
      
      return { html };
    }
  };

  isShowCalendar = false;
  
  // 年月跳转相关
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1; // 1-12
  
  // 生成年份列表（当前年份前后各10年）
  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  }
  
  // 月份列表
  months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // 获取月份名称（中文）
  getMonthName(month: number): string {
    return `${month}月`;
  }
  
  // 转义 HTML 特殊字符，用于 title 属性（使用外部函数）
  private escapeHtml = escapeHtml;

  ngAfterViewInit() {
    // 视图初始化完成后，多次延迟更新日历尺寸以确保宽度正确
    // 模态框打开需要时间，需要等待模态框完全渲染
    setTimeout(() => {
      // this.updateCalendarSize();
      this.isShowCalendar = true;
      
      // 延迟初始化鼠标事件，等待日历完全渲染
      setTimeout(() => {
        this.initEventMouseHandlers();
        
        // 如果需要自动点击今天的任务
        if (this.autoClickTodayTask) {
          this.autoClickTodayFirstTask();
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
          this.autoClickTodayFirstTask();
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

  //MARK:鼠标进入任务事件（使用 FullCalendar 的 eventMouseEnter）
  handleEventMouseEnter(arg: any): void {
    // 如果已经显示了处理面板，不显示简介面板
    if (this.showTaskDetailPanel) {
      console.log("已经显示了处理面板，不显示简介面板");
      return;
    }
    
    // 提取事件数据（使用外部函数）
    const { event, extendedProps, eventId, eventElementId } = extractEventData(arg);
    
    // 构建任务详情数据（使用外部函数）
    const taskDetailData = buildTaskDetailData(event, extendedProps);
    
    // 如果简介面板已经显示，检查是否应该切换任务
    if (this.showTaskIntroPanel && this.currentTaskData) {
      const currentTaskId = this.currentTaskData.taskId;
      const newTaskId = extendedProps.taskId || event.id || '';
      
      // 如果鼠标移入的是同一个任务，清除隐藏定时器，保持面板显示（从面板移回任务时）
      if (currentTaskId === newTaskId) {
        clearHideTimeout(this.timeoutManager); // 清除隐藏定时器，保持面板显示
        return;
      }
      
      // 如果鼠标移入的是不同任务，检查鼠标是否在简介面板内（不是附近）
      const introPanel = document.querySelector('.task-intro-panel');
      if (introPanel && arg.jsEvent) {
        const panelRect = introPanel.getBoundingClientRect();
        const mouseX = arg.jsEvent.clientX;
        const mouseY = arg.jsEvent.clientY;
        
        // 只检查鼠标是否在面板内部（不包括padding），如果在内部才阻止更新
        // 如果鼠标在面板外部（即使很近），允许更新为新任务
        if (mouseX >= panelRect.left && mouseX <= panelRect.right &&
            mouseY >= panelRect.top && mouseY <= panelRect.bottom) {
          // 鼠标在面板内部，保持显示当前任务
          return;
        }
      }
      
      // 如果旧面板还在显示（不管是位置锁定还是未锁定），都应该保存新任务数据，等待旧面板隐藏后再开始倒计时
      // 这样可以避免新面板闪烁或立即显示
      // 清除新任务的显示定时器（如果有的话）
      clearShowTimeout(this.timeoutManager);
      // 保存新任务数据，等待旧面板隐藏后再显示
      const targetElement = findTargetElement(eventId, arg.el as HTMLElement);
      const calculatedPosition = computePanelPosition(targetElement, arg.jsEvent);
      this.pendingTaskData = taskDetailData;
      this.pendingTaskPosition = calculatedPosition;
      this.pendingTaskEventId = eventId;
      // 直接返回，不开始新任务的倒计时
      return;
    }
    
    // 只清除显示定时器，不清除隐藏定时器（让旧任务的延迟隐藏正常执行）
    clearShowTimeout(this.timeoutManager);
    
    // 查找目标元素（使用外部函数）
    const targetElement = findTargetElement(eventId, arg.el as HTMLElement);
    
    // 计算面板位置（使用外部函数）
    const calculatedPosition = computePanelPosition(targetElement, arg.jsEvent);
    
    // 延迟显示简介面板
    this.timeoutManager.showIntroTimeout = window.setTimeout(() => {
      // 再次检查是否已经显示了处理面板
      if (this.showTaskDetailPanel) {
        return;
      }
      
      // 如果旧面板位置已锁定且旧面板还在显示，保存新任务数据，等待旧面板隐藏后再显示
      if (this.isPanelPositionLocked && this.showTaskIntroPanel && 
          this.currentTaskData && this.currentTaskData.taskId !== taskDetailData.taskId) {
        // 旧面板还在显示，保存新任务数据，等待旧面板隐藏后再显示
        // 不显示新面板，等待旧面板隐藏
        return;
      }
      
      // 如果旧面板已经隐藏（isPanelPositionLocked 为 false），或者当前没有面板显示，可以显示新面板
      // 再次验证任务ID是否匹配（确保是同一个任务）
      if (this.currentTaskData && this.currentTaskData.taskId !== taskDetailData.taskId && 
          this.isPanelPositionLocked) {
        // 如果任务ID不匹配且位置已锁定，说明旧面板还在显示，不显示新面板
        return;
      }
      
      // 重新查找目标元素（确保使用最新的元素位置）
      const currentTargetElement = findTargetElement(eventId, undefined);
      if (!currentTargetElement) {
        return;
      }
      
      // 更新任务数据
      this.currentTaskData = taskDetailData;
      
      // 标记位置未准备好，面板将保持不可见
      this.isPanelPositionReady = false;
      
      // 先显示面板但保持不可见（用于获取实际高度）
      // 先设置一个屏幕外的位置，避免在错误位置闪烁
      this.panelPosition = { top: '-9999px', left: '-9999px' };
      this.showTaskIntroPanel = true;
      this.cdr.markForCheck();
      
      // 使用 requestAnimationFrame 等待 DOM 渲染完成，然后计算精确位置
      this.ngZone.runOutsideAngular(() => {
        // 等待一帧，让面板渲染
        requestAnimationFrame(() => {
          // 再等待一帧，确保面板完全渲染
          requestAnimationFrame(() => {
            // 再次验证任务ID和面板状态
            if (!this.showTaskIntroPanel || !this.currentTaskData || 
                this.currentTaskData.taskId !== taskDetailData.taskId) {
              // 如果任务已改变，标记位置已准备好（虽然不显示）
              this.ngZone.run(() => {
                this.isPanelPositionReady = true;
                this.cdr.markForCheck();
              });
              return;
            }
            
            // 再次查找目标元素（确保使用最新的DOM元素）
            const finalTargetElement = findTargetElement(eventId, undefined);
            if (finalTargetElement) {
              // 获取实际面板高度（使用外部函数）
              const actualHeight = getActualPanelHeight('.task-intro-panel', 300);
              
              // 使用实际高度和最新元素计算精确位置
              const position = computePanelPosition(finalTargetElement, null, true, actualHeight);
              
              // 如果有精确位置，使用精确位置；否则使用初始计算的预估位置
              const finalPosition = position || calculatedPosition;
              
              this.ngZone.run(() => {
                // 再次验证任务ID（确保位置计算时任务没有改变）
                if (this.currentTaskData && this.currentTaskData.taskId === taskDetailData.taskId) {
                  // 一次性更新位置和显示状态，避免闪烁
                  this.panelPosition = finalPosition;
                  // 标记位置已准备好，面板可以显示
                  this.isPanelPositionReady = true;
                  // 锁定面板位置，防止后续改变
                  this.isPanelPositionLocked = true;
                  this.cdr.markForCheck();
                } else {
                  // 任务已改变，标记位置已准备好（虽然不显示）
                  this.isPanelPositionReady = true;
                  this.cdr.markForCheck();
                }
              });
            } else {
              // 如果找不到元素，标记位置已准备好（虽然不显示）
              this.ngZone.run(() => {
                this.isPanelPositionReady = true;
                this.cdr.markForCheck();
              });
            }
          });
        });
      });
    }, 700); // 延迟700毫秒
  }
  
  //MARK:鼠标离开任务事件（使用 FullCalendar 的 eventMouseLeave）
  handleEventMouseLeave(arg: any): void {
    // 如果已经显示了处理面板，不隐藏
    if (this.showTaskDetailPanel) {
      return;
    }
    
    // 提取事件数据，检查是否是等待显示的任务
    const { event, extendedProps, eventId } = extractEventData(arg);
    const leavingTaskId = extendedProps.taskId || event.id || '';
    
    // 如果当前离开的任务正是等待显示的任务，不清除倒计时（保持倒计时继续）
    // 这样可以避免快速移动时（A->B->C->D），D任务的倒计时被清除导致面板不显示
    if (this.pendingTaskData && this.pendingTaskData.taskId === leavingTaskId) {
      // 这是等待显示的任务，不清除倒计时，让它继续倒计时
      return;
    }
    
    // 如果有等待显示的任务，且倒计时已经开始（showIntroTimeout已设置）
    // 不清除倒计时，因为倒计时是针对等待显示的任务的
    // 这样可以避免快速移动时（A->B->C->D），在倒计时期间离开任务导致面板不显示
    if (this.pendingTaskData && this.timeoutManager.showIntroTimeout) {
      // 倒计时已经开始，不清除倒计时，让它继续倒计时
      // 但如果是离开等待显示的任务本身，已经在上面返回了
    } else {
      // 清除显示定时器（使用外部函数）
      clearShowTimeout(this.timeoutManager);
    }
    
    // 如果简介面板已经显示，延迟隐藏（给用户时间移动到面板上）
    if (this.showTaskIntroPanel) {
      // 延迟隐藏简介面板（如果用户没有移动到面板上）
      this.timeoutManager.hideIntroTimeout = window.setTimeout(() => {
        // 再次检查是否已经显示了处理面板
        if (this.showTaskDetailPanel) {
          return;
        }
        this.showTaskIntroPanel = false;
        this.currentTaskData = null;
        this.isPanelPositionLocked = false; // 解锁位置
        this.cdr.markForCheck();
        
        // 如果有等待显示的任务，优化：如果刚才有任务简介面板展示并隐藏了，只需要400ms就展示下一个任务面板
        if (this.pendingTaskData && this.pendingTaskPosition && this.pendingTaskEventId) {
          const pendingData = this.pendingTaskData;
          const pendingPosition = this.pendingTaskPosition;
          const pendingEventId = this.pendingTaskEventId;
          
          // 清空等待数据
          this.pendingTaskData = null;
          this.pendingTaskPosition = null;
          this.pendingTaskEventId = null;
          
          // 优化：旧面板刚隐藏，直接开始短倒计时（400ms），不需要额外缓冲
          const targetElement = findTargetElement(pendingEventId, undefined);
          if (targetElement) {
            // 开始新任务的倒计时（缩短为400ms，因为旧面板已经隐藏）
            this.timeoutManager.showIntroTimeout = window.setTimeout(() => {
              if (!this.showTaskDetailPanel && 
                  (!this.currentTaskData || this.currentTaskData.taskId === pendingData.taskId)) {
                this.showPendingTaskPanel(pendingData, pendingPosition, pendingEventId);
              }
            }, 400); // 优化：缩短为400ms，因为旧面板已经隐藏
          }
        }
      }, 300); // 延迟0.3秒，快速响应
    } else {
      // 如果面板还没显示，清除显示定时器即可
      clearShowTimeout(this.timeoutManager);
    }
  }
  
  //MARK:点击任务事件：显示任务处理面板
  handleEventClick(arg: any): void {
    // 清除所有定时器（使用外部函数）
    clearAllTimeouts(this.timeoutManager);
    
    // 隐藏简介面板
    this.showTaskIntroPanel = false;
    
    // 提取事件数据（使用外部函数）
    const { event, extendedProps, eventId } = extractEventData(arg);
    
    // 构建任务详情数据（使用外部函数）
    const taskDetailData = buildTaskDetailData(event, extendedProps);
    this.currentTaskData = taskDetailData;
    
    // 查找目标元素（使用外部函数）
    const targetElement = findTargetElement(eventId, arg.el as HTMLElement);
    
    // 计算位置（使用外部函数）
    const calculatedPosition = computePanelPosition(targetElement, arg.jsEvent);
    
    // 显示处理面板
    this.panelPosition = calculatedPosition;
    this.showTaskDetailPanel = true;
    
    this.cdr.markForCheck();
    
    // 在下一帧使用实际面板高度微调位置（特别是上方位置）
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        if (targetElement && this.showTaskDetailPanel) {
          // 获取实际面板高度（使用外部函数）
          const actualHeight = getActualPanelHeight('.task-detail-panel-permanent', 300);
          
          // 使用实际高度重新计算位置
          const position = computePanelPosition(targetElement, null, true, actualHeight);
          if (position) {
            this.ngZone.run(() => {
              this.panelPosition = position;
              this.cdr.markForCheck();
            });
          }
        }
      });
    });
  }
  
  //MARK:关闭任务处理面板
  closeTaskDetailPanel(): void {
    this.showTaskDetailPanel = false;
    this.currentTaskData = null;
    this.cdr.markForCheck();
  }

  //MARK:自动点击今天的第一个任务
  autoClickTodayFirstTask(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // 查找今天的任务
    const todayEvents = this.calendarEvents.filter((event: any) => {
      if (!event.start) return false;
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      const eventDateStr = eventDate.toISOString().split('T')[0];
      return eventDateStr === todayStr;
    });
    
    if (todayEvents.length > 0) {
      // 选择第一个任务
      const firstEvent = todayEvents[0];
      const eventId = firstEvent.id || firstEvent.extendedProps?.['taskId'];
      
      if (eventId && this.calendarComponent?.getApi()) {
        const api = this.calendarComponent.getApi();
        const event = api.getEventById(eventId);
        
        if (event) {
          // 等待一小段时间确保DOM完全渲染
          setTimeout(() => {
            // 查找对应的DOM元素
            const eventElement = document.querySelector(`[data-event-id="${eventId}"], .fc-event[data-event-id="${eventId}"]`);
            if (!eventElement) {
              // 如果找不到，尝试通过FullCalendar的API获取
              const allEventElements = document.querySelectorAll('.fc-event');
              for (let i = 0; i < allEventElements.length; i++) {
                const el = allEventElements[i] as HTMLElement;
                const elEvent = api.getEventById(el.getAttribute('data-event-id') || '');
                if (elEvent && elEvent.id === eventId) {
                  // 创建模拟的点击事件
                  const mockEvent = {
                    event: event,
                    el: el,
                    jsEvent: new MouseEvent('click', { bubbles: true, cancelable: true }),
                    view: api.view
                  };
                  this.handleEventClick(mockEvent);
                  return;
                }
              }
            } else {
              // 创建模拟的点击事件
              const mockEvent = {
                event: event,
                el: eventElement,
                jsEvent: new MouseEvent('click', { bubbles: true, cancelable: true }),
                view: api.view
              };
              this.handleEventClick(mockEvent);
            }
          }, 300);
        }
      }
    }
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
        // 否则更新（这个回调主要用于备用方案，现在主要使用 FullCalendar 的 eventMouseEnter）
        // this.currentTaskData = taskData;
        // this.updatePanelPosition(event);
      },
      onMouseLeave: () => {
        // 已废弃，现在使用 FullCalendar 的 eventMouseLeave
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
  
  //MARK:显示等待的任务面板
  private showPendingTaskPanel(
    taskDetailData: TaskDetailData,
    calculatedPosition: { top: string; left: string },
    eventId: string
  ): void {
    // 重新查找目标元素（确保使用最新的元素位置）
    const currentTargetElement = findTargetElement(eventId, undefined);
    if (!currentTargetElement) {
      return;
    }
    
    // 更新任务数据
    this.currentTaskData = taskDetailData;
    
    // 标记位置未准备好，面板将保持不可见
    this.isPanelPositionReady = false;
    
    // 先显示面板但保持不可见（用于获取实际高度）
    // 先设置一个屏幕外的位置，避免在错误位置闪烁
    this.panelPosition = { top: '-9999px', left: '-9999px' };
    this.showTaskIntroPanel = true;
    this.cdr.markForCheck();
    
    // 使用 requestAnimationFrame 等待 DOM 渲染完成，然后计算精确位置
    this.ngZone.runOutsideAngular(() => {
      // 等待一帧，让面板渲染
      requestAnimationFrame(() => {
        // 再等待一帧，确保面板完全渲染
        requestAnimationFrame(() => {
          // 再次验证任务ID和面板状态
          if (!this.showTaskIntroPanel || !this.currentTaskData || 
              this.currentTaskData.taskId !== taskDetailData.taskId) {
            // 如果任务已改变，标记位置已准备好（虽然不显示）
            this.ngZone.run(() => {
              this.isPanelPositionReady = true;
              this.cdr.markForCheck();
            });
            return;
          }
          
          // 再次查找目标元素（确保使用最新的DOM元素）
          const finalTargetElement = findTargetElement(eventId, undefined);
          if (finalTargetElement) {
            // 获取实际面板高度（使用外部函数）
            const actualHeight = getActualPanelHeight('.task-intro-panel', 300);
            
            // 使用实际高度和最新元素计算精确位置
            const position = computePanelPosition(finalTargetElement, null, true, actualHeight);
            
            // 如果有精确位置，使用精确位置；否则使用初始计算的预估位置
            const finalPosition = position || calculatedPosition;
            
            this.ngZone.run(() => {
              // 再次验证任务ID（确保位置计算时任务没有改变）
              if (this.currentTaskData && this.currentTaskData.taskId === taskDetailData.taskId) {
                // 一次性更新位置和显示状态，避免闪烁
                this.panelPosition = finalPosition;
                // 标记位置已准备好，面板可以显示
                this.isPanelPositionReady = true;
                // 锁定面板位置，防止后续改变
                this.isPanelPositionLocked = true;
                this.cdr.markForCheck();
              } else {
                // 任务已改变，标记位置已准备好（虽然不显示）
                this.isPanelPositionReady = true;
                this.cdr.markForCheck();
              }
            });
          } else {
            // 如果找不到元素，标记位置已准备好（虽然不显示）
            this.ngZone.run(() => {
              this.isPanelPositionReady = true;
              this.cdr.markForCheck();
            });
          }
        });
      });
    });
  }
  
  //MARK:鼠标进入面板（简介面板）
  handleIntroPanelMouseEnter() {
    // 清除隐藏定时器（使用外部函数）
    clearHideTimeout(this.timeoutManager);
  }
  //MARK:鼠标离开面板（简介面板）
  handleIntroPanelMouseLeave() {
    // 延迟隐藏简介面板（参考 tooltip 的实现，立即隐藏）
    this.timeoutManager.hideIntroTimeout = window.setTimeout(() => {
      if (!this.showTaskDetailPanel) {
        // 在隐藏旧面板之前，先清除可能正在进行的显示定时器
        // 这样可以避免新任务的倒计时与旧面板隐藏逻辑冲突
        clearShowTimeout(this.timeoutManager);
        
        this.showTaskIntroPanel = false;
        this.currentTaskData = null;
        this.isPanelPositionReady = false; // 重置位置状态
        this.isPanelPositionLocked = false; // 解锁位置
        this.cdr.markForCheck();
        
        // 如果有等待显示的任务，优化：如果刚才有任务简介面板展示并隐藏了，只需要400ms就展示下一个任务面板
        if (this.pendingTaskData && this.pendingTaskPosition && this.pendingTaskEventId) {
          const pendingData = this.pendingTaskData;
          const pendingPosition = this.pendingTaskPosition;
          const pendingEventId = this.pendingTaskEventId;
          
          // 清空等待数据
          this.pendingTaskData = null;
          this.pendingTaskPosition = null;
          this.pendingTaskEventId = null;
          
          // 优化：旧面板刚隐藏，直接开始短倒计时（400ms），不需要额外缓冲
          const targetElement = findTargetElement(pendingEventId, undefined);
          if (targetElement) {
            // 开始新任务的倒计时（缩短为400ms，因为旧面板已经隐藏）
            this.timeoutManager.showIntroTimeout = window.setTimeout(() => {
              // 再次检查：如果又有了新的等待任务，或者面板已经显示，不显示当前这个
              if (this.showTaskDetailPanel || this.showTaskIntroPanel) {
                return;
              }
              if (this.pendingTaskData && this.pendingTaskData.taskId !== pendingData.taskId) {
                return;
              }
              if (!this.currentTaskData || this.currentTaskData.taskId === pendingData.taskId) {
                this.showPendingTaskPanel(pendingData, pendingPosition, pendingEventId);
              }
            }, 400); // 优化：缩短为400ms，因为旧面板已经隐藏
          }
        }
      }
    }, 500); // 延迟0.5秒，与任务元素移出保持一致
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
    // 创建日期对象（设置为该月第一天）
    const date = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    
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
    const today = new Date();
    this.selectedYear = today.getFullYear();
    this.selectedMonth = today.getMonth() + 1;
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      api.today();
      this.updateCalendarSize();
    }
  }

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

