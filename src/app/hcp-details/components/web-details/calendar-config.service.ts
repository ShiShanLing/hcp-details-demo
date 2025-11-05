import { Injectable } from '@angular/core';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhCnLocale from '@fullcalendar/core/locales/zh-cn';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { TaskDetailData } from './components/task-detail-modal.component';
import {
  extractEventData,
  buildTaskDetailData,
  findTargetElement,
  computePanelPosition,
  getActualPanelHeight,
  clearAllTimeouts,
  clearShowTimeout,
  clearHideTimeout,
  type TimeoutManager
} from './calendar-data-handle';

// 事件回调接口
export interface CalendarEventCallbacks {
  onEventClick?: (arg: any) => void;
  onEventMouseEnter?: (arg: any) => void;
  onEventMouseLeave?: (arg: any) => void;
  escapeHtml?: (text: string) => string;
}

// 组件状态接口（用于服务访问组件状态）
export interface CalendarComponentState {
  // 面板状态（通过 getter 获取最新值）
  getShowTaskIntroPanel(): boolean;
  getShowTaskDetailPanel(): boolean;
  getCurrentTaskData(): TaskDetailData | null;
  getPanelPosition(): { top: string; left: string };
  getIsPanelPositionReady(): boolean;
  getIsPanelPositionLocked(): boolean;
  
  // 等待状态（通过 getter 获取最新值）
  getPendingTaskData(): TaskDetailData | null;
  getPendingTaskPosition(): { top: string; left: string } | null;
  getPendingTaskEventId(): string | null;
  
  // 定时器管理（直接引用）
  timeoutManager: TimeoutManager;
  
  // 日历事件（直接引用）
  calendarEvents: EventInput[];
  
  // Angular 依赖（直接引用）
  cdr: ChangeDetectorRef;
  ngZone: NgZone;
  
  // 状态更新方法
  setShowTaskIntroPanel(value: boolean): void;
  setShowTaskDetailPanel(value: boolean): void;
  setCurrentTaskData(value: TaskDetailData | null): void;
  setPanelPosition(value: { top: string; left: string }): void;
  setIsPanelPositionReady(value: boolean): void;
  setIsPanelPositionLocked(value: boolean): void;
  setPendingTaskData(value: TaskDetailData | null): void;
  setPendingTaskPosition(value: { top: string; left: string } | null): void;
  setPendingTaskEventId(value: string | null): void;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarConfigService {
  // 年月跳转相关状态
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1; // 1-12
  
  // 月份列表
  readonly months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  constructor() {}

  /**
   * 生成年份列表（当前年份前后各10年）
   */
  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  }

  /**
   * 获取月份名称（中文）
   */
  getMonthName(month: number): string {
    return `${month}月`;
  }

  /**
   * 创建日历配置
   * @param events 日历事件列表
   * @param callbacks 事件回调函数
   */
  createCalendarOptions(
    events: EventInput[],
    callbacks: CalendarEventCallbacks = {}
  ): CalendarOptions {
    const {
      onEventClick,
      onEventMouseEnter,
      onEventMouseLeave,
      escapeHtml = (text: string) => text
    } = callbacks;

    return {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      locale: zhCnLocale,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek' // 只保留月视图和周视图，周视图不显示时间
      },
      events: events,
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
        if (onEventClick) {
          arg.jsEvent.preventDefault();
          arg.jsEvent.stopPropagation();
          onEventClick(arg);
        }
        return false;
      },
      // 鼠标悬停事件 - FullCalendar 原生支持
      eventMouseEnter: (arg) => {
        if (onEventMouseEnter) {
          onEventMouseEnter(arg);
        }
      },
      eventMouseLeave: (arg) => {
        if (onEventMouseLeave) {
          onEventMouseLeave(arg);
        }
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
          ? `<div class="fc-event-desc">${escapeHtml(taskDescription)}</div>` 
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
  }

  /**
   * 创建日期对象（用于跳转）
   */
  createDateForNavigation(year: number, month: number): Date {
    return new Date(year, month - 1, 1);
  }

  /**
   * 获取今天的日期
   */
  getToday(): Date {
    return new Date();
  }

