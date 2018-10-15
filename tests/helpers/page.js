const puppeteer = require('puppeteer');
const userFactory = require('./../factories/userFactory');
const sessionFactory = require('./../factories/sessionFactory');

/**
 * Combine puppeteer Page class with custom interface
 * using ES6 Proxy
 */
class CustomPage {
  static async build() {
    // launch Chromium browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    // create page object from browser
    const page = await browser.newPage();
    // instantiate a Custompage
    const customPage = new CustomPage(page);

    // combine access to all three in Proxy
    return new Proxy(customPage, {
      get: function(target, property) {
        return customPage[property] || browser[property] || page[property];
      }
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    // create new MongoDB user and generate session info
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    // set cookies with session info
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });

    // refresh page & wait for element to load
    await this.page.goto('http://localhost:3000/blogs');
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  get(path) {
    // explicitly pass path arg to evaluate function
    // otherwise context will be lost when evaluated in Chromium
    return this.page.evaluate(_path => {
      return fetch(_path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());
    }, path);
  }

  post(path, data) {
    return this.page.evaluate(
      (_path, _data) => {
        return fetch(_path, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(_data)
        }).then(res => res.json());
      },
      path,
      data
    );
  }

  /**
   * Execute multiple requests on page
   */
  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data);
      })
    );
  }
}

module.exports = CustomPage;
