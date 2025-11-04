import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule, NzModalRef } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

export interface DeductionItem {
  item: string; // 扣分项名称
  reason: string; // 扣分原因
  score: number; // 扣分分值
}

export interface ScoreDeductionData {
  projectName: string; // 项目名称
  totalScore: number; // 总分
  currentScore: number; // 当前分数
  deductionItems: DeductionItem[]; // 扣分项列表
  remark?: string; // 备注
}

@Component({
  selector: 'app-score-deduction-modal',
  standalone: true,
  imports: [
    CommonModule,
    NzModalModule,
    NzTableModule,
    NzDividerModule,
    NzTagModule,
    NzTooltipModule
  ],
  templateUrl: './score-deduction-modal.component.html',
  styleUrl: './score-deduction-modal.component.scss'
})
export class ScoreDeductionModalComponent implements OnInit {
  scoreData!: ScoreDeductionData;

  // 表格列定义
  deductionColumns = [
    {
      title: '扣分项',
      key: 'item',
      width: '150px'
    },
    {
      title: '扣分原因',
      key: 'reason',
    },
    {
      title: '扣分分值',
      key: 'score',
      width: '100px',
      align: 'center'
    }
  ];

  constructor(private modal: NzModalRef) {
    // 从 modal 的 nzData 获取传递的数据
    this.scoreData = this.modal.getConfig().nzData || {
      projectName: '',
      totalScore: 100,
      currentScore: 0,
      deductionItems: [],
      remark: undefined
    };
  }

  ngOnInit(): void {
    // 组件初始化
  }

  // 关闭弹窗
  handleClose(): void {
    this.modal.close();
  }

  // 计算总扣分
  getTotalDeduction(): number {
    return this.scoreData.deductionItems.reduce((sum, item) => sum + item.score, 0);
  }
}

