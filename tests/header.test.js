const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build(); // create page Proxy
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

test('The header has the correct text', async () => {
  const text = await page.getContentsOf('a.brand-logo');
  expect(text).toEqual('Blogster');
});

test('Clicking login starts oAuth flow', async () => {
  await page.click('.right a');
  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

test('When signed in, shows logout button', async () => {
  await page.login();
  // get logout element & test
  const text = await page.getContentsOf('a[href="/auth/logout"]');
  expect(text).toEqual('Logout');
});
