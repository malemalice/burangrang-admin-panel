import { ApiProperty } from '@nestjs/swagger';

export class JobPositionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(partial: Partial<JobPositionDto>) {
    Object.assign(this, partial);
  }
}

export class DepartmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(partial: Partial<DepartmentDto>) {
    Object.assign(this, partial);
  }
}

export class ApprovalUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(partial: Partial<ApprovalUserDto>) {
    Object.assign(this, partial);
  }
}

export class MasterApprovalItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mApprovalId: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  jobPositionId: string;

  @ApiProperty()
  departmentId: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => JobPositionDto })
  jobPosition: JobPositionDto;

  @ApiProperty({ type: () => DepartmentDto })
  department: DepartmentDto;

  @ApiProperty({ type: () => ApprovalUserDto })
  creator: ApprovalUserDto;

  constructor(partial: Partial<MasterApprovalItemDto>) {
    Object.assign(this, partial);
  }
}

export class MasterApprovalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entity: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: () => MasterApprovalItemDto, isArray: true })
  items: MasterApprovalItemDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;


  constructor(partial: Partial<MasterApprovalDto>) {
    Object.assign(this, partial);
  }
} 


export interface ApprovalStatusHistory {
  history: {
    id: string;
    status: string;
    notes: string;
    createdAt: Date;
    line: number;
    department: {
      id: string;
      name: string;
    };
    jobPosition: {
      id: string;
      name: string;
    };
    creator: {
      id: string;
      name: string;
    };
    isHistorical?: boolean; // True if approval doesn't match current m_approvals_item configuration
  }[];
  nextApprover: {
    line: number;
    department: {
      id: string;
      name: string;
    };
    jobPosition: {
      id: string;
      name: string;
    };
  } | null;
  allApprovalLines: {
    line: number;
    department: {
      id: string;
      name: string;
    };
    jobPosition: {
      id: string;
      name: string;
    };
    status: 'completed' | 'current' | 'pending';
  }[];
  currentStatus: string;
}
