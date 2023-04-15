import { Request, Response } from 'express';
import { User } from '../entity/user/User';

export interface RequestContext {
  token?: string;
  user?: User;
}
export const ContextMiddleware = async ({ req, res }: {req: Request, res: Response}) => {
  const token = req.headers.authorization || '';
  const user = await User.findOne({
    where: { token: req.headers.authorization },
  });
  if (user) {
    User.update({ id: user.id }, { last_login: new Date() });
    return {
      user: { ...user },
      token: token,
      ...req,
      ...res,
    };
  } else return { req, res };
};
