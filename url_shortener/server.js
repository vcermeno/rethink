const express = require("express");
const app = express();
const path = require("path");

const PORT = 3000;
const site = process.env.SITE || `localhost:${PORT}`;

const shortid = require("shortid");
const redis = require("redis");
const client = redis.createClient();

app.use(express.json());

// home page - currently purposeless
app.get("/", (req, res) => {
  res.status(200).sendFile(path.resolve(__dirname, "./index.html"));
});

// get short url from a long url
app.post("/url", async (req, res, next) => {
  const { url: longUrl } = req.body;
  const shortId = shortid.generate();
  const shortUrl = `${site}/url/${shortId}`;
  try {
    await client.set(shortUrl, longUrl, redis.print);
  } catch {
    client.on("error", function (err) {
      return next(err);
    });
  }
  return res.status(200).json({ shortUrl });
});

// redirect short url to long url
app.get("/url/:id", async (req, res, next) => {
  const { id } = req.params;
  shortUrl = `${site}/url/${id}`;
  await client.get(shortUrl, (err, reply) => {
    if (err) {
      return next(err);
    }
    if (reply === null) {
      return res
        .status(406)
        .send("Invalid url saved. Please create new URL with 'http://'");
    }
    console.log("redirecting here", reply);
    return res.redirect(reply);
  });
});

// 404 page
app.use("*", (err, req, res, next) => {
  return res.sendStatus(404);
});

// global error handler
app.use((err, req, res, next) => {
  const defaultErr = {
    log: "Express error handler caught unknown middleware error",
    status: 400,
    message: { err: "An error occurred" },
  };
  let errorObj = Object.assign({}, defaultErr, err);
  console.error("error object", errorObj.log);
  return res.status(errObj.status).send(errorObj.message);
});

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = app;
