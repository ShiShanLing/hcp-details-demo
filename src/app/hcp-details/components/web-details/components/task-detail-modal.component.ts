import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpaceModule } from 'ng-zorro-antd/space';

export interface TaskDetailData {
  brand: string;
  taskType: string;
  taskDescription: string;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
  icon?: string;
  // 处理时间和处理人
  processedTime?: string;
  processedBy?: string;
  // 任务ID，用于后续操作
  taskId?: string;
}

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzButtonModule,
    NzDescriptionsModule,
    NzTagModule,
    NzDividerModule,
    NzSpaceModule
  ],
  templateUrl: './task-detail-modal.component.html',
  styleUrl: './task-detail-modal.component.scss'
})
export class TaskDetailModalComponent implements OnInit {
  taskData!: TaskDetailData;
  processing = false;

  constructor(private modal: NzModalRef) {
    // 从 modal 的 nzData 获取传递的数据
    this.taskData = this.modal.getConfig().nzData || {} as TaskDetailData;
  }

  ngOnInit(): void {
    // 组件初始化
  }

  // 处理任务 - 标记为已完成（用于演示，没有接口）
  handleCompleteTask(): void {
    this.processing = true;
    
    // 模拟异步操作
    setTimeout(() => {
      // 更新任务数据
      this.taskData.isCompleted = true;
      
      // 设置处理时间和处理人（用于演示）
      const now = new Date();
      this.taskData.processedTime = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      this.taskData.processedBy = '张三'; // 演示用的处理人，实际应从用户服务获取
      
      this.processing = false;
      
      // 通知父组件任务已完成，传递更新后的数据
      this.modal.close({
        success: true,
        data: { ...this.taskData } // 传递新对象的副本，确保数据更新
      });
    }, 500);
  }

  // 关闭弹窗
  handleClose(): void {
    this.modal.close({
      success: false,
      data: null
    });
  }
}

