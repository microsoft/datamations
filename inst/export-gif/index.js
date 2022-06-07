const fs = require("fs");
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ devtools: false });
  const page = await browser.newPage();

  // put shiny app url here
  await page.goto("http://localhost:8080/test/");

  console.log("Generating gif...")

  const gif = await page.evaluate(() => {
    // access window property here
    return window.app.exportGif();
  });
  
  console.log("Done.")

  const buffer = Buffer.from(gif.replace(/^data:image\/gif;base64,/,""), "base64");
  await fs.writeFile("./exported.gif", buffer, function (err, result) {
    if (err) console.log("error", err);
  });

  await browser.close();
})();