  /**
   * 处理鼠标进入任务事件
   */
  handleEventMouseEnter(arg: any, state: CalendarComponentState): void {
    // 如果已经显示了处理面板，不显示简介面板
    if (state.getShowTaskDetailPanel()) {
      console.log("已经显示了处理面板，不显示简介面板");
      return;
    }
    
    // 提取事件数据（使用外部函数）
    const { event, extendedProps, eventId, eventElementId } = extractEventData(arg);
    
    // 构建任务详情数据（使用外部函数）
    const taskDetailData = buildTaskDetailData(event, extendedProps);
    
    // 如果简介面板已经显示，检查是否应该切换任务
    if (state.getShowTaskIntroPanel() && state.getCurrentTaskData()) {
      const currentTaskData = state.getCurrentTaskData();
      const currentTaskId = currentTaskData?.taskId || '';
      const newTaskId = extendedProps.taskId || event.id || '';
      
      // 如果鼠标移入的是同一个任务，清除隐藏定时器，保持面板显示（从面板移回任务时）
      if (currentTaskId === newTaskId) {
        clearHideTimeout(state.timeoutManager); // 清除隐藏定时器，保持面板显示
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
      clearShowTimeout(state.timeoutManager);
      // 保存新任务数据，等待旧面板隐藏后再显示
      const targetElement = findTargetElement(eventId, arg.el as HTMLElement);
      const calculatedPosition = computePanelPosition(targetElement, arg.jsEvent);
      state.setPendingTaskData(taskDetailData);
      state.setPendingTaskPosition(calculatedPosition);
      state.setPendingTaskEventId(eventId);
      // 直接返回，不开始新任务的倒计时
      return;
    }
    
    // 只清除显示定时器，不清除隐藏定时器（让旧任务的延迟隐藏正常执行）
    clearShowTimeout(state.timeoutManager);
    
    // 查找目标元素（使用外部函数）
    const targetElement = findTargetElement(eventId, arg.el as HTMLElement);
    
    // 计算面板位置（使用外部函数）
    const calculatedPosition = computePanelPosition(targetElement, arg.jsEvent);
    
    // 延迟显示简介面板
    state.timeoutManager.showIntroTimeout = window.setTimeout(() => {
      // 再次检查是否已经显示了处理面板（使用 getter 获取最新值）
      if (state.getShowTaskDetailPanel()) {
        return;
      }
      
      // 如果旧面板位置已锁定且旧面板还在显示，保存新任务数据，等待旧面板隐藏后再显示
      if (state.getIsPanelPositionLocked() && state.getShowTaskIntroPanel() && 
          state.getCurrentTaskData() && state.getCurrentTaskData()?.taskId !== taskDetailData.taskId) {
        // 旧面板还在显示，保存新任务数据，等待旧面板隐藏后再显示
        // 不显示新面板，等待旧面板隐藏
        return;
      }
      
      // 如果旧面板已经隐藏（isPanelPositionLocked 为 false），或者当前没有面板显示，可以显示新面板
      // 再次验证任务ID是否匹配（确保是同一个任务）
      if (state.getCurrentTaskData() && state.getCurrentTaskData()?.taskId !== taskDetailData.taskId && 
          state.getIsPanelPositionLocked()) {
        // 如果任务ID不匹配且位置已锁定，说明旧面板还在显示，不显示新面板
        return;
      }
      
      // 重新查找目标元素（确保使用最新的元素位置）
      const currentTargetElement = findTargetElement(eventId, undefined);
      if (!currentTargetElement) {
        return;
      }
      
      // 更新任务数据
      state.setCurrentTaskData(taskDetailData);
      
      // 标记位置未准备好，面板将保持不可见
      state.setIsPanelPositionReady(false);
      
      // 先显示面板但保持不可见（用于获取实际高度）
      // 先设置一个屏幕外的位置，避免在错误位置闪烁
      state.setPanelPosition({ top: '-9999px', left: '-9999px' });
      state.setShowTaskIntroPanel(true);
      state.cdr.markForCheck();
      
      // 使用 requestAnimationFrame 等待 DOM 渲染完成，然后计算精确位置
      state.ngZone.runOutsideAngular(() => {
        // 等待一帧，让面板渲染
        requestAnimationFrame(() => {
          // 再等待一帧，确保面板完全渲染
          requestAnimationFrame(() => {
            // 再次验证任务ID和面板状态（使用 getter 获取最新值）
            if (!state.getShowTaskIntroPanel() || !state.getCurrentTaskData() || 
                state.getCurrentTaskData()?.taskId !== taskDetailData.taskId) {
              // 如果任务已改变，标记位置已准备好（虽然不显示）
              state.ngZone.run(() => {
                state.setIsPanelPositionReady(true);
                state.cdr.markForCheck();
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
              
              state.ngZone.run(() => {
                // 再次验证任务ID（确保位置计算时任务没有改变）
                const currentData = state.getCurrentTaskData();
                if (currentData && currentData.taskId === taskDetailData.taskId) {
                  // 一次性更新位置和显示状态，避免闪烁
                  state.setPanelPosition(finalPosition);
                  // 标记位置已准备好，面板可以显示
                  state.setIsPanelPositionReady(true);
                  // 锁定面板位置，防止后续改变
                  state.setIsPanelPositionLocked(true);
                  state.cdr.markForCheck();
                } else {
                  // 任务已改变，标记位置已准备好（虽然不显示）
                  state.setIsPanelPositionReady(true);
                  state.cdr.markForCheck();
                }
              });
            } else {
              // 如果找不到元素，标记位置已准备好（虽然不显示）
              state.ngZone.run(() => {
                state.setIsPanelPositionReady(true);
                state.cdr.markForCheck();
              });
            }
          });
        });
      });
    }, 700); // 延迟700毫秒
  }

  /**
   * 处理鼠标离开任务事件
   */
  handleEventMouseLeave(arg: any, state: CalendarComponentState): void {
    // 如果已经显示了处理面板，不隐藏
    if (state.getShowTaskDetailPanel()) {
      return;
    }
    
    // 提取事件数据，检查是否是等待显示的任务
    const { event, extendedProps, eventId } = extractEventData(arg);
    const leavingTaskId = extendedProps.taskId || event.id || '';
    
    // 如果当前离开的任务正是等待显示的任务，不清除倒计时（保持倒计时继续）
    // 这样可以避免快速移动时（A->B->C->D），D任务的倒计时被清除导致面板不显示
    const pendingData = state.getPendingTaskData();
    if (pendingData && pendingData.taskId === leavingTaskId) {
      // 这是等待显示的任务，不清除倒计时，让它继续倒计时
      return;
    }
    
    // 如果有等待显示的任务，且倒计时已经开始（showIntroTimeout已设置）
    // 不清除倒计时，因为倒计时是针对等待显示的任务的
    // 这样可以避免快速移动时（A->B->C->D），在倒计时期间离开任务导致面板不显示
    if (pendingData && state.timeoutManager.showIntroTimeout) {
      // 倒计时已经开始，不清除倒计时，让它继续倒计时
      // 但如果是离开等待显示的任务本身，已经在上面返回了
    } else {
      // 清除显示定时器（使用外部函数）
      clearShowTimeout(state.timeoutManager);
    }
    
    // 如果简介面板已经显示，延迟隐藏（给用户时间移动到面板上）
    if (state.getShowTaskIntroPanel()) {
      // 延迟隐藏简介面板（如果用户没有移动到面板上）
      state.timeoutManager.hideIntroTimeout = window.setTimeout(() => {
        // 再次检查是否已经显示了处理面板（使用 getter 获取最新值）
        if (state.getShowTaskDetailPanel()) {
          return;
        }
        state.setShowTaskIntroPanel(false);
        state.setCurrentTaskData(null);
        state.setIsPanelPositionLocked(false); // 解锁位置
        state.cdr.markForCheck();
        
        // 如果有等待显示的任务，优化：如果刚才有任务简介面板展示并隐藏了，只需要400ms就展示下一个任务面板
        const pendingDataNow = state.getPendingTaskData();
        const pendingPosition = state.getPendingTaskPosition();
        const pendingEventId = state.getPendingTaskEventId();
        if (pendingDataNow && pendingPosition && pendingEventId) {
          const pendingDataCopy = pendingDataNow;
          const pendingPositionCopy = pendingPosition;
          const pendingEventIdCopy = pendingEventId;
          
          // 清空等待数据
          state.setPendingTaskData(null);
          state.setPendingTaskPosition(null);
          state.setPendingTaskEventId(null);
          
          // 优化：旧面板刚隐藏，直接开始短倒计时（400ms），不需要额外缓冲
          const targetElement = findTargetElement(pendingEventIdCopy, undefined);
          if (targetElement) {
            // 开始新任务的倒计时（缩短为400ms，因为旧面板已经隐藏）
            state.timeoutManager.showIntroTimeout = window.setTimeout(() => {
              // 使用 getter 获取最新值
              if (!state.getShowTaskDetailPanel() && 
                  (!state.getCurrentTaskData() || state.getCurrentTaskData()?.taskId === pendingDataCopy.taskId)) {
                this.showPendingTaskPanel(pendingDataCopy, pendingPositionCopy, pendingEventIdCopy, state);
              }
            }, 400); // 优化：缩短为400ms，因为旧面板已经隐藏
          }
        }
      }, 300); // 延迟0.3秒，快速响应
    } else {
      // 如果面板还没显示，清除显示定时器即可
      clearShowTimeout(state.timeoutManager);
    }
  }

  /**
   * 处理点击任务事件：显示任务处理面板
   */
  handleEventClick(arg: any, state: CalendarComponentState): void {
    // 清除所有定时器（使用外部函数）
    clearAllTimeouts(state.timeoutManager);
    
    // 隐藏简介面板
    state.setShowTaskIntroPanel(false);
    
    // 提取事件数据（使用外部函数）
    const { event, extendedProps, eventId } = extractEventData(arg);
    
    // 构建任务详情数据（使用外部函数）
    const taskDetailData = buildTaskDetailData(event, extendedProps);
    state.setCurrentTaskData(taskDetailData);
    
    // 查找目标元素（使用外部函数）
    const targetElement = findTargetElement(eventId, arg.el as HTMLElement);
    
    // 计算位置（使用外部函数）
    const calculatedPosition = computePanelPosition(targetElement, arg.jsEvent);
    
    // 显示处理面板
    state.setPanelPosition(calculatedPosition);
    state.setShowTaskDetailPanel(true);
    
    state.cdr.markForCheck();
    
    // 在下一帧使用实际面板高度微调位置（特别是上方位置）
    state.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        // 使用 getter 获取最新值
        if (targetElement && state.getShowTaskDetailPanel()) {
          // 获取实际面板高度（使用外部函数）
          const actualHeight = getActualPanelHeight('.task-detail-panel-permanent', 300);
          
          // 使用实际高度重新计算位置
          const position = computePanelPosition(targetElement, null, true, actualHeight);
          if (position) {
            state.ngZone.run(() => {
              state.setPanelPosition(position);
              state.cdr.markForCheck();
            });
          }
        }
      });
    });
  }

  /**
   * 自动点击今天的第一个任务
   */
  autoClickTodayFirstTask(
    calendarComponent: FullCalendarComponent | null,
    calendarEvents: EventInput[],
    state: CalendarComponentState
  ): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // 查找今天的任务
    const todayEvents = calendarEvents.filter((event: any) => {
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
      
      if (eventId && calendarComponent?.getApi()) {
        const api = calendarComponent.getApi();
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
                  this.handleEventClick(mockEvent, state);
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
              this.handleEventClick(mockEvent, state);
            }
          }, 300);
        }
      }
    }
  }

  /**
   * 处理鼠标离开简介面板事件
   */
  handleIntroPanelMouseLeave(state: CalendarComponentState): void {
    // 延迟隐藏简介面板（参考 tooltip 的实现，立即隐藏）
    state.timeoutManager.hideIntroTimeout = window.setTimeout(() => {
      // 使用 getter 获取最新值
      if (!state.getShowTaskDetailPanel()) {
        // 在隐藏旧面板之前，先清除可能正在进行的显示定时器
        // 这样可以避免新任务的倒计时与旧面板隐藏逻辑冲突
        clearShowTimeout(state.timeoutManager);
        
        state.setShowTaskIntroPanel(false);
        state.setCurrentTaskData(null);
        state.setIsPanelPositionReady(false); // 重置位置状态
        state.setIsPanelPositionLocked(false); // 解锁位置
        state.cdr.markForCheck();
        
        // 如果有等待显示的任务，优化：如果刚才有任务简介面板展示并隐藏了，只需要400ms就展示下一个任务面板
        const pendingDataNow = state.getPendingTaskData();
        const pendingPosition = state.getPendingTaskPosition();
        const pendingEventId = state.getPendingTaskEventId();
        if (pendingDataNow && pendingPosition && pendingEventId) {
          const pendingDataCopy = pendingDataNow;
          const pendingPositionCopy = pendingPosition;
          const pendingEventIdCopy = pendingEventId;
          
          // 清空等待数据
          state.setPendingTaskData(null);
          state.setPendingTaskPosition(null);
          state.setPendingTaskEventId(null);
          
          // 优化：旧面板刚隐藏，直接开始短倒计时（400ms），不需要额外缓冲
          const targetElement = findTargetElement(pendingEventIdCopy, undefined);
          if (targetElement) {
            // 开始新任务的倒计时（缩短为400ms，因为旧面板已经隐藏）
            state.timeoutManager.showIntroTimeout = window.setTimeout(() => {
              // 再次检查：如果又有了新的等待任务，或者面板已经显示，不显示当前这个（使用 getter 获取最新值）
              if (state.getShowTaskDetailPanel() || state.getShowTaskIntroPanel()) {
                return;
              }
              const pendingDataCheck = state.getPendingTaskData();
              if (pendingDataCheck && pendingDataCheck.taskId !== pendingDataCopy.taskId) {
                return;
              }
              const currentData = state.getCurrentTaskData();
              if (!currentData || currentData.taskId === pendingDataCopy.taskId) {
                this.showPendingTaskPanel(pendingDataCopy, pendingPositionCopy, pendingEventIdCopy, state);
              }
            }, 400); // 优化：缩短为400ms，因为旧面板已经隐藏
          }
        }
      }
    }, 500); // 延迟0.5秒，与任务元素移出保持一致
  }

  /**
   * 显示等待的任务面板
   */
  showPendingTaskPanel(
    taskDetailData: TaskDetailData,
    calculatedPosition: { top: string; left: string },
    eventId: string,
    state: CalendarComponentState
  ): void {
    // 重新查找目标元素（确保使用最新的元素位置）
    const currentTargetElement = findTargetElement(eventId, undefined);
    if (!currentTargetElement) {
      return;
    }
    
    // 更新任务数据
    state.setCurrentTaskData(taskDetailData);
    
    // 标记位置未准备好，面板将保持不可见
    state.setIsPanelPositionReady(false);
    
    // 先显示面板但保持不可见（用于获取实际高度）
    // 先设置一个屏幕外的位置，避免在错误位置闪烁
    state.setPanelPosition({ top: '-9999px', left: '-9999px' });
    state.setShowTaskIntroPanel(true);
    state.cdr.markForCheck();
    
    // 使用 requestAnimationFrame 等待 DOM 渲染完成，然后计算精确位置
    state.ngZone.runOutsideAngular(() => {
      // 等待一帧，让面板渲染
      requestAnimationFrame(() => {
        // 再等待一帧，确保面板完全渲染
        requestAnimationFrame(() => {
            // 再次验证任务ID和面板状态（使用 getter 获取最新值）
            const currentDataNow = state.getCurrentTaskData();
            if (!state.getShowTaskIntroPanel() || !currentDataNow || 
                currentDataNow.taskId !== taskDetailData.taskId) {
              // 如果任务已改变，标记位置已准备好（虽然不显示）
              state.ngZone.run(() => {
                state.setIsPanelPositionReady(true);
                state.cdr.markForCheck();
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
              
              state.ngZone.run(() => {
                // 再次验证任务ID（确保位置计算时任务没有改变）（使用 getter 获取最新值）
                const currentDataCheck = state.getCurrentTaskData();
                if (currentDataCheck && currentDataCheck.taskId === taskDetailData.taskId) {
                  // 一次性更新位置和显示状态，避免闪烁
                  state.setPanelPosition(finalPosition);
                  // 标记位置已准备好，面板可以显示
                  state.setIsPanelPositionReady(true);
                  // 锁定面板位置，防止后续改变
                  state.setIsPanelPositionLocked(true);
                  state.cdr.markForCheck();
                } else {
                  // 任务已改变，标记位置已准备好（虽然不显示）
                  state.setIsPanelPositionReady(true);
                  state.cdr.markForCheck();
                }
              });
          } else {
            // 如果找不到元素，标记位置已准备好（虽然不显示）
            state.ngZone.run(() => {
              state.setIsPanelPositionReady(true);
              state.cdr.markForCheck();
            });
          }
        });
      });
    });
  }
}

