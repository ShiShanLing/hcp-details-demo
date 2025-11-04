import { TaskDetailData } from './components/task-detail-modal.component';

// ==================== 枚举定义 ====================
export enum TaskType {
  CallDoctor = '打电话',
  WriteArticle = '发文章',
  SendWechat = '发微信',
  SendCircle = '朋友圈',
}

export enum TaskIcon {
  CallDoctor = 'icon-dadianhua',
  WriteArticle = 'icon-tuisongpeizhi',
  SendWechat = 'icon-faweixin',
  SendCircle = 'icon-pengyouquan',
}

// 任务类型对应的颜色配置
export enum TaskColor {
  CallDoctor = '#1890ff',      // 蓝色 - 重要任务（打电话）
  WriteArticle = '#52c41a',     // 绿色 - 内容创作（发文章）
  SendWechat = '#07C160',       // 微信绿 - 社交沟通（发微信）
  SendCircle = '#00A15C',       // 微信深绿 - 社交分享（朋友圈）
  Completed = '#bfbfbf',        // 灰色 - 已完成任务
}

// ==================== 工具函数 ====================

/**
 * 转义 HTML 特殊字符
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 解码 HTML 实体
 */
export function decodeHtml(html: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

/**
 * 格式化日期（只显示日期，不显示时分秒）
 */
export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return '未知';
  try {
    return new Date(date).toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  } catch {
    return '未知';
  }
}

/**
 * 格式化日期时间（显示完整日期时间）
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '未知';
  try {
    return new Date(date).toLocaleString('zh-CN');
  } catch {
    return '未知';
  }
}

// ==================== 任务颜色处理 ====================

/**
 * 根据任务类型和完成状态获取对应的颜色
 */
export function getTaskColor(taskType: string, isCompleted: boolean = false): string {
  // 如果任务已完成，统一返回灰色
  if (isCompleted) {
    return TaskColor.Completed;
  }
  
  // 未完成的任务根据类型返回对应颜色
  switch (taskType) {
    case TaskType.CallDoctor:
      return TaskColor.CallDoctor;
    case TaskType.WriteArticle:
      return TaskColor.WriteArticle;
    case TaskType.SendWechat:
      return TaskColor.SendWechat;
    case TaskType.SendCircle:
      return TaskColor.SendCircle;
    default:
      return '#ff6b35'; // 默认颜色
  }
}

// ==================== 任务数据处理 ====================

/**
 * 从 FullCalendar 事件构建 TaskDetailData
 */
export function buildTaskDetailData(event: any, extendedProps: any): TaskDetailData {
  return {
    brand: extendedProps.brand || '未知',
    taskType: extendedProps.taskType || '未知',
    taskDescription: extendedProps.taskDescription || '无',
    isCompleted: extendedProps.isCompleted || false,
    startDate: formatDateOnly(event.start),
    endDate: event.end ? formatDateTime(event.end) : formatDateTime(event.start),
    icon: extendedProps.icon || '',
    processedTime: extendedProps.processedTime || undefined,
    processedBy: extendedProps.processedBy || undefined,
    taskId: extendedProps.taskId || event.id || undefined
  };
}

// ==================== 面板位置计算 ====================

/**
 * 面板位置配置
 */
export interface PanelPositionConfig {
  panelWidth?: number;
  panelHeight?: number;
  offsetX?: number; // 水平方向偏移（面板距离任务元素的水平间距）
  offsetY?: number; // 垂直方向偏移（面板距离任务元素的垂直间距）
  // 为了向后兼容，保留 offset（如果设置了 offset，会同时应用到 offsetX 和 offsetY）
  offset?: number;
}

/**
 * 默认面板位置配置
 */
const DEFAULT_PANEL_CONFIG: Required<Omit<PanelPositionConfig, 'offset'>> = {
  panelWidth: 350,
  panelHeight: 300,
  offsetX: 0, // 任务简介面板距离任务元素的水平间距
  offsetY: -60  // 任务简介面板距离任务元素的垂直间距
};

/**
 * 根据元素位置和指定高度计算面板位置
 */
