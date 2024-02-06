import { NextFunction, Request, Response } from 'express';

import httpError from 'http-errors';


export function view(file: string, subtitle?: string)
{	
	return async function (_: Request, res: Response, next: NextFunction)
	{
		if (subtitle) {
			res.setSubtitle(subtitle);
		}

		try {
			await res.renderEta(file);

		} catch (e) {
			next(httpError(500, e));
		}
	}
}

export function handle(func: (req: Request, res: Response, next: NextFunction) => Promise<any>)
{
	return async function (req: Request, res: Response, next: NextFunction)
	{
		try {
			await func(req, res, next);

		} catch (e) {
			next(httpError(500, e));
		}
	}
}
