import { Request, Response, NextFunction } from 'express';
import * as weatherService from './service';
import type { WeatherQuery } from './types';

export async function getWeather(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lon } = req.query as unknown as WeatherQuery;
    const result = await weatherService.getCurrentWeather(lat, lon);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}