export function calculatePanelPositionByElementWithHeight(
  element: HTMLElement,
  actualPanelHeight: number,
  config: PanelPositionConfig = {}
): { top: string; left: string } | null {
  if (!element) return null;
  
  // 处理向后兼容：如果设置了 offset，应用到 offsetX 和 offsetY
  const offsetX = config.offsetX !== undefined ? config.offsetX : (config.offset !== undefined ? config.offset : DEFAULT_PANEL_CONFIG.offsetX);
  const offsetY = config.offsetY !== undefined ? config.offsetY : (config.offset !== undefined ? config.offset : DEFAULT_PANEL_CONFIG.offsetY);
  const { panelWidth } = { ...DEFAULT_PANEL_CONFIG, ...config };
  
  const elementRect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 水平方向计算（使用 offsetX）
  let left: number;
  const spaceOnRight = viewportWidth - elementRect.right;
  const spaceOnLeft = elementRect.left;
  const elementCenterX = elementRect.left + elementRect.width / 2;
  const viewportCenterX = viewportWidth / 2;
  const isElementOnLeft = elementCenterX < viewportCenterX;
  
  if (isElementOnLeft) {
    if (spaceOnRight >= panelWidth + offsetX) {
      left = elementRect.right + offsetX;
    } else if (spaceOnLeft >= panelWidth + offsetX) {
      left = elementRect.left - panelWidth - offsetX;
    } else {
      left = spaceOnRight > spaceOnLeft ? viewportWidth - panelWidth - 10 : 10;
    }
  } else {
    if (spaceOnLeft >= panelWidth + offsetX) {
      left = elementRect.left - panelWidth - offsetX;
    } else if (spaceOnRight >= panelWidth + offsetX) {
      left = elementRect.right + offsetX;
    } else {
      left = spaceOnLeft > spaceOnRight ? 10 : viewportWidth - panelWidth - 10;
    }
  }
  
  // 垂直方向计算（使用实际高度和 offsetY）
  let top: number;
  const spaceBelow = viewportHeight - elementRect.bottom;
  const spaceAbove = elementRect.top;
  
  if (spaceBelow >= actualPanelHeight + offsetY) {
    top = elementRect.bottom + offsetY;
  } else if (spaceAbove >= actualPanelHeight + offsetY) {
    // 使用实际高度计算，让面板底部对齐到元素顶部
    top = elementRect.top - actualPanelHeight - offsetY;
  } else {
    if (spaceBelow >= spaceAbove) {
      const preferredTop = elementRect.bottom + offsetY;
      top = preferredTop + actualPanelHeight <= viewportHeight ? preferredTop : viewportHeight - actualPanelHeight - 10;
    } else {
      const preferredTop = elementRect.top - actualPanelHeight - offsetY;
      top = preferredTop >= 10 ? preferredTop : Math.max(10, elementRect.top - actualPanelHeight);
    }
  }
  
  // 边界检查
  if (left < 0) left = 10;
  if (left + panelWidth > viewportWidth) left = viewportWidth - panelWidth - 10;
  if (top < 0) top = 10;
  if (top + actualPanelHeight > viewportHeight) top = viewportHeight - actualPanelHeight - 10;
  
  return {
    left: `${left}px`,
    top: `${top}px`
  };
}

/**
 * 根据元素位置计算面板位置（使用预估高度）
 */
export function calculatePanelPositionByElement(
  element: HTMLElement,
  config: PanelPositionConfig = {}
): { top: string; left: string } | null {
  if (!element) return null;
  
  // 处理向后兼容：如果设置了 offset，应用到 offsetX 和 offsetY
  const offsetX = config.offsetX !== undefined ? config.offsetX : (config.offset !== undefined ? config.offset : DEFAULT_PANEL_CONFIG.offsetX);
  const offsetY = config.offsetY !== undefined ? config.offsetY : (config.offset !== undefined ? config.offset : DEFAULT_PANEL_CONFIG.offsetY);
  const { panelWidth, panelHeight } = { ...DEFAULT_PANEL_CONFIG, ...config };
  
  const elementRect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left: number;
  let top: number;
  
  // 水平方向计算（使用 offsetX）
  const spaceOnRight = viewportWidth - elementRect.right;
  const spaceOnLeft = elementRect.left;
  const elementCenterX = elementRect.left + elementRect.width / 2;
  const viewportCenterX = viewportWidth / 2;
  const isElementOnLeft = elementCenterX < viewportCenterX;
  
  if (isElementOnLeft) {
    if (spaceOnRight >= panelWidth + offsetX) {
      left = elementRect.right + offsetX;
    } else if (spaceOnLeft >= panelWidth + offsetX) {
      left = elementRect.left - panelWidth - offsetX;
    } else {
      left = spaceOnRight > spaceOnLeft ? viewportWidth - panelWidth - 10 : 10;
    }
  } else {
    if (spaceOnLeft >= panelWidth + offsetX) {
      left = elementRect.left - panelWidth - offsetX;
    } else if (spaceOnRight >= panelWidth + offsetX) {
      left = elementRect.right + offsetX;
    } else {
      left = spaceOnLeft > spaceOnRight ? 10 : viewportWidth - panelWidth - 10;
    }
  }
  
  // 垂直方向计算（使用 offsetY）
  const spaceBelow = viewportHeight - elementRect.bottom;
  const spaceAbove = elementRect.top;
  
  if (spaceBelow >= panelHeight + offsetY) {
    top = elementRect.bottom + offsetY;
  } else if (spaceAbove >= panelHeight + offsetY) {
    top = elementRect.top - panelHeight - offsetY;
  } else {
    if (spaceBelow >= spaceAbove) {
      const preferredTop = elementRect.bottom + offsetY;
      top = preferredTop + panelHeight <= viewportHeight ? preferredTop : viewportHeight - panelHeight - 10;
    } else {
      const preferredTop = elementRect.top - panelHeight - offsetY;
      if (preferredTop >= 10) {
        top = preferredTop;
      } else {
        const alignToElementTop = elementRect.top - panelHeight;
        if (alignToElementTop >= 10) {
          top = alignToElementTop;
        } else {
          const maxAvailableHeight = elementRect.top - 10;
          if (maxAvailableHeight > 100) {
            top = elementRect.top - Math.min(panelHeight, maxAvailableHeight);
          } else {
            top = 10;
          }
        }
      }
    }
  }
  
  // 边界检查
  if (left < 0) left = 10;
  if (left + panelWidth > viewportWidth) left = viewportWidth - panelWidth - 10;
  if (top < 0) top = 10;
  if (top + panelHeight > viewportHeight) top = viewportHeight - panelHeight - 10;
  
  return {
    left: `${left}px`,
    top: `${top}px`
  };
}

