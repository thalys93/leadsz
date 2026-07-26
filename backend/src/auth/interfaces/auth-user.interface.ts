import { Roles } from 'src/enums/Roles';
import { CompanyRole } from 'src/enums/CompanyRole';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  roles: Roles[];
  companyId?: string | null;
  companyRole?: CompanyRole | null;
}
