import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedApp } from '../guards/api-key.guard';

interface RequestWithApp extends Omit<Request, 'app'> {
  app: AuthenticatedApp;
}

export const CurrentApp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedApp => {
    const request = ctx.switchToHttp().getRequest<RequestWithApp>();
    return request.app;
  },
);
