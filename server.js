require("dotenv").config();
const express = require("express");
const req = require("express/lib/request");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("./models/file");
const { request } = require("http");

const PORT = process.env.PORT || 3500;

const app = express();

const upload = multer({ dest: "uploads" });

mongoose.connect(process.env.DATABASE_URL);

app.use(express.urlencoded({ extended: true }));

// Set 'views' directory for any views
// being rendered res.render()
app.set("views", path.join(__dirname, "views"));

// Set view engine as EJS
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  };
  if (req.body.password != null && req.body.password != "") {
    fileData.password = await bcrypt.hash(req.body.password, 10);
  }

  const file = await File.create(fileData);
  res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` });
});

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
  const file = await File.findById(req.params.id);

  if (req.body.password != null) {
    if (req.body.password == null) {
      res.render("password");
      return;
    }

    if (await bcrypt.compare(req.body.password, file.password)) {
      res.render("password", { error: true });
      return;
    }
  }
  file.downloadCount++;
  await file.save();
  res.download(file.path, file.originalName);
}

app.listen(PORT, () => console.log("listening on port " + PORT));