/**
 * 根据 Rect 计算面板位置（备用方案）
 */
export function calculatePanelPositionByRect(
  rect: DOMRect,
  config: PanelPositionConfig = {}
): { top: string; left: string } {
  // 处理向后兼容：如果设置了 offset，应用到 offsetX 和 offsetY
  const offsetX = config.offsetX !== undefined ? config.offsetX : (config.offset !== undefined ? config.offset : DEFAULT_PANEL_CONFIG.offsetX);
  const offsetY = config.offsetY !== undefined ? config.offsetY : (config.offset !== undefined ? config.offset : DEFAULT_PANEL_CONFIG.offsetY);
  const { panelWidth, panelHeight } = { ...DEFAULT_PANEL_CONFIG, ...config };
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = rect.right + offsetX;
  let top = rect.top + offsetY;
  
  // 如果右边空间不够，显示在左边
  if (left + panelWidth > viewportWidth) {
    left = rect.left - panelWidth - offsetX;
  }
  
  // 如果下边空间不够，显示在上边
  if (top + panelHeight > viewportHeight) {
    top = rect.bottom - panelHeight - offsetY;
  }
  
  // 确保不超出边界
  if (left < 0) left = offsetX;
  if (top < 0) top = offsetY;
  
  return {
    left: `${left}px`,
    top: `${top}px`
  };
}

/**
 * 根据鼠标事件计算面板位置（备用方案）
 */
export function calculatePanelPositionByMouseEvent(
  event: MouseEvent,
  config: PanelPositionConfig = {}
): { top: string; left: string } | null {
  if (!event) return null;
  
  const rect = {
    left: event.pageX,
    top: event.pageY,
    right: event.pageX,
    bottom: event.pageY,
    width: 0,
    height: 0
  } as DOMRect;
  
  return calculatePanelPositionByRect(rect, config);
}

// ==================== 元素查找逻辑 ====================

/**
 * 查找目标元素（通过ID或DOM查找）
 */
export function findTargetElement(
  eventId: string,
  fallbackElement?: HTMLElement
): HTMLElement | null {
  if (!eventId) {
    return fallbackElement || null;
  }
  
  const eventElementId = `task-event-${eventId}`;
  
  // 尝试通过ID获取元素
  let targetElement = document.getElementById(eventElementId) || fallbackElement || null;
  
  // 如果找不到，尝试通过查找包含data-event-id的元素
  if (!targetElement || !targetElement.getBoundingClientRect) {
    const customEventElement = document.querySelector(`[data-event-id="${eventId}"]`);
    if (customEventElement) {
      targetElement = customEventElement.closest('.fc-event') as HTMLElement || customEventElement as HTMLElement;
    }
  }
  
  return targetElement;
}

// ==================== 事件数据提取 ====================

/**
 * 从 FullCalendar 事件参数中提取事件数据
 */
