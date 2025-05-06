import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    name: string;
    department?: string;
    image?: string;
  }

  interface Session {
    user: User & {
      id: string;
      role: Role;
    };
    redirectPath?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
  }
}
