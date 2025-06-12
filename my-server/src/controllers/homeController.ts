import { Request, Response } from 'express';

export const getHome = (req: Request, res: Response) => {
  res.send('Welcome to Node + Express + TypeScript MVC!');
};