export function extractEventData(arg: any): {
  event: any;
  extendedProps: any;
  eventId: string;
  eventElementId: string;
} {
  const event = arg.event;
  const extendedProps = event.extendedProps as any;
  const eventId = extendedProps.taskId || event.id || '';
  const eventElementId = `task-event-${eventId}`;
  
  return {
    event,
    extendedProps,
    eventId,
    eventElementId
  };
}

// ==================== 位置计算辅助 ====================

/**
 * 计算面板位置（包含所有计算逻辑）
 */
export function computePanelPosition(
  targetElement: HTMLElement | null,
  mouseEvent?: MouseEvent | null,
  useActualHeight: boolean = false,
  actualHeight?: number
): { top: string; left: string } {
  let calculatedPosition = { top: '100px', left: '100px' };
  
  if (targetElement) {
    if (useActualHeight && actualHeight) {
      const position = calculatePanelPositionByElementWithHeight(targetElement, actualHeight);
      if (position) {
        calculatedPosition = position;
      }
    } else {
      const position = calculatePanelPositionByElement(targetElement);
      if (position) {
        calculatedPosition = position;
      }
    }
  } else if (mouseEvent) {
    const position = calculatePanelPositionByMouseEvent(mouseEvent);
    if (position) {
      calculatedPosition = position;
    }
  }
  
  return calculatedPosition;
}

/**
 * 获取实际面板高度
 */
export function getActualPanelHeight(selector: string, defaultHeight: number = 300): number {
  const panel = document.querySelector(selector);
  return panel ? (panel as HTMLElement).offsetHeight : defaultHeight;
}

// ==================== 定时器管理 ====================

/**
 * 定时器管理器接口
 */
export interface TimeoutManager {
  showIntroTimeout?: number;
  hideIntroTimeout?: number;
}

/**
 * 清除所有定时器
 */
export function clearAllTimeouts(manager: TimeoutManager): void {
  if (manager.showIntroTimeout) {
    clearTimeout(manager.showIntroTimeout);
    manager.showIntroTimeout = undefined;
  }
  if (manager.hideIntroTimeout) {
    clearTimeout(manager.hideIntroTimeout);
    manager.hideIntroTimeout = undefined;
  }
}

/**
 * 清除显示定时器
 */
export function clearShowTimeout(manager: TimeoutManager): void {
  if (manager.showIntroTimeout) {
    clearTimeout(manager.showIntroTimeout);
    manager.showIntroTimeout = undefined;
  }
}

/**
 * 清除隐藏定时器
 */
export function clearHideTimeout(manager: TimeoutManager): void {
  if (manager.hideIntroTimeout) {
    clearTimeout(manager.hideIntroTimeout);
    manager.hideIntroTimeout = undefined;
  }
}

// ==================== 事件处理器管理 ====================

/**
 * 事件处理器回调接口
 */
export interface EventHandlerCallbacks {
  onMouseEnter?: (taskData: TaskDetailData, event: MouseEvent) => void;
  onMouseLeave?: () => void;
}

/**
 * 清理事件鼠标处理器
 */
export function cleanupEventMouseHandlers(): void {
  const eventElements = document.querySelectorAll('.fc-event');
  eventElements.forEach((element) => {
    const eventElement = element as HTMLElement;
    const handlers = (eventElement as any)._mouseHandlers;
    if (handlers) {
      eventElement.removeEventListener('mouseenter', handlers.mouseEnterHandler);
      eventElement.removeEventListener('mouseleave', handlers.mouseLeaveHandler);
      delete (eventElement as any)._mouseHandlers;
    }
  });
}

/**
 * 匹配事件与DOM元素
 */
