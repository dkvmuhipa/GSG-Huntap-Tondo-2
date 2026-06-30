import appPromise from '../server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
