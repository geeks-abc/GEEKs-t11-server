import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// JwtAuthGuard가 심어둔 JWT payload (sub, email, role, storeId, facilityId)
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    return context.switchToHttp().getRequest()['user'];
  },
);
