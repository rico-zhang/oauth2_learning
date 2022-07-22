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
/* psot请求配置 */
const bodyParser = require('koa-bodyparser');
app.use(bodyParser({ formLimit: '8mb' }));

const router = Router();
const client_id = '3ba54f0ae62075872db7';
const client_secret = 'cb9ce266b04b7fa359c6eb68319ada5eb3920f1c';

const msdl_secret = '5d3ea83b3ffc484e8a975a440722ef66';
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

router.get('/loginByWX', async (ctx) => {
  ctx.redirect(
    'https://open.weixin.qq.com/connect/qrconnect?appid=wxbdc5610cc59c1631&redirect_uri=https%3A%2F%2Fpassport.yhd.com%2Fwechat%2Fcallback.do&response_type=code&scope=snsapi_login&state=3d6be0a4035d839573b04816624a415e#wechat_redirect'
  );
});

router.get('/loginByWXMSDL', async (ctx) => {
  let result = await axios.get(
    `https://server01.vicy.cn/8lXdSX7FSMykbl9nFDWESdc6zfouSAEz/wxLogin/tempUserId?secretKey=${msdl_secret}`
  );
  result = result.data;
  const {
    data: { qrCodeReturnUrl, tempUserId },
  } = result;
  ctx.body = {
    code: 0,
    data: {
      qrCodeReturnUrl,
      tempUserId,
    },
  };
});

router.post('/wxmsdlcallback', async (ctx) => {
  userInfo = {
    avatar_url: ctx.request.body.avatar,
    nickname: ctx.request.body.nickname,
    tempUserId: ctx.request.body.tempUserId,
    userId: ctx.request.body.userId,
  };
  ctx.body = {
    errcode: 0,
    message: '成功了',
  };
});

router.get('/getWXMSDLUserInfo', async (ctx) => {
  if (userInfo.avatar_url) {
    ctx.body = {
      code: 0,
      userInfo,
    };
  } else {
    ctx.body = {
      code: 1,
      message: '未获取成功',
    };
  }
});

app.use(router.routes());

//这里测试 收集路由
// const baseRouter = require('./router/');
// app.use(baseRouter.routes());

app.listen(3000, () => {
  console.log('server is running on port 3000');
});
