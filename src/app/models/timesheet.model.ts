// src/app/models/timesheet.model.ts
export interface Timesheet {
  id: number;
  userId: number;
  date: Date;
  clockIn: string;
  clockOut: string;
  pauseStart?: string;
  pauseEnd?: string;
  totalHours: number;
  status: 'completed' | 'in-progress' | 'absent';
}

export interface DashboardStats {
  hoursWorked: number;
  pausesTaken: number;
  avgArrival: string;
  avgDeparture: string;
  attendanceRate: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}
