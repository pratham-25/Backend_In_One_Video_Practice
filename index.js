import { log } from "console";
import express from "express";
import { dirname } from "path"; // to use dirname in es6
import { fileURLToPath } from "url";
import mongoose, { Mongoose } from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const __dirname = dirname(fileURLToPath(import.meta.url));

const users = [];

// creating server
const app = express();

// Setting Middleware
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Setting view engine
app.set("view engine", "ejs");

// Middleware for authentication
const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    const decoded = jwt.verify(token, "prathamauthkey");
    req.user = await User.findById(decoded._id);
    console.log(req.user);

    next();
  } else {
    res.redirect("/login");
  }
};

// Creating and connecting with db
mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "backend",
  })
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", UserSchema);

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name: name,
    email: email,
    password: hashedPassword,
  });

  const token = jwt.sign({ _id: user._id }, "prathamauthkey");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect("/");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email: email });
  if (!user) return res.redirect("/register");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render("login", {
      email: email,
      message: "*Incorrect Password",
    });
  }

  const token = jwt.sign({ _id: user._id }, "prathamauthkey");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect("/");
});

app.post("/", async (req, res) => {
  // console.log(req.body);

  users.push({
    userName: req.body.user_name,
    userEmail: req.body.user_email,
  });

  const { user_name, user_email } = req.body;

  await msg.create({ name: user_name, email: user_email });

  res.redirect("/success");
});

app.listen(5000, () => {
  console.log("Server started at port 5000");
});
