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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
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
  
  // 定时器管理器（符合函数式编程，通过参数传递）
  private timeoutManager: TimeoutManager = {
    showIntroTimeout: undefined,
    hideIntroTimeout: undefined
  };
  
  constructor(
    private cdr: ChangeDetectorRef, 
    private ngZone: NgZone,
    private modal: NzModalService,
    private message: NzMessageService
  ) {
    // 监听点击事件，点击空白处关闭任务处理面板
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('click', this.handleDocumentClick);
    });
  }
  
  //MARK:处理文档点击事件（点击空白处关闭面板）
  private handleDocumentClick = (event: MouseEvent) => {
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
        isCompleted: false // 未完成
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
        isCompleted: false // 未完成
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
        isCompleted: false // 未完成
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
      }, 200);
    }, 100);
    
    // 监听事件渲染完成，重新初始化鼠标事件
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      api.on('eventsSet', () => {
        setTimeout(() => {
          this.initEventMouseHandlers();
        }, 100);
      });
      

      setTimeout(() => {
        this.initEventMouseHandlers();
      }, 600);
      
    
    }
    // setTimeout(() => {
      
    //   this.updateCalendarSize();
    // }, 100);
    
    // setTimeout(() => {
    //   this.updateCalendarSize();
    // }, 300);
    
    // setTimeout(() => {
    //   this.updateCalendarSize();
    // }, 500);
    
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
      return;
    }
    
    // 如果简介面板已经显示，检查是否应该切换任务
    if (this.showTaskIntroPanel && this.currentTaskData) {
      // 提取当前事件数据
      const { event, extendedProps, eventId } = extractEventData(arg);
      const currentTaskId = this.currentTaskData.taskId;
      const newTaskId = extendedProps.taskId || event.id || '';
      
      // 如果鼠标移入的是同一个任务，不更新（避免重复触发）
      if (currentTaskId === newTaskId) {
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
        
        // 鼠标不在面板内部，清除当前面板，让新任务开始计时
        // 先清除隐藏定时器，避免面板被隐藏
        clearHideTimeout(this.timeoutManager);
        // 清除当前面板的显示
        this.showTaskIntroPanel = false;
        this.currentTaskData = null;
        this.isPanelPositionReady = false;
        this.cdr.markForCheck();
        // 清除显示定时器，让新任务重新开始计时
        clearShowTimeout(this.timeoutManager);
      } else if (!arg.jsEvent) {
        // 如果没有鼠标事件信息，但面板显示且是不同的任务
        // 清除当前面板，让新任务开始计时
        clearHideTimeout(this.timeoutManager);
        this.showTaskIntroPanel = false;
        this.currentTaskData = null;
        this.isPanelPositionReady = false;
        this.cdr.markForCheck();
        clearShowTimeout(this.timeoutManager);
      }
    }
    
    // 清除所有定时器（使用外部函数）
    clearAllTimeouts(this.timeoutManager);
    
    // 提取事件数据（使用外部函数）
    const { event, extendedProps, eventId, eventElementId } = extractEventData(arg);
    
    // 构建任务详情数据（使用外部函数）
    const taskDetailData = buildTaskDetailData(event, extendedProps);
    
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
            if (targetElement && this.showTaskIntroPanel) {
              // 获取实际面板高度（使用外部函数）
              const actualHeight = getActualPanelHeight('.task-intro-panel', 300);
              
              // 使用实际高度计算精确位置
              const position = computePanelPosition(targetElement, null, true, actualHeight);
              
              // 如果有精确位置，使用精确位置；否则使用初始计算的预估位置
              const finalPosition = position || calculatedPosition;
              
              this.ngZone.run(() => {
                // 一次性更新位置和显示状态，避免闪烁
                this.panelPosition = finalPosition;
                // 标记位置已准备好，面板可以显示
                this.isPanelPositionReady = true;
                this.cdr.markForCheck();
              });
            } else {
              // 如果面板已关闭，标记位置已准备好（虽然不显示）
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
    
    // 清除显示定时器（使用外部函数）
    clearShowTimeout(this.timeoutManager);
    
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
        this.cdr.markForCheck();
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
  
  //MARK:初始化事件鼠标处理器（保留作为备用，现在主要使用 FullCalendar 的 eventMouseEnter/Leave）
  initEventMouseHandlers(): void {
    const api = this.calendarComponent?.getApi();
    if (!api) {
      return;
    }
    
    // 定义回调函数
    const callbacks: EventHandlerCallbacks = {
      onMouseEnter: (taskData: TaskDetailData, event: MouseEvent) => {
        this.currentTaskData = taskData;
        this.updatePanelPosition(event);
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
    const position = calculatePanelPositionByMouseEvent(event);
    if (position) {
      this.panelPosition = position;
    }
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
        this.showTaskIntroPanel = false;
        this.currentTaskData = null;
        this.isPanelPositionReady = false; // 重置位置状态
        this.cdr.markForCheck();
      }
    }, 500); // 延迟0.3秒，与任务元素移出保持一致
  }
  
  //MARK:处理任务
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
        return this.doCompleteTask();
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
  
  //MARK:更新日历事件
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
    
    // 清理定时器（已在前面清理，这里不需要重复）
    
    // 移除文档点击监听
    document.removeEventListener('click', this.handleDocumentClick);
  }
  
  // 更新任务完成后的状态（已废弃，保留以防其他地方调用）
  private updateEventAfterComplete(event: any, updatedData: TaskDetailData & { _eventBrand?: string; _eventStart?: string }): void {
    const extendedProps = event.extendedProps as any;
    
    // 通过 taskId 或 event.id 来查找对应的事件（优先使用ID）
    const taskId = updatedData.taskId || extendedProps.taskId || event.id;
    
    if (taskId) {
      const index = this.calendarEvents.findIndex((e: any) => {
        const eTaskId = e.id || (e.extendedProps as any)?.taskId;
        return eTaskId === taskId;
      });
      
      if (index !== -1) {
        // 更新 calendarEvents 数组中的原始数据（这是可写的）
        const originalEvent = this.calendarEvents[index] as any;
        if (originalEvent.extendedProps) {
          // 创建新的 extendedProps 对象，避免只读属性错误
          originalEvent.extendedProps = {
            ...originalEvent.extendedProps,
            isCompleted: true,
            processedTime: updatedData.processedTime,
            processedBy: updatedData.processedBy
          };
          originalEvent.color = this.getTaskColor(originalEvent.extendedProps.taskType, true);
          
          console.log('任务已更新:', originalEvent);
        }
      } else {
        console.warn('未找到对应的任务，taskId:', taskId);
      }
    } else {
      // 如果没有ID，使用品牌和日期匹配（备用方案）
      const eventBrand = updatedData._eventBrand || extendedProps.brand;
      const eventStart = updatedData._eventStart || (event.start ? new Date(event.start).toISOString().split('T')[0] : undefined);
      
      if (eventBrand && eventStart) {
        const index = this.calendarEvents.findIndex((e: any) => {
          const eBrand = (e.extendedProps as any)?.brand;
          const eStart = e.start ? new Date(e.start).toISOString().split('T')[0] : undefined;
          return eBrand === eventBrand && eStart === eventStart;
        });
        
        if (index !== -1) {
          const originalEvent = this.calendarEvents[index] as any;
          if (originalEvent.extendedProps) {
            // 创建新的 extendedProps 对象，避免只读属性错误
            originalEvent.extendedProps = {
              ...originalEvent.extendedProps,
              isCompleted: true,
              processedTime: updatedData.processedTime,
              processedBy: updatedData.processedBy
            };
            originalEvent.color = this.getTaskColor(originalEvent.extendedProps.taskType, true);
            
            console.log('任务已更新（通过品牌和日期匹配）:', originalEvent);
          }
        }
      }
    }

    // 使用 FullCalendar API 更新事件（不要直接修改 extendedProps，因为它是只读的）
    const api = this.calendarComponent?.getApi();
    if (api && taskId) {
      // 通过 setProp 方法更新事件属性
      event.setProp('color', this.getTaskColor(extendedProps.taskType, true));
      
      // 使用 setExtendedProp 更新 extendedProps（这是 FullCalendar 推荐的方式）
      event.setExtendedProp('isCompleted', true);
      event.setExtendedProp('processedTime', updatedData.processedTime);
      event.setExtendedProp('processedBy', updatedData.processedBy);
    }

    // 重新渲染事件
    if (api) {
      api.render();
    }
  }

  // 跳转到指定年月
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

  // 跳转到今天
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
}