export function matchEventToElement(
  eventElement: HTMLElement,
  events: any[],
  api: any
): any | null {
  let matchedEvent: any = null;
  
  // 方法1: 从内部的 fc-custom-event 元素获取 data-event-id
  const customEventElement = eventElement.querySelector('.fc-custom-event') as HTMLElement;
  const eventId = customEventElement?.getAttribute('data-event-id');
  
  if (eventId) {
    matchedEvent = api.getEventById(eventId);
    if (matchedEvent) {
      return matchedEvent;
    }
  }
  
  // 方法2: 尝试通过 FullCalendar 的内部属性获取事件
  if ((eventElement as any).__event) {
    matchedEvent = (eventElement as any).__event;
    if (matchedEvent) {
      return matchedEvent;
    }
  }
  
  // 方法3: 通过事件文本内容匹配（品牌名称）
  const elementText = eventElement.textContent?.trim() || '';
  if (elementText) {
    matchedEvent = events.find((evt: any) => {
      const extendedProps = evt.extendedProps as any;
      const brand = extendedProps?.brand || '';
      return brand && elementText.includes(brand);
    });
    if (matchedEvent) {
      return matchedEvent;
    }
  }
  
  // 方法4: 通过日期和位置匹配
  if (events.length > 0) {
    const dayElement = eventElement.closest('.fc-day') || eventElement.closest('[data-date]');
    if (dayElement) {
      const dateStr = (dayElement as HTMLElement).getAttribute('data-date');
      if (dateStr) {
        const eventDateStr = dateStr.split('T')[0];
        const sameDateEvents = events.filter((evt: any) => {
          if (evt.start) {
            const evtDateStr = new Date(evt.start).toISOString().split('T')[0];
            return evtDateStr === eventDateStr;
          }
          return false;
        });
        
        // 找到同一天中未匹配的事件
        const alreadyMatchedIds = new Set(
          Array.from(document.querySelectorAll('.fc-event[data-matched-event-id]'))
            .map(el => el.getAttribute('data-matched-event-id'))
        );
        
        matchedEvent = sameDateEvents.find((evt: any) => {
          const id = evt.id || evt.extendedProps?.taskId;
          return id && !alreadyMatchedIds.has(String(id));
        }) || sameDateEvents[0];
        
        if (matchedEvent) {
          return matchedEvent;
        }
      }
    }
  }
  
  return null;
}

/**
 * 初始化事件鼠标处理器（备用方案，当 FullCalendar 原生事件不工作时使用）
 */
export function initEventMouseHandlers(
  api: any,
  callbacks: EventHandlerCallbacks
): void {
  // 清理旧的事件处理器
  cleanupEventMouseHandlers();
  
  if (!api) {
    console.warn('Calendar API not available');
    return;
  }
  
  // 获取所有事件
  const events = api.getEvents();
  console.log('初始化鼠标事件处理器，找到', events.length, '个事件');
  
  // 查找所有事件元素（只查找 .fc-event，不查找内部的 .fc-custom-event）
  const eventElements = document.querySelectorAll('.fc-event');
  console.log('找到', eventElements.length, '个事件DOM元素');
  
  eventElements.forEach((element, index) => {
    const eventElement = element as HTMLElement;
    
    // 匹配事件
    const matchedEvent = matchEventToElement(eventElement, events, api);
    
    if (matchedEvent) {
      const extendedProps = matchedEvent.extendedProps as any;
      
      // 标记这个元素已经匹配了事件
      const matchedId = matchedEvent.id || extendedProps.taskId || '';
      eventElement.setAttribute('data-matched-event-id', matchedId);
      
      // 创建鼠标进入处理器
      const mouseEnterHandler = (e: MouseEvent) => {
        console.log('鼠标进入事件:', extendedProps.brand);
        e.stopPropagation();
        
        // 检查是否已经有简介面板显示，并且鼠标在面板内部
        const introPanel = document.querySelector('.task-intro-panel');
        if (introPanel) {
          const panelRect = introPanel.getBoundingClientRect();
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          
          // 只检查鼠标是否在面板内部（不包括padding），如果在内部才阻止更新
          // 如果鼠标在面板外部（即使很近），允许更新为新任务
          if (mouseX >= panelRect.left && mouseX <= panelRect.right &&
              mouseY >= panelRect.top && mouseY <= panelRect.bottom) {
            return; // 鼠标在面板内部，不触发更新
          }
        }
        
        // 构建任务详情数据（使用外部函数）
        const taskDetailData = buildTaskDetailData(matchedEvent, extendedProps);
        
        // 调用回调
        if (callbacks.onMouseEnter) {
          callbacks.onMouseEnter(taskDetailData, e);
        }
      };
      
      // 创建鼠标离开处理器（已废弃，保留用于兼容）
      const mouseLeaveHandler = () => {
        console.log('鼠标离开事件:', extendedProps.brand);
        // 调用回调
        if (callbacks.onMouseLeave) {
          callbacks.onMouseLeave();
        }
      };
      
      // 直接绑定到 .fc-event 元素
      eventElement.addEventListener('mouseenter', mouseEnterHandler);
      eventElement.addEventListener('mouseleave', mouseLeaveHandler);
      
      // 保存处理器以便清理
      (eventElement as any)._mouseHandlers = {
        mouseEnterHandler,
        mouseLeaveHandler,
        event: matchedEvent
      };
      
      console.log(`事件 ${index} 绑定成功`);
    } else {
      console.warn(`事件 ${index} 未能匹配到事件数据`);
    }
  });
  
  console.log('鼠标事件绑定完成');
}

