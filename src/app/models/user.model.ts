// src/app/models/user.model.ts
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'employee' | 'manager';
}
