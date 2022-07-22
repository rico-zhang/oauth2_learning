const Koa = require('koa');
const Router = require('koa-router');
const staticFiles = require('koa-static');
const views = require('koa-views');
const path = require('path');
const axios = require('axios');
const qs = require('qs');

const app = new Koa();
app.use(staticFiles(path.resolve(__dirname, './public')));
app.use(views('views', { map: { html: 'ejs' } }));

const router = Router();
const client_id = '3ba54f0ae62075872db7';
const client_secret = 'cb9ce266b04b7fa359c6eb68319ada5eb3920f1c';
let userInfo = {};
router.get('/', async (ctx) => {
  await ctx.render('home', { userInfo });
});
router.get('/login', async (ctx) => {
  await ctx.render('login');
});

router.get('/loginByGithub', async (ctx) => {
  ctx.redirect(
    `https://github.com/login/oauth/authorize?client_id=${client_id}&state=test`
  );
});

router.get('/api/gitcallback', async (ctx) => {
  const { code, state } = ctx.query;
  console.log(code, state);
  const result = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id,
      client_secret,
      code,
    },
    {
      headers: {
        accept: 'application/json',
      },
    }
  );
  const { access_token } = result.data;
  userInfo = await axios.get('https://api.github.com/user', {
    headers: {
      Authorization: 'token ' + access_token,
    },
  });
  userInfo = userInfo.data;
  ctx.redirect('/');
});

app.use(router.routes());

app.listen(3000, () => {
  console.log('server is running on port 3000');
});
