import { Request, Response, Router } from 'express';


const router = Router();


interface ViewOptions
{
	title?: string;
	headTags?: RobotoSkunk.HeadTag[]
}

function view(file: string, options: ViewOptions = {})
{
	return (req: Request, res: Response) =>
	{
		if (options.headTags) {
			res.addHeadTag(...options.headTags);
		}

		res.renderLayout(file);
	}
}


router.get('/', view('index', { headTags: [{ type: 'css', source: '/assets/css/index.css' }] }));


export default router;
