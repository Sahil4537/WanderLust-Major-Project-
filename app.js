if(process.env.NODE_ENV != "production") {
  require("dotenv").config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");  //y help krta hai template/layout ko create krne m.
const ExpressError = require("./utils/ExpressError.js");
const { wrap } = require("module");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


app.get('/', (req, res) => {
    res.send('Welcome to Wanderlust! Your server is working.');
});

//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

mongoose.connect(dbUrl, {
  useNewUrlParser: false,
  useUnifiedTopology: false,
  serverSelectionTimeoutMS: 30000, // Give it 30 seconds to connect
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('MongoDB connected successfully!');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});



main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));



const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("Error in mongo-session store", err)
});

const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie:{
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(cors());

app.use((req, res, next) =>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

const validateReview = (req, res, next) => {
  let {error} = reviewSchema.validate(req.body);  //yeh line schema validate krri gi with the help of joi.
  if(error) {  //joi ne individual fields k upr validation error apply krdia.
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(404, errMsg);
  } else {
    next();
  }
};

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

app.all("/*splat", (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
  let{status=500, message="Somthing went wrong."} = err;
  res.status(status).render("error.ejs", {err});
  //res.status(status).send(message);
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});

