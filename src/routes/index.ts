import { Request, Response, Router } from 'express';

import { view } from '../models/index.js';


const router = Router();

router.get('/', view('index'));


export default router;
