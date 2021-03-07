const puppeteer = require("puppeteer");
const $ = require("cheerio");
const { CronJob, job } = require("cron");
const nodemailer = require("nodemailer");

const url = "https://www.amazon.in/dp/B07QXRCCCL/";

async function configureBrowser() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  return page;
}
async function checkPrice(page) {
  //not to consume more memory by creating a new page
  await page.reload();
  let html = await page.evaluate(() => document.body.innerHTML);
  //   console.log(html);
  $("#priceblock_ourprice", html).each(function () {
    let price = $(this).text();
    //console.log(price);
    let numCost = Number(price.substring(2));
    if (numCost > 500) {
      console.log("Costs HIGH");
      sendNotification(numCost);
    } else console.log("Costs low!!");
  });
}

async function sendNotification(price) {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "senders email",
      pass: "senders pass",
    },
  });
  let textToSend = "Price of racket dropped to " + price;
  let htmlText = `<a href=\"${url}">Link</a>`;

  var mailOptions = {
    from: "senders email",
    to: "recievers email",
    subject: "Price dropped to " + price,
    text: textToSend,
    html: htmlText,
  };

  let info = await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

async function startTracking() {
  const page = await configureBrowser();
  let job = new CronJob(
    "*/30 * * * * *",
    () => {
      checkPrice(page);
    },
    null,
    true,
    null,
    true
  );
  job.start();
}
startTracking();
// async function monitor() {
//   let page = await configureBrowser();
//   await checkPrice(page);
// }
// monitor();
