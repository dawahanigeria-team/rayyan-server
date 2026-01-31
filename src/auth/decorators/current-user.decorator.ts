import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return null;

    // If a specific property is requested (e.g., 'sub' for user ID)
    if (data) {
      return user[data];
    }

    return user;
  },
);
